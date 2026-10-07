"""No-network recipe adapter and chatbot context tests."""

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import app as backend
import mealdb

MEAL = {
    "idMeal": "52771",
    "strMeal": "Spicy pasta",
    "strArea": "Italian",
    "strCategory": "Vegetarian",
    "strIngredient1": "Pasta",
    "strMeasure1": "200 g",
    "strIngredient2": "",
    "strInstructions": "Boil pasta.\r\n\r\nAdd sauce.",
    "strMealThumb": "https://www.themealdb.com/images/media/meals/test.jpg",
    "strSource": "javascript:alert(1)",
}


class MealTests(unittest.TestCase):
    def setUp(self):
        self.client = backend.app.test_client()
        mealdb._cache.clear()

    def test_normalization(self):
        recipe = mealdb.normalize_meal(MEAL)
        self.assertEqual(recipe["id"], "mealdb-52771")
        self.assertEqual(recipe["ingredients"][0]["note"], "200 g")
        self.assertEqual(recipe["steps"], ["Boil pasta.", "Add sauce."])
        self.assertEqual(recipe["original_url"], "")
        self.assertEqual(mealdb.safe_url("https://evil.example/x.jpg", image=True), "")

    def test_search_and_errors(self):
        with patch.object(
            backend, "fetch_meals", return_value=[mealdb.normalize_meal(MEAL)]
        ) as fetch:
            response = self.client.get("/api/recipes?q=pasta")
            self.assertEqual(response.status_code, 200)
            fetch.assert_called_once_with("search.php", {"s": "pasta"})
        self.assertEqual(self.client.get("/api/recipes?q=a").status_code, 400)
        with patch.object(backend, "fetch_meals", return_value=[]):
            self.assertEqual(self.client.get("/api/recipes?q=nothing").json, {"recipes": []})
        with patch.object(backend, "fetch_meals", side_effect=mealdb.MealDBUnavailable):
            self.assertEqual(self.client.get("/api/recipes?q=pasta").status_code, 502)
        self.assertEqual(self.client.get("/api/recipes/not-an-id").status_code, 404)

    def test_cache_and_invalid_upstream(self):
        import json

        with patch.object(mealdb, "urlopen") as upstream:
            upstream.return_value.__enter__.return_value.read.return_value = json.dumps(
                {"meals": [MEAL]}
            ).encode()
            for _ in range(2):
                self.assertEqual(len(mealdb.fetch_meals("search.php", {"s": "pasta"})), 1)
            upstream.assert_called_once()
            self.assertEqual(upstream.call_args.kwargs["timeout"], 10)
            upstream.return_value.__enter__.return_value.read.return_value = b'{"unexpected":true}'
            with self.assertRaises(mealdb.MealDBUnavailable):
                mealdb.fetch_meals("search.php", {"s": "other"})

    def test_chat_uses_server_recipe(self):
        client = MagicMock()
        client.responses.create.return_value = SimpleNamespace(
            status="completed", output_text="Translation"
        )
        with (
            patch.dict("os.environ", {"OPENAI_API_KEY": "test"}),
            patch.object(backend, "lookup_meal", return_value=mealdb.normalize_meal(MEAL)),
            patch.object(backend, "OpenAI") as sdk,
        ):
            sdk.return_value.__enter__.return_value = client
            response = self.client.post(
                "/api/chat",
                json={
                    "language": "en",
                    "dish_id": "mealdb-52771",
                    "messages": [{"role": "user", "content": "Translate into Chinese"}],
                    "recipe": {"name": "Untrusted fake"},
                },
            )
        self.assertEqual(response.status_code, 200)
        context = client.responses.create.call_args.kwargs["instructions"]
        self.assertIn("Spicy pasta", context)
        self.assertIn("200 g", context)
        self.assertNotIn("Untrusted fake", context)


if __name__ == "__main__":
    unittest.main()
