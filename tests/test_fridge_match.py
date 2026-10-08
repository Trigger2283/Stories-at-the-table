"""Free-API matching tests; upstream and timeouts are mocked."""

import unittest
from unittest.mock import patch

import app as backend
import fridge_match as matcher
from mealdb import MealDBUnavailable


def recipe(number, names):
    return {
        "id": f"mealdb-{number}",
        "name": f"Meal {number}",
        "ingredients": [{"name": name} for name in names],
    }


class MatchTests(unittest.TestCase):
    def test_names_are_conservative(self):
        available = {
            matcher.ingredient_key(name) for name in ["EGGS", "cherry tomato", "chicken", "cream"]
        }
        result = matcher.score_recipe(
            recipe(1, ["Egg", "Cherry Tomatoes", "Chicken Breast", "Sour Cream", "Salt"]), available
        )
        self.assertEqual(result["have"], ["Egg", "Cherry Tomatoes"])
        self.assertEqual(result["missing"], ["Chicken Breast", "Sour Cream", "Salt"])

    def test_discovery_dedup_ranking_and_no_input_mutation(self):
        items = {"1": recipe(1, ["chicken", "salt", "oil"]), "2": recipe(2, ["chicken", "eggs"])}

        def fetch(endpoint, params, **kwargs):
            return list(items.values()) if endpoint == "filter.php" else [items[params["i"]]]

        with patch.object(matcher, "fetch_meals", side_effect=fetch) as provider:
            result = matcher.match_recipes(["chicken", "EGGS", "egg"])
        self.assertEqual(result["discovery_ingredients"], ["chicken", "egg"])
        self.assertEqual([item["id"] for item in result["recipes"]], ["mealdb-2", "mealdb-1"])
        self.assertEqual(result["recipes"][0]["missing"], [])
        self.assertNotIn("have", items["2"])
        self.assertEqual(provider.call_count, 4)

    def test_limits_and_partial_failures(self):
        def fetch(endpoint, params, **kwargs):
            if endpoint == "filter.php":
                if params["i"] == "salt":
                    raise MealDBUnavailable()
                return [recipe(number, []) for number in range(1, 25)]
            return [recipe(int(params["i"]), ["chicken"])]

        with patch.object(matcher, "fetch_meals", side_effect=fetch) as provider:
            result = matcher.match_recipes(["chicken", "salt", "oil", "eggs", "rice", "sixth"])
        self.assertEqual(len(result["recipes"]), 12)
        self.assertTrue(result["partial"])
        self.assertEqual(len(result["discovery_ingredients"]), 5)
        self.assertLessEqual(provider.call_count, 17)
        with (
            patch.object(matcher, "fetch_meals", side_effect=MealDBUnavailable),
            self.assertRaises(MealDBUnavailable),
        ):
            matcher.match_recipes(["chicken"])
        with patch.object(matcher, "fetch_meals", return_value=[]):
            self.assertEqual(matcher.match_recipes(["unknown"])["recipes"], [])

    def test_route_validation(self):
        client = backend.app.test_client()
        for names in [None, [], [1], [" "], ["a" * 61], ["egg"] * 101]:
            self.assertEqual(
                client.post("/api/recipes/match", json={"ingredients": names}).status_code, 400
            )
        with patch.object(backend, "match_recipes", return_value={"recipes": []}) as match:
            self.assertEqual(
                client.post("/api/recipes/match", json={"ingredients": [" chicken "]}).status_code,
                200,
            )
            match.assert_called_once_with(["chicken"])
        with patch.object(backend, "match_recipes", side_effect=MealDBUnavailable):
            self.assertEqual(
                client.post("/api/recipes/match", json={"ingredients": ["egg"]}).status_code, 502
            )

    def test_deadline_stops_upstream_calls(self):
        with (
            patch.object(matcher.time, "monotonic", side_effect=[0, 26]),
            patch.object(matcher, "fetch_meals") as upstream,
            self.assertRaises(MealDBUnavailable),
        ):
            matcher.match_recipes(["chicken"])
        upstream.assert_not_called()


if __name__ == "__main__":
    unittest.main()
