"""Optional real Chrome layout checks; requires playwright, not a production dependency."""

import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from playwright.sync_api import sync_playwright
from werkzeug.serving import make_server

from app import app


def run():
    server = make_server("127.0.0.1", 0, app, threaded=True)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    output = Path(__file__).resolve().parents[1] / ".tools" / "mobile-qa"
    output.mkdir(parents=True, exist_ok=True)
    recipe = {
        "id": "mealdb-1",
        "name": "Chicken with a long ingredient list",
        "region": "Italian",
        "category": "Chicken",
        "source": "TheMealDB",
        "image": "",
        "source_url": "https://www.themealdb.com/meal/1",
        "original_url": "",
        "ingredients": [{"name": "Chicken", "note": "500 g"}],
        "steps": ["Cook following the original recipe instructions. " * 8] * 8,
        "have": ["Chicken"],
        "missing": ["Salt", "Olive oil"],
    }
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path="C:/Program Files/Google/Chrome/Application/chrome.exe",
                headless=True,
            )
            for width, height in [(320, 568), (390, 844), (768, 1024), (1280, 900)]:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    is_mobile=width < 600,
                    has_touch=width < 600,
                )
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                # No external requests, food API calls or paid model calls in this test.
                page.route("https://**/*", lambda route: route.abort())
                page.route(
                    "**/api/recipes?q=*", lambda route: route.fulfill(json={"recipes": [recipe]})
                )
                page.route(
                    "**/api/recipes/match",
                    lambda route: route.fulfill(
                        json={
                            "recipes": [recipe],
                            "discovery_ingredients": ["chicken"],
                            "partial": False,
                        }
                    ),
                )
                page.goto(f"http://127.0.0.1:{server.server_port}")
                page.locator("#fridge-name").fill("chicken")
                page.locator("#fridge-amount").fill("500 g")
                page.locator("#fridge-form button").click()
                page.reload()
                assert page.locator("#fridge-list").inner_text().find("500 g") >= 0
                page.locator("#fridge-match").click()
                page.locator("#fridge-match-results .dish-card").wait_for()
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (
                    f"Horizontal overflow: {width}"
                )
                page.locator("#fridge-match-results").screenshot(
                    path=str(output / f"cards-{width}.png")
                )
                page.locator("#recipe-search-input").fill("chicken")
                page.locator("#recipe-search-form button").click()
                page.locator("#recipe-results button").click()
                dialog = page.locator("#dish-dialog")
                assert dialog.is_visible()
                assert dialog.evaluate("(el) => el.scrollWidth <= el.clientWidth"), (
                    f"Dialog overflow: {width}"
                )
                dialog.evaluate("(el) => el.scrollTop = el.scrollHeight")
                close = page.locator("#close-detail").bounding_box()
                bounds = dialog.bounding_box()
                assert (
                    close["y"] >= bounds["y"]
                    and close["y"] + close["height"] <= bounds["y"] + bounds["height"]
                )
                page.screenshot(path=str(output / f"dialog-{width}.png"))
                page.locator("#start-cooking").click()
                cooking = page.locator("#cooking-dialog")
                assert cooking.is_visible()
                assert not dialog.is_visible()
                assert cooking.evaluate("(el) => el.scrollWidth <= el.clientWidth")
                page.locator("#cooking-next").click()
                page.wait_for_function(
                    "document.querySelector('#cooking-progress').textContent === 'Step 2 of 8'"
                )
                assert page.locator("#cooking-progress").inner_text() == "Step 2 of 8"
                page.locator("#cooking-previous").click()
                page.wait_for_function(
                    "document.querySelector('#cooking-progress').textContent === 'Step 1 of 8'"
                )
                assert page.locator("#cooking-progress").inner_text() == "Step 1 of 8"
                page.wait_for_function("!document.querySelector('#cooking-next').disabled")
                handle = page.locator("#cooking-swipe").bounding_box()
                x, y = handle["x"] + handle["width"] / 2, handle["y"] + handle["height"] / 2
                for delta, expected in [(-75, "Step 2 of 8"), (75, "Step 1 of 8")]:
                    page.mouse.move(x, y)
                    page.mouse.down()
                    page.mouse.move(x + delta, y, steps=8)
                    page.mouse.up()
                    page.wait_for_function(
                        '(text) => document.querySelector("#cooking-progress").textContent === text',
                        arg=expected,
                    )
                    page.wait_for_function("!document.querySelector('#cooking-next').disabled")
                page.locator(".cooking-card-scroll").evaluate(
                    "(el) => el.scrollTop = el.scrollHeight"
                )
                exit_bounds = page.locator("#exit-cooking").bounding_box()
                next_bounds = page.locator("#cooking-next").bounding_box()
                assert exit_bounds["y"] >= 0 and next_bounds["y"] + next_bounds["height"] <= height
                page.screenshot(path=str(output / f"cooking-{width}.png"))
                page.locator("#exit-cooking").click()
                dialog.wait_for(state="visible")
                assert dialog.is_visible()
                page.locator("#start-cooking").click()
                page.keyboard.press("Escape")
                dialog.wait_for(state="visible")
                assert dialog.is_visible() and not cooking.is_visible()
                page.mouse.click(2, 2)
                assert not dialog.is_visible()
                page.locator("#chat-toggle").click()
                panel = page.locator("#chat-panel")
                panel.wait_for(state="visible")
                chat = panel.bounding_box()
                assert chat["x"] >= 0 and chat["x"] + chat["width"] <= width + 1
                assert chat["y"] >= 0 and chat["y"] + chat["height"] <= height + 1
                input_bounds = page.locator("#chat-input").bounding_box()
                assert input_bounds["y"] + input_bounds["height"] <= height
                page.screenshot(path=str(output / f"chat-{width}.png"))
                assert not errors, errors
                print(
                    f"PASS: {width}x{height} layout, storage, matching, search, dialog/backdrop, chat bounds"
                )
                context.close()
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    run()
