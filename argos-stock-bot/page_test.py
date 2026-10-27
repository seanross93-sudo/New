"""Open one product page in a visible browser and show what the bot can see on it.

    python page_test.py "https://www.smythstoys.com/uk/en-gb/.../p/244166"
"""

import re
import sys

from playwright.sync_api import sync_playwright

STOCK_WORDS = ("out of stock", "sold out", "in stock", "unavailable", "coming soon", "notify me", "add to basket", "add to cart")
BUY_BUTTON = re.compile(r"add to (basket|cart|bag|trolley)|click|collect|reserve|deliver|buy", re.I)

if len(sys.argv) < 2:
    sys.exit('Put the product link after the command, in quotes: python page_test.py "LINK"')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    try:
        response = page.goto(sys.argv[1], timeout=45000)
    except Exception as e:
        sys.exit(f"Failed: {str(e).splitlines()[0]}")
    page.wait_for_timeout(8000)
    print("Status:", response.status if response else "none")
    print("Title:", page.title())
    print("Product data on page:", "application/ld+json" in page.content())
    buttons = page.get_by_role("button", name=BUY_BUTTON)
    print("Buy buttons:", [buttons.nth(i).inner_text().strip()[:40] for i in range(min(buttons.count(), 6))])
    text = re.sub(r"\s+", " ", page.inner_text("body"))
    print("Stock words:", sorted(w for w in STOCK_WORDS if w in text.lower()))
    print("Prices seen:", re.findall(r"£\d[\d,]*(?:\.\d\d)?", text)[:8])
    browser.close()
