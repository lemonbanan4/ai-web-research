from playwright.async_api import async_playwright
import os

READABILITY_SCRIPT = None

# Load readability.js once
with open("readability.js", "r", encoding="utf8") as f:
    READABILITY_SCRIPT = f.read()


async def fetch_page(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--disable-gpu"])
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto(url, timeout=15000, wait_until="domcontentloaded")

        # Inject Readability
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
        title = article.get("title") if article else await page.title()
        text = article.get("textContent", "") if article else await page.inner_text("body")
        excerpt = article.get("excerpt") if article else ""
        byline = article.get("byline") if article else ""

        # Screenshot
        screenshot_name = f"screenshot_{abs(hash(url))}.png"
        screenshot_path = f"screenshots/{screenshot_name}"
        await page.screenshot(path=screenshot_path, full_page=True)

        await browser.close()

        return {
            "url": url,
            "title": title or "",
            "text": text or "",
            "excerpt": excerpt or "",
            "byline": byline or "",
            "screenshot": screenshot_name,
        }
