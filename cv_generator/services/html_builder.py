import re
import sys
import subprocess
from playwright.sync_api import sync_playwright


def strip_html_fences(text: str) -> str:
    """Remove markdown code fences if Gemini wraps output in ```html ... ```"""
    if not text:
        return ""
    text = re.sub(r"```html\n?|```\n?|```", "", text).strip()
    return text


def html_to_pdf(html_content: str) -> bytes:
    """
    Convert HTML+CSS to PDF using Playwright (Chromium).
    Renders exactly like a real browser — full CSS, Grid, Flexbox, Google Fonts.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ]
            )
            page = browser.new_page()
            page.set_content(html_content, wait_until="networkidle")

            pdf_bytes = page.pdf(
                format="A4",
                margin={
                    "top":    "1.5cm",
                    "bottom": "1.5cm",
                    "left":   "1.5cm",
                    "right":  "1.5cm",
                },
                print_background=True,
                prefer_css_page_size=False
            )

            browser.close()
            return pdf_bytes

    except Exception as e:
        raise ValueError(f"Playwright failed to convert HTML to PDF: {str(e)}")