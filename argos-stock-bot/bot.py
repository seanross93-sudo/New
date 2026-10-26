"""Argos and John Lewis stock bot.

Watches product pages, sends a phone notification when something comes back
in stock (or drops to your target price), then adds it to your trolley or
basket in a signed-in browser so you only have to check out.

Commands:
    python bot.py login   Open a browser so you can sign in to each shop once.
    python bot.py check   Check every product once and exit.
    python bot.py run     Keep checking on a schedule (stop with Ctrl+C).
"""

import json
import random
import re
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONFIG_FILE = HERE / "config.json"
STATE_FILE = HERE / "state.json"
PROFILE_DIR = HERE / "browser-profile"  # keeps your shop sign-ins between runs
MIN_INTERVAL_MINUTES = 5  # be polite to the shops; faster checks risk getting blocked

OUT_OF_STOCK_PHRASES = (
    "out of stock",
    "currently unavailable",
    "not available for delivery or collection",
    "notify me when",
    "email me when",
)

STORES = {
    "argos": {
        "name": "Argos",
        "home": "https://www.argos.co.uk/",
        "basket": "https://www.argos.co.uk/basket",
        "add_button": r"add to trolley",
        "basket_word": "trolley",
    },
    "johnlewis": {
        "name": "John Lewis",
        "home": "https://www.johnlewis.com/",
        "basket": "https://www.johnlewis.com/basket",
        "add_button": r"add to (basket|bag)",
        "basket_word": "basket",
    },
}


def log(msg):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def load_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def save_json(path, data):
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def identify(value):
    """Work out the shop and product from a link (or an Argos catalogue number).

    Returns (store, product_id, url). Accepts Argos links, Argos catalogue
    numbers like '937/4614' or '9374614', and John Lewis links ending in /p<number>.
    """
    s = str(value).strip()
    m = re.search(r"argos\.co\.uk/product/(?:[^/?#]*/)?(\d{7})(?:[/?#]|$)", s, re.I)
    if m:
        return "argos", m.group(1), f"https://www.argos.co.uk/product/{m.group(1)}"
    m = re.fullmatch(r"(\d{3})\s*/?\s*(\d{4})", s)
    if m:
        cat_no = m.group(1) + m.group(2)
        return "argos", cat_no, f"https://www.argos.co.uk/product/{cat_no}"
    m = re.search(r"johnlewis\.com(/[^?#]*?/p(\d+))(?:[/?#]|$)", s, re.I)
    if m:
        return "johnlewis", m.group(2), "https://www.johnlewis.com" + m.group(1)
    raise ValueError(f"Not an Argos or John Lewis product link: {value!r}")


def product_label(store, product_id):
    if store == "argos":
        return f"Argos {product_id[:3]}/{product_id[3:]}"
    return f"John Lewis p{product_id}"


def parse_product_page(html, add_button=r"add to (trolley|basket|bag)"):
    """Read price and stock from a product page's HTML.

    Prefers the schema.org product data shops embed for search engines and
    falls back to the visible page text. Returns {"price", "in_stock"}; either
    can be None when the page doesn't say.
    """
    price, in_stock = None, None
    for block in re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S | re.I
    ):
        try:
            data = json.loads(block)
        except ValueError:
            continue
        nodes = data if isinstance(data, list) else data.get("@graph", [data]) if isinstance(data, dict) else []
        for node in nodes:
            if not isinstance(node, dict) or "Product" not in str(node.get("@type", "")):
                continue
            offers = node.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            offer_price = offers.get("price", offers.get("lowPrice"))
            if offer_price not in (None, ""):
                try:
                    price = float(str(offer_price).replace(",", ""))
                except ValueError:
                    pass
            availability = str(offers.get("availability", ""))
            if availability:
                in_stock = availability.rstrip("/").split("/")[-1] in ("InStock", "LimitedAvailability")

    text = re.sub(r"<[^>]+>", " ", html).lower()
    if in_stock is None:
        if any(p in text for p in OUT_OF_STOCK_PHRASES):
            in_stock = False
        elif re.search(add_button, text):
            in_stock = True
    if price is None:
        m = re.search(r"£\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)", text)
        if m:
            price = float(m.group(1).replace(",", ""))
    return {"price": price, "in_stock": in_stock}


def notify(config, title, message, url=None):
    topic = config.get("ntfy_topic")
    if not topic:
        log(f"NOTIFY: {title} - {message}")
        return
    req = urllib.request.Request(
        f"https://ntfy.sh/{topic}",
        data=message.encode("utf-8"),
        headers={"Title": title, "Priority": "high", "Tags": "shopping_cart", **({"Click": url} if url else {})},
    )
    try:
        urllib.request.urlopen(req, timeout=15)
    except OSError as e:
        log(f"Couldn't send the phone notification: {e}")


def open_browser(playwright, headless):
    return playwright.chromium.launch_persistent_context(
        str(PROFILE_DIR),
        headless=headless,
        locale="en-GB",
        viewport={"width": 1280, "height": 900},
    )


def check_product(page, store, url):
    page.goto(url, wait_until="domcontentloaded", timeout=45000)
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass  # shops keep background requests open; the page is usable anyway
    return parse_product_page(page.content(), STORES[store]["add_button"])


def add_to_basket(playwright, store, url):
    """Add the product to the trolley or basket in a visible, signed-in browser and open it."""
    shop = STORES[store]
    browser = open_browser(playwright, headless=False)
    page = browser.pages[0] if browser.pages else browser.new_page()
    page.goto(url, wait_until="domcontentloaded", timeout=45000)
    button = page.get_by_role("button", name=re.compile(shop["add_button"], re.I)).first
    try:
        button.click(timeout=15000)
        page.wait_for_timeout(3000)
        page.goto(shop["basket"], wait_until="domcontentloaded")
        log(f"Added to your {shop['name']} {shop['basket_word']}. Finish checkout in the browser window, then close it.")
    except Exception:
        log(f"Couldn't find the {shop['name']} add button. The product page is open for you instead.")
    page.wait_for_event("close", timeout=0)  # leave it open until you're done
    browser.close()


def check_all(playwright, config, state):
    products = config.get("products", [])
    if not products:
        log("No products in config.json yet.")
        return
    browser = open_browser(playwright, headless=True)
    page = browser.new_page()
    to_buy = []
    for p in products:
        try:
            store, product_id, url = identify(p.get("url") or p.get("argos", ""))
        except ValueError as e:
            log(str(e))
            continue
        label = product_label(store, product_id)
        name = p.get("name") or label
        target = p.get("target_price")
        try:
            result = check_product(page, store, url)
        except Exception as e:
            log(f"{name}: couldn't load the page ({e.__class__.__name__}).")
            continue
        price, in_stock = result["price"], result["in_stock"]
        key = f"{store}:{product_id}"
        prev = state.get(key, {})
        price_text = f"£{price:.2f}" if price is not None else "price unknown"
        stock_text = {True: "in stock", False: "out of stock", None: "stock unknown"}[in_stock]
        log(f"{name} ({label}): {price_text}, {stock_text}")

        price_ok = target is None or (price is not None and price <= target)
        ready = in_stock is True and price_ok
        was_ready = prev.get("ready", False)
        state[key] = {"price": price, "in_stock": in_stock, "ready": ready, "checked": datetime.now().isoformat(timespec="seconds")}

        if ready and not was_ready:
            msg = f"{name} is in stock at {price_text}" + (f" (target £{target:.2f})" if target else "")
            notify(config, f"{STORES[store]['name']}: in stock", msg, url)
            to_buy.append((store, url))
        time.sleep(random.uniform(3, 8))  # space out page loads
    browser.close()
    save_json(STATE_FILE, state)

    if config.get("add_to_trolley", True):
        for store, url in to_buy:
            add_to_basket(playwright, store, url)


def main():
    from playwright.sync_api import sync_playwright

    cmd = sys.argv[1] if len(sys.argv) > 1 else "run"
    config = load_json(CONFIG_FILE, None)
    if config is None:
        sys.exit("config.json is missing. Copy config.example.json to config.json and add your products.")
    state = load_json(STATE_FILE, {})

    with sync_playwright() as pw:
        if cmd == "login":
            browser = open_browser(pw, headless=False)
            for i, shop in enumerate(STORES.values()):
                page = browser.pages[0] if i == 0 and browser.pages else browser.new_page()
                page.goto(shop["home"])
            log("Sign in to Argos and John Lewis in the browser tabs, then close the window. Your sign-ins are saved for later.")
            browser.wait_for_event("close", timeout=0)
        elif cmd == "check":
            check_all(pw, config, state)
        elif cmd == "run":
            minutes = max(MIN_INTERVAL_MINUTES, float(config.get("check_every_minutes", 10)))
            log(f"Checking every {minutes:g} minutes. Press Ctrl+C to stop.")
            while True:
                check_all(pw, config, state)
                time.sleep(minutes * 60 * random.uniform(0.85, 1.15))
        else:
            sys.exit(__doc__)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Stopped.")
