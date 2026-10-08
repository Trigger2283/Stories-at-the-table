# Stories at the Table

A cooking website for finding recipes, keeping track of ingredients, and following recipes one step at a time. The interface is currently in English. A kitchen chatbot can answer questions or translate a selected recipe into Chinese or another language.

Built with HTML, CSS, JavaScript, and a Python Flask backend hosted on Render.

## APIs and storage

| Service | What it does |
| --- | --- |
| [TheMealDB API](https://www.themealdb.com/api.php) | Provides recipe names, photos, ingredients, and instructions. This project uses the development/educational test key `1`. Review its terms before a different kind of release. |
| [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) | Powers the kitchen chatbot and translation. Requires your own API key and available API credit. |
| Browser `localStorage` | Saves fridge ingredients in the same browser. It is not an online database. |

Render hosts the website and backend. There is no food-history API or ingredient-ordering service connected yet.

## How to use the website

### Browse or search for recipes

- Browse the three sample dishes. Their category buttons filter these sample dishes only.
- In **Explore recipes from TheMealDB**, enter an English recipe name, such as `chicken`, `pasta`, or `Arrabiata`.
- Click **Search recipes**, then **View recipe** to see ingredients, instructions, and source links.
- Close the recipe with **Close recipe**, click the dimmed area outside it, or press `Esc`.

Search shows up to 24 results. Sample food stories are editorial examples, not verified historical research. External recipes do not include verified food history.

### Manage My Fridge

1. Enter an English ingredient name, such as `chicken` or `eggs`.
2. Optionally enter an amount, such as `500 g` or `3`.
3. Click **Add / update**.
4. Use **Edit** to change an amount, or **Remove** when an ingredient runs out.

Adding an existing ingredient with a new amount updates it instead of creating a duplicate. Names ignore capitalization and extra spaces. To rename an ingredient, remove the old entry and add the new one.

Your fridge holds up to 100 ingredients. It survives refreshes and reopening the same site in the same browser, but does not sync across devices or browsers. Clearing site data removes it; private browsing may not retain it. If saving is unavailable, the page warns that changes are kept only for the current visit.

### Find recipes using your fridge

1. Add your ingredients to **My Fridge**.
2. Click **Find recipes with my ingredients**.
3. Check **You have** and **Still needed** on each result.
4. Click **View recipe** to open a suggestion.

Recipes with fewer missing ingredients appear first. Matching checks ingredient names, **not whether your quantities are sufficient**. Salt and oil count as missing unless you add them. Some equivalent names, such as `egg` and `eggs`, are recognized; different meat cuts or ingredient types are not automatically substitutes.

This is a limited search: the first five distinct fridge ingredients discover candidates, then all fridge ingredients are compared with up to 12 recipes. It does not search the entire recipe database. The page identifies the discovery ingredients and warns about partial results. Changing your fridge clears old results; click the button again for new suggestions.

### Cook with step cards

1. Open a recipe and click **Let's cook!**.
2. Read the current step. Long instructions scroll inside the card.
3. Click **Next step** or **Previous**, or use the keyboard's right/left arrow keys.
4. Alternatively, drag the **Swipe** area at the top of the card: **left for next, right for previous**. Use your finger on a phone or the mouse on a computer.
5. Click **Finish** on the last step to see the completion card.
6. Click **Exit cooking** or press `Esc` to return to the recipe.

Cards animate sideways. Reduced-motion settings disable the animation. Cooking mode does not run timers, confirm that food is cooked, deduct ingredients, or save progress. Starting again begins at step one. Follow the original recipe and check food safety before serving.

### Ask the kitchen assistant or translate a recipe

- Open **Kitchen assistant** to ask cooking questions or discuss substitutions.
- In an external recipe, click **Ask about this recipe** to prepare a question about the selected dish.
- Click **Translate this recipe** to prepare a Chinese translation request. Edit the request if you want another language.
- Click the send arrow to submit it. These shortcut buttons do not send automatically.
- Use **New chat** to clear the conversation and selected recipe context.

The backend supplies the selected recipe to the chatbot. Chat history clears on refresh. Replies can be inaccurate, so check important quantities and safety advice. Requests use the website owner's OpenAI API credit; visitors do not need their own key or a password.

### Use it on a phone

The layout adapts to smaller screens with single-column cards, stacked forms, larger controls, and a mobile chat panel. Open the same website URL on your phone; no separate app is needed.

## Run locally

You need Python and the project files. In PowerShell, open the `cooking-story` folder and run:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

If `.env` already exists, keep it instead of copying over it. Put your OpenAI settings in `.env`:

```text
OPENAI_API_KEY=your-real-api-key
OPENAI_MODEL=your-supported-model-id
```

Use a model available to your API project. Then start Flask:

```powershell
.\.venv\Scripts\python.exe app.py
```

Open **http://127.0.0.1:5001**. Without an OpenAI key, browsing, fridge storage, recipe search, and cooking mode still work; chat does not. Recipe search and matching need internet access.

**Do not double-click `index.html` for normal use.** Search, matching, and chat need Flask. Never put your real API key in frontend files or upload `.env` to GitHub.

## Deploy or update on Render

1. Upload the contents of `cooking-story` to your GitHub repository root, including all Python, JavaScript, CSS, HTML, JSON, and deployment files. Keep `tests`. Do not upload `.env`, `.venv`, `.tools`, or `__pycache__`.
2. Connect the repository to a Render **Python Web Service**.
3. Use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | Leave blank when project files are at the repository root |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 90` |
| Health Check Path | `/health` |

4. Set `OPENAI_API_KEY` and `OPENAI_MODEL` in Render's **Environment**. Keep existing working values when updating. Render supplies `PORT`.
5. Deploy and open the service URL. For updates, commit changed files to GitHub and check the new deployment; use **Manual Deploy → Deploy latest commit** if needed.

The default setup serves frontend and backend together. Leave `config.js`'s `apiBaseUrl` empty. If your repository contains the whole parent workspace, set Root Directory to `cooking-story` instead.

## Main files

| Files | Purpose |
| --- | --- |
| `index.html`, `styles.css` | Page structure and responsive layout |
| `app.js`, `recipes.json` | Sample recipes and page/chat behavior; keep sample data consistent |
| `app.py` | Flask routes and OpenAI chat requests |
| `mealdb.py`, `mealdb.js` | Recipe requests, search, and details |
| `fridge.js`, `fridge_match.py` | Fridge storage and recipe matching |
| `cooking.js`, `cooking.css` | Step cards, gestures, and animations |
| `chat.css`, `config.js` | Chat styles and optional separate backend URL |

## Tests (optional)

With Python dependencies installed and Node.js available, run from this folder:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"
node tests/test_frontend.cjs
node tests/test_fridge.cjs
node tests/test_cooking.cjs
```

These tests mock external services and do not make paid model calls. The optional `tests/check_mobile_layout.py` browser check also requires Playwright and local Chrome. Verify real API credentials and the deployed website separately.
