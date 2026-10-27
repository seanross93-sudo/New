"""iPhone stock bot for John Lewis, the Apple Store UK and Amazon UK. One file, no config file.

Checks your iPhone listings every few minutes. When one comes back in stock
(at or below your target price), it sends a phone alert through the ntfy app and
opens a browser with the item in your basket. You check out yourself.

    python3 iphone_bot.py         keep checking until you press Ctrl+C
    python3 iphone_bot.py 60      keep checking for 60 minutes, then stop
"""

import json
import random
import re
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

# ---- Your settings ---------------------------------------------------------

NTFY_TOPIC = "sean-argos-7f3k2q9"
CHECK_EVERY_MINUTES = 10  # no lower than 5
ADD_TO_BASKET = True

# (name, product link, most you'll pay or None for any price)
# Links can be from johnlewis.com, apple.com/uk or amazon.co.uk.
# For Apple, pick the model, colour and storage on apple.com/uk first, then
# copy the link, so the page opens with Add to Bag ready.
PRODUCTS = [
    ("iPhone Duo 256GB Night Sky (John Lewis)",
     "https://www.johnlewis.com/apple-iphone-duo-ios-7-6-inch-5g-sim-free-256gb/night-sky/p115930230",
     None),
    # ("iPhone Duo 256GB Night Sky (Apple)", "https://www.apple.com/uk/shop/buy-iphone/...", None),
    # ("iPhone Duo 256GB Night Sky (Amazon)", "https://www.amazon.co.uk/dp/...", 999),
]

# ----------------------------------------------------------------------------

HERE = Path(__file__).resolve().parent
STATE_FILE = HERE / "iphone_state.json"
PROFILE_DIR = HERE / "browser-profile"

SHOPS = {
    "johnlewis.com": {"name": "John Lewis", "basket": "https://www.johnlewis.com/basket",
                      "button": r"add to (basket|bag)", "selector": None},
    "apple.com": {"name": "Apple", "basket": "https://www.apple.com/uk/shop/bag",
                  "button": r"add to bag", "selector": None},
    # Amazon's own buy-box button; other "Add to Basket" buttons on the page are for other items.
    "amazon.co.uk": {"name": "Amazon", "basket": "https://www.amazon.co.uk/gp/cart/view.html",
                     "button": r"add to (basket|cart)", "selector": "#add-to-cart-button"},
}
# Buttons in these sections belong to other products, not the one being watched.
OTHER_PRODUCTS = re.compile(
    r"recommend|recently|carousel|similar|related|also-?(like|bought|viewed)|upsell|cross-?sell"
    r"|complete-the-look|sponsored|bought-?together|bundle|sims-"
)
OUT_OF_STOCK = ("out of stock", "currently unavailable", "email me when", "notify me when", "sold out")


def shop_for(url):
    host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0].lower()
    for domain, shop in SHOPS.items():
        if host == domain or host.endswith("." + domain):
            return shop
    raise ValueError(f"Not a John Lewis, Apple or Amazon UK link: {url}")


def log(msg):
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def notify(title, message, url):
    req = urllib.request.Request(
        f"https://ntfy.sh/{NTFY_TOPIC}",
        data=message.encode("utf-8"),
        headers={"Title": title, "Priority": "high", "Tags": "shopping_cart", "Click": url},
    )
    try:
        urllib.request.urlopen(req, timeout=15)
    except OSError as e:
        log(f"Couldn't send the phone alert: {e}")


def page_price(html, text):
    """Price from the page's product data, else the first £ amount on the page."""
    for block in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            data = json.loads(block)
        except ValueError:
            continue
        nodes = data if isinstance(data, list) else data.get("@graph", [data]) if isinstance(data, dict) else []
        for node in nodes:
            if isinstance(node, dict) and "Product" in str(node.get("@type", "")):
                offers = node.get("offers") or {}
                offers = offers[0] if isinstance(offers, list) and offers else offers
                value = offers.get("price", offers.get("lowPrice")) if isinstance(offers, dict) else None
                try:
                    return float(str(value).replace(",", ""))
                except (TypeError, ValueError):
                    pass
    m = re.search(r"£\s*(\d{1,5}(?:,\d{3})*(?:\.\d{2})?)", text)
    return float(m.group(1).replace(",", "")) if m else None


def main_add_button(page, shop):
    """The watched product's own add button, if it's there and clickable."""
    if shop["selector"]:
        b = page.locator(shop["selector"]).first
        try:
            return b if b.count() and b.is_visible() and b.is_enabled() else None
        except Exception:
            return None
    buttons = page.get_by_role("button", name=re.compile(shop["button"], re.I))
    for i in range(min(buttons.count(), 20)):
        b = buttons.nth(i)
        try:
            if not (b.is_visible() and b.is_enabled()):
                continue
            where = b.evaluate("""el => {
                const names = [];
                for (let n = el; n && n !== document.body; n = n.parentElement)
                    names.push(n.id || "", typeof n.className === "string" ? n.className : "",
                               n.getAttribute("aria-label") || "", n.getAttribute("data-test") || "",
                               n.getAttribute("data-testid") || "");
                return {names: names.join(" ").toLowerCase(), top: el.getBoundingClientRect().top + window.scrollY};
            }""")
        except Exception:
            continue
        if not OTHER_PRODUCTS.search(where["names"]) and where["top"] <= 1500:
            return b
    return None


def open_page(page, url, shop):
    response = page.goto(url, wait_until="domcontentloaded", timeout=45000)
    if response is not None and response.status >= 400:
        raise RuntimeError(f"{shop['name']} refused the page, status {response.status}")
    title = page.title().lower()
    if any(w in title for w in ("access denied", "robot check", "just a moment", "captcha", "security check")):
        raise RuntimeError(f"{shop['name']} showed a security check instead of the product")
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass  # the page keeps background requests open; it's usable anyway


def check(page, url, shop):
    open_page(page, url, shop)
    text = re.sub(r"\s+", " ", page.inner_text("body")).lower()
    if "type the characters you see" in text or "enter the characters you see" in text:
        raise RuntimeError(f"{shop['name']} showed a security check instead of the product")
    in_stock = main_add_button(page, shop) is not None
    if not in_stock and not any(p in text for p in OUT_OF_STOCK):
        log("  (no Add to basket button and no out-of-stock message: treating as out of stock)")
    return page_price(page.content(), text), in_stock


def add_to_basket(pw, url, shop):
    browser = pw.chromium.launch_persistent_context(str(PROFILE_DIR), headless=False, locale="en-GB", viewport={"width": 1280, "height": 900})
    page = browser.pages[0] if browser.pages else browser.new_page()
    try:
        open_page(page, url, shop)
        button = main_add_button(page, shop)
        if button is None:
            raise LookupError
        button.click(timeout=15000)
        page.wait_for_timeout(3000)
        page.goto(shop["basket"], wait_until="domcontentloaded")
        log(f"Added to your {shop['name']} basket. Check out in the browser window, then close it.")
    except Exception:
        log(f"Couldn't add it to the {shop['name']} basket. The product page is open for you instead.")
    page.wait_for_event("close", timeout=0)  # wait until you close the window
    browser.close()


def open_window(pw):
    browser = pw.chromium.launch_persistent_context(str(PROFILE_DIR), headless=False, locale="en-GB", viewport={"width": 1280, "height": 900})
    # Use the window's own tab rather than a second one, so there's only one tab to leave alone.
    return browser, (browser.pages[0] if browser.pages else browser.new_page())


def check_all(pw, state):
    browser, page = open_window(pw)
    ready_now = []
    for name, url, target in PRODUCTS:
        try:
            shop = shop_for(url)
        except ValueError as e:
            log(str(e))
            continue
        try:
            price, in_stock = check(page, url, shop)
        except Exception as e:
            reason = (str(e).strip().splitlines() or [type(e).__name__])[0][:150]
            if "has been closed" not in reason:
                log(f"{name}: couldn't check ({reason})")
                continue
            # The window was closed (or the browser crashed) mid-check: reopen it and try once more.
            log(f"{name}: the browser window closed during the check, trying again. Leave the window alone; it closes by itself.")
            try:
                browser.close()
            except Exception:
                pass
            browser, page = open_window(pw)
            try:
                price, in_stock = check(page, url, shop)
            except Exception as e2:
                log(f"{name}: couldn't check ({(str(e2).strip().splitlines() or [type(e2).__name__])[0][:150]})")
                continue
        price_text = f"£{price:.2f}" if price is not None else "price unknown"
        log(f"{name}: {price_text}, {'in stock' if in_stock else 'out of stock'}")
        ready = in_stock and (target is None or (price is not None and price <= target))
        if ready and not state.get(url):
            notify(f"{shop['name']}: in stock", f"{name} is in stock at {price_text}", url)
            ready_now.append((url, shop))
        state[url] = ready
        time.sleep(random.uniform(3, 8))
    browser.close()
    STATE_FILE.write_text(json.dumps(state, indent=2))
    if ADD_TO_BASKET:
        for url, shop in ready_now:
            add_to_basket(pw, url, shop)


def main():
    from playwright.sync_api import sync_playwright

    minutes_arg = re.sub(r"[^\d.]", "", sys.argv[1]) if len(sys.argv) > 1 else ""
    stop_at = time.time() + float(minutes_arg) * 60 if minutes_arg else None
    every = max(5, CHECK_EVERY_MINUTES)
    try:
        state = json.loads(STATE_FILE.read_text())
    except (FileNotFoundError, ValueError):
        state = {}
    until = f" until {datetime.fromtimestamp(stop_at):%H:%M}" if stop_at else ""
    log(f"Checking {len(PRODUCTS)} iPhone listing(s) every {every} minutes{until}. Press Ctrl+C to stop.")
    with sync_playwright() as pw:
        while True:
            check_all(pw, state)
            wait = every * 60 * random.uniform(0.85, 1.15)
            if stop_at and time.time() + wait > stop_at:
                log("Finished.")
                return
            time.sleep(wait)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("Stopped.")
