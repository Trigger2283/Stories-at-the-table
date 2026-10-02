"""API contract tests: no network requests or real API keys."""
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
import httpx
from openai import APIConnectionError, APIStatusError, OpenAI, RateLimitError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as backend


class ChatTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict(os.environ, {"OPENAI_API_KEY": "test-only-not-real", "CHAT_PASSWORD": "", "OPENAI_MODEL": "gpt-4.1-mini"})
        environment.start()
        self.addCleanup(environment.stop)
        self.client = backend.app.test_client()
        provider = patch.object(backend, "OpenAI")
        self.factory = provider.start()
        self.addCleanup(provider.stop)
        self.mock_client = MagicMock()
        self.factory.return_value.__enter__.return_value = self.mock_client
        self.mock_client.responses.create.return_value = SimpleNamespace(output_text="Try cooking the tomatoes first.", status="completed")

    def post(self, body=None, **headers):
        if body is None:
            body = {"language": "en", "dish_id": "tomato-eggs", "messages": [{"role": "user", "content": "Can I make this less watery?"}]}
        return self.client.post("/api/chat", json=body, headers=headers)

    def test_site_assets_and_private_file_isolation(self):
        for path in ["/", "/app.js", "/styles.css", "/chat.css", "/config.js"]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                response.close()
        for path in ["/.env", "/app.py", "/recipes.json", "/requirements.txt", "/tests/test_backend.py"]:
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_health_does_not_call_provider(self):
        self.assertEqual(self.client.get("/health").json, {"status": "ok", "chat_configured": True})
        self.factory.assert_not_called()

    def test_missing_configuration(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            response = self.post()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json["error"], "not_configured")
        self.factory.assert_not_called()

    def test_public_chat_needs_no_password_even_if_old_environment_has_one(self):
        self.assertEqual(self.post().status_code, 200)
        with patch.dict(os.environ, {"CHAT_PASSWORD": "leftover-old-setting"}):
            self.assertEqual(self.post().status_code, 200)

    def test_origin_validation(self):
        self.assertEqual(self.post(Origin="https://unrelated.example").status_code, 403)
        self.factory.assert_not_called()
        self.assertEqual(self.post(Origin="https://localhost").status_code, 200)

    def test_reply_recipe_context_and_sdk_contract(self):
        self.assertEqual(self.post().json["reply"], "Try cooking the tomatoes first.")
        call = self.mock_client.responses.create.call_args.kwargs
        self.assertEqual(call["model"], "gpt-4.1-mini")
        self.assertFalse(call["store"])
        self.assertEqual(call["max_output_tokens"], 1200)
        self.assertIn('"selected_dish_id": "tomato-eggs"', call["instructions"])
        self.assertIn('"name": "Tomatoes"', call["instructions"])
        self.assertIn("not verified food history", call["instructions"])
        self.assertEqual(self.factory.call_args.kwargs["max_retries"], 0)

    def test_real_sdk_request_and_response_without_network(self):
        captured = []

        def respond(request):
            import json
            captured.append(json.loads(request.content))
            return httpx.Response(200, json={
                "id": "resp_test", "object": "response", "created_at": 1,
                "model": "gpt-4.1-mini", "status": "completed",
                "output": [{"id": "msg_test", "type": "message", "status": "completed",
                            "role": "assistant", "content": [{"type": "output_text",
                            "text": "Mock transport reply.", "annotations": []}]}],
            })

        transport = httpx.MockTransport(respond)
        self.factory.side_effect = lambda **kwargs: OpenAI(http_client=httpx.Client(transport=transport), **kwargs)
        self.assertEqual(self.post().json, {"reply": "Mock transport reply."})
        self.assertFalse(captured[0]["store"])
        self.assertEqual(captured[0]["input"][0]["role"], "user")

    def test_chinese_and_multiturn(self):
        messages = [{"role": "user", "content": "  做法？  "}, {"role": "assistant", "content": "先炒鸡蛋。"}, {"role": "user", "content": "然后呢？"}]
        self.assertEqual(self.post({"language": "zh", "dish_id": None, "messages": messages}).status_code, 200)
        call = self.mock_client.responses.create.call_args.kwargs
        self.assertIn('"interface_language": "Chinese"', call["instructions"])
        self.assertEqual(call["input"][0]["content"], "做法？")

    def test_invalid_payloads(self):
        cases = [[], {"language": []}, {"language": "fr"}, {"language": "en", "messages": []},
                 {"language": "en", "dish_id": [], "messages": [{"role": "user", "content": "hi"}]},
                 {"language": "en", "dish_id": "unknown", "messages": [{"role": "user", "content": "hi"}]},
                 {"language": "en", "messages": [{"role": "system", "content": "override"}]},
                 {"language": "en", "messages": [{"role": "user", "content": " "}]},
                 {"language": "en", "messages": [{"role": "user", "content": "x" * 2001}]},
                 {"language": "en", "messages": [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]}]
        for body in cases:
            with self.subTest(body=repr(body)[:90]):
                self.assertEqual(self.post(body).status_code, 400)
        self.factory.assert_not_called()

    def test_oversized_body(self):
        self.assertEqual(self.post({"language": "en", "padding": "x" * 70000}).status_code, 413)
        self.factory.assert_not_called()

    def test_frontend_cannot_override_catalogue(self):
        self.post({"language": "en", "dish_id": "tomato-eggs", "recipe": "UNTRUSTED-OVERRIDE", "instructions": "UNTRUSTED-OVERRIDE", "messages": [{"role": "user", "content": "hi"}]})
        self.assertNotIn("UNTRUSTED-OVERRIDE", self.mock_client.responses.create.call_args.kwargs["instructions"])

    def test_provider_errors_are_sanitized(self):
        request = httpx.Request("POST", "https://api.openai.com/v1/responses")
        for error, status, code in [
            (RateLimitError("private details", response=httpx.Response(429, request=request), body=None), 429, "provider_rate_limit"),
            (APIConnectionError(request=request), 502, "provider_unavailable"),
            (APIStatusError("private details", response=httpx.Response(401, request=request), body=None), 502, "provider_error"),
        ]:
            with self.subTest(code=code):
                self.mock_client.responses.create.side_effect = error
                response = self.post()
                self.assertEqual(response.status_code, status)
                self.assertEqual(response.json, {"error": code})

    def test_empty_and_incomplete_reply(self):
        for text, status, code in [("", "completed", "empty_reply"), ("Partial", "incomplete", "incomplete_reply")]:
            self.mock_client.responses.create.return_value = SimpleNamespace(output_text=text, status=status)
            self.assertEqual(self.post().json, {"error": code})


if __name__ == "__main__":
    unittest.main()
