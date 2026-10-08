"""Limited free-API discovery and conservative ingredient-name matching."""

import time
import unicodedata

from mealdb import MealDBUnavailable, fetch_meals

# Explicit equivalences only. Never assume different cuts/types are substitutes.
ALIASES = {
    "eggs": "egg",
    "tomatoes": "tomato",
    "cherry tomatoes": "cherry tomato",
    "potatoes": "potato",
    "onions": "onion",
    "carrots": "carrot",
    "mushrooms": "mushroom",
    "garlic cloves": "garlic",
    "clove garlic": "garlic",
    "basil leaves": "basil",
    "fresh basil": "basil",
    "spring onions": "spring onion",
    "scallions": "spring onion",
}


def ingredient_key(name):
    cleaned = " ".join(unicodedata.normalize("NFKC", name).lower().replace("_", " ").split())
    return ALIASES.get(cleaned, cleaned)


def score_recipe(recipe, available):
    have, missing = [], []
    for item in recipe["ingredients"]:
        (have if ingredient_key(item["name"]) in available else missing).append(item["name"])
    return {**recipe, "have": have, "missing": missing}


def match_recipes(names):
    available = {ingredient_key(name) for name in names}
    anchors = list(dict.fromkeys(ingredient_key(name) for name in names))[:5]
    deadline = time.monotonic() + 25
    groups, failed = [], 0
    for anchor in anchors:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            failed += 1
            continue
        try:
            candidates = fetch_meals(
                "filter.php", {"i": anchor.replace(" ", "_")}, timeout=min(5, remaining)
            )
            groups.append([recipe["id"] for recipe in candidates])
        except MealDBUnavailable:
            failed += 1
    # Round-robin discovery prevents the first ingredient taking all result slots.
    candidate_ids = list(
        dict.fromkeys(group[index] for index in range(24) for group in groups if index < len(group))
    )[:12]
    results = []
    for dish_id in candidate_ids:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            failed += 1
            continue
        try:
            meals = fetch_meals(
                "lookup.php", {"i": dish_id.removeprefix("mealdb-")}, timeout=min(5, remaining)
            )
            recipe = next((meal for meal in meals if meal["id"] == dish_id), None)
            if recipe and recipe["ingredients"]:
                scored = score_recipe(recipe, available)
                if scored["have"]:
                    results.append(scored)
        except MealDBUnavailable:
            failed += 1
    if failed and not results:
        raise MealDBUnavailable()
    results.sort(
        key=lambda recipe: (len(recipe["missing"]), -len(recipe["have"]), recipe["name"].lower())
    )
    return {
        "recipes": results,
        "discovery_ingredients": anchors,
        "partial": bool(failed),
        "candidate_limit": 12,
    }
