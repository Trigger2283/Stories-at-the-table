"""TheMealDB adapter: fixed upstream URL and bounded 15-minute cache."""

import json
import re
import time
from collections import OrderedDict
from threading import Lock
from urllib.error import URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

BASE_URL = "https://www.themealdb.com/api/json/v1/1/"
_cache = OrderedDict()
_lock = Lock()


class MealDBUnavailable(Exception):
    """Upstream failed or returned invalid data."""


def safe_url(value, image=False):
    if not isinstance(value, str):
        return ""
    try:
        parsed = urlsplit(value)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username:
            return ""
        if image and parsed.hostname not in {"www.themealdb.com", "themealdb.com"}:
            return ""
    except ValueError:
        return ""
    return value


def normalize_meal(meal):
    def text(key):
        value = meal.get(key)
        return value.strip() if isinstance(value, str) else ""

    meal_id = text("idMeal")
    if not re.fullmatch(r"[0-9]{1,10}", meal_id) or not text("strMeal"):
        raise MealDBUnavailable()
    ingredients = []
    for number in range(1, 21):
        name = text(f"strIngredient{number}")
        if name:
            ingredients.append(
                {"name": name, "quantity": None, "unit": "", "note": text(f"strMeasure{number}")}
            )
    return {
        "id": f"mealdb-{meal_id}",
        "name": text("strMeal"),
        "region": text("strArea"),
        "category": text("strCategory"),
        "image": safe_url(text("strMealThumb"), image=True),
        "source": "TheMealDB",
        "source_url": f"https://www.themealdb.com/meal/{meal_id}",
        "original_url": safe_url(text("strSource")),
        "ingredients": ingredients,
        # Preserve original wording; don't invent timing, quantities or servings.
        "steps": [part.strip() for part in text("strInstructions").splitlines() if part.strip()],
    }


def fetch_meals(endpoint, params):
    key = (endpoint, tuple(sorted(params.items())))
    with _lock:
        entry = _cache.get(key)
        if entry and entry[0] > time.monotonic():
            _cache.move_to_end(key)
            return entry[1]
    req = Request(
        BASE_URL + endpoint + "?" + urlencode(params),
        headers={"User-Agent": "StoriesAtTheTable/1.0", "Accept": "application/json"},
    )
    try:
        with urlopen(req, timeout=10) as response:
            payload = response.read(2_000_001)
        if len(payload) > 2_000_000:
            raise MealDBUnavailable()
        data = json.loads(payload)
        if not isinstance(data, dict) or "meals" not in data:
            raise MealDBUnavailable()
        meals = data["meals"]
        if meals is None:
            result = []
        elif isinstance(meals, list) and all(isinstance(meal, dict) for meal in meals):
            result = [normalize_meal(meal) for meal in meals[:24]]
        else:
            raise MealDBUnavailable()
    except (URLError, TimeoutError, OSError, ValueError) as error:
        raise MealDBUnavailable() from error
    with _lock:
        _cache[key] = (time.monotonic() + 900, result)
        _cache.move_to_end(key)
        while len(_cache) > 128:
            _cache.popitem(last=False)
    return result


def lookup_meal(dish_id):
    if not isinstance(dish_id, str) or not re.fullmatch(r"mealdb-[0-9]{1,10}", dish_id):
        return None
    meals = fetch_meals("lookup.php", {"i": dish_id.removeprefix("mealdb-")})
    return next((meal for meal in meals if meal["id"] == dish_id), None)
