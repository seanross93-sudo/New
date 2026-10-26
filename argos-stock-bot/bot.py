"""Argos stock bot.

Watches Argos product pages, sends a phone notification when something comes
back in stock (or drops to your target price), then adds it to your trolley
in a signed-in browser so you only have to check out.

Commands:
    python bot.py login   Open a browser so you can sign in to Argos once.
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
PROFILE_DIR = HERE / "browser-profile"  # keeps your Argos sign-in between runs
BASKET_URL = "https://www.argos.co.uk/basket"
MIN_INTERVAL_MINUTES = 5  # be polite to Argos; faster checks risk getting blocked

OUT_OF_STOCK_PHRASES = (
    "out of stock",
    "currently unavailable",
    "not available for delivery or collection",
    "notify me when",
)


def log(msg):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def load_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def save_json(path, data):
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def argos_id(value):
    """Turn an Argos link, '937/4614' or '9374614' into the 7-digit catalogue number."""
    s = str(value).strip()
    m = re.search(r"argos\.co\.uk/product/(?:[^/?#]*/)?(\d{7})(?:[/?#]|$)", s, re.I)
    if m:
        return m.group(1)
    m = re.fullmatch(r"(\d{3})\s*/?\s*(\d{4})", s)
    if m:
        return m.group(1) + m.group(2)
    raise ValueError(f"Not an Argos product link or catalogue number: {value!r}")


def product_url(cat_no):
    return f"https://www.argos.co.uk/product/{cat_no}"


def parse_product_page(html):
    """Read price and stock from a product page's HTML.

    Prefers the schema.org product data Argos embeds for search engines and
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
        for node in data if isinstance(data, list) else [data]:
            if not isinstance(node, dict) or "Product" not in str(node.get("@type", "")):
                continue
            offers = node.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            if offers.get("price") not in (None, ""):
                try:
                    price = float(str(offers["price"]).replace(",", ""))
                except ValueError:
                    pass
            availability = str(offers.get("availability", ""))
            if availability:
                in_stock = availability.rstrip("/").split("/")[-1] in ("InStock", "LimitedAvailability")

    text = re.sub(r"<[^>]+>", " ", html).lower()
    if in_stock is None:
        if any(p in text for p in OUT_OF_STOCK_PHRASES):
            in_stock = False
        elif "add to trolley" in text:
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


def check_product(page, cat_no):
    page.goto(product_url(cat_no), wait_until="domcontentloaded", timeout=45000)
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass  # Argos keeps background requests open; the page is usable anyway
    return parse_product_page(page.content())


def add_to_trolley(playwright, cat_no):
    """Add the product to the trolley in a visible, signed-in browser and open the trolley."""
    browser = open_browser(playwright, headless=False)
    page = browser.pages[0] if browser.pages else browser.new_page()
    page.goto(product_url(cat_no), wait_until="domcontentloaded", timeout=45000)
    button = page.get_by_role("button", name=re.compile(r"add to trolley", re.I)).first
    try:
        button.click(timeout=15000)
        page.wait_for_timeout(3000)
        page.goto(BASKET_URL, wait_until="domcontentloaded")
        log("Added to trolley. Finish checkout in the browser window, then close it.")
        added = True
    except Exception:
        log("Couldn't find the Add to trolley button. The product page is open for you instead.")
        added = False
    page.wait_for_event("close", timeout=0)  # leave it open until you're done
    browser.close()
    return added


def check_all(playwright, config, state):
    products = config.get("products", [])
    if not products:
        log("No products in config.json yet.")
        return
    browser = open_browser(playwright, headless=True)
    page = browser.new_page()
    to_buy = []
    for p in products:
        cat_no = argos_id(p["argos"])
        name = p.get("name") or cat_no
        target = p.get("target_price")
        try:
            result = check_product(page, cat_no)
        except Exception as e:
            log(f"{name}: couldn't load the page ({e.__class__.__name__}).")
            continue
        price, in_stock = result["price"], result["in_stock"]
        prev = state.get(cat_no, {})
        price_text = f"£{price:.2f}" if price is not None else "price unknown"
        stock_text = {True: "in stock", False: "out of stock", None: "stock unknown"}[in_stock]
        log(f"{name} ({cat_no[:3]}/{cat_no[3:]}): {price_text}, {stock_text}")

        price_ok = target is None or (price is not None and price <= target)
        ready = in_stock is True and price_ok
        was_ready = prev.get("ready", False)
        state[cat_no] = {"price": price, "in_stock": in_stock, "ready": ready, "checked": datetime.now().isoformat(timespec="seconds")}

        if ready and not was_ready:
            msg = f"{name} is in stock at {price_text}" + (f" (target £{target:.2f})" if target else "")
            notify(config, "Argos: in stock", msg, product_url(cat_no))
            to_buy.append(cat_no)
        time.sleep(random.uniform(3, 8))  # space out page loads
    browser.close()
    save_json(STATE_FILE, state)

    if config.get("add_to_trolley", True):
        for cat_no in to_buy:
            add_to_trolley(playwright, cat_no)


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
            page = browser.pages[0] if browser.pages else browser.new_page()
            page.goto("https://www.argos.co.uk/account/login")
            log("Sign in to Argos in the browser window, then close it. Your sign-in is saved for later.")
            page.wait_for_event("close", timeout=0)
            browser.close()
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
