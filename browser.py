import os
from pathlib import Path
from playwright.async_api import async_playwright

READABILITY_SCRIPT = ""

# Load readability.js once; continue without it if missing.
try:
    with open("readability.js", "r", encoding="utf8") as f:
        READABILITY_SCRIPT = f.read()
except FileNotFoundError:
    READABILITY_SCRIPT = ""


async def fetch_page(url: str):
    Path("screenshots").mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--disable-gpu"])
        context = await browser.new_context()
        page = await context.new_page()

        try:
            await page.goto(url, timeout=15000, wait_until="domcontentloaded")

            if READABILITY_SCRIPT:
                await page.add_script_tag(content=READABILITY_SCRIPT)

            # Extract content using Reader mode
            article = await page.evaluate("""
              () => {
                const documentClone = document.cloneNode(true);
                const reader = new Readability(documentClone);
                const parsed = reader.parse();
                return parsed;
              }
            """)

            # Fallbacks
            title = article.get("title") or (await page.title()) or url
            raw_text = article.get("textContent", "") if article else ""
            if not raw_text:
                raw_text = await page.inner_text("body")
            text = raw_text.strip()[:10000]
            excerpt = article.get("excerpt") if article else ""
            byline = article.get("byline") if article else ""

            # Screenshot
            screenshot_name = f"screenshot_{abs(hash(url))}.png"
            screenshot_path = f"screenshots/{screenshot_name}"
            await page.screenshot(path=screenshot_path, full_page=True)
        finally:
            await browser.close()

        snippet = excerpt or text[:180] or title

        return {
            "url": url,
            "title": title.strip(),
            "text": text.strip(),
            "snippet": snippet.strip(),
            "excerpt": excerpt or "",
            "byline": byline or "",
            "screenshot": screenshot_name,
        }
