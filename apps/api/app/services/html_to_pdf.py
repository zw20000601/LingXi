import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright


async def main(input_path: str, output_path: str) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(Path(input_path).resolve().as_uri(), wait_until="networkidle")
        await page.pdf(path=output_path, format="A4", print_background=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))
