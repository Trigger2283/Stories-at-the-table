// External recipes stay separate from the manually curated story collection.
// All upstream text uses textContent, never HTML templates.
function mealElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function mealLink(label, url) {
  const link = mealElement('a', label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function mealImage(recipe) {
  const image = mealElement('img', '', 'meal-photo');
  image.src = recipe.image;
  image.alt = recipe.name;
  image.loading = 'lazy';
  return image;
}

function renderExternalDetail(recipe) {
  const detail = document.querySelector('#dish-detail');
  detail.replaceChildren();
  if (recipe.image) detail.append(mealImage(recipe));
  const title = mealElement('h2', recipe.name);
  title.id = 'detail-title';
  detail.append(
    title,
    mealElement('p', [recipe.region, recipe.category].filter(Boolean).join(' · '), 'meta'),
  );
  detail.append(mealLink('View on TheMealDB ↗', recipe.source_url));
  if (recipe.original_url)
    detail.append(mealElement('p'), mealLink('Original recipe source ↗', recipe.original_url));
  detail.append(
    mealElement('p', 'Food history is not provided by this recipe source.', 'sample-note'),
  );
  if (Array.isArray(recipe.have) && Array.isArray(recipe.missing)) {
    detail.append(
      mealElement('p', `You have: ${recipe.have.join(', ')}`, 'match-have'),
      mealElement(
        'p',
        recipe.missing.length
          ? `Still needed: ${recipe.missing.join(', ')}`
          : 'All ingredient names matched.',
        'match-missing',
      ),
      mealElement(
        'p',
        'This is a snapshot from your last fridge search. Quantities were not checked.',
        'fridge-note',
      ),
    );
  }
  detail.append(mealElement('h3', 'Ingredients'));
  const ingredients = mealElement('ul');
  recipe.ingredients.forEach((item) =>
    ingredients.append(mealElement('li', `${item.name} · ${item.note || 'Amount not specified'}`)),
  );
  detail.append(ingredients, mealElement('h3', 'Cooking instructions'));
  const steps = mealElement('ol');
  recipe.steps.forEach((step) => steps.append(mealElement('li', step)));
  detail.append(steps);
  if (!recipe.steps.length)
    detail.append(mealElement('p', 'Instructions are not available. Please check the source.'));
  const ask = mealElement('button', 'Ask about this recipe', 'button');
  const cook = mealElement('button', 'Let’s cook!', 'button');
  cook.id = 'start-cooking';
  cook.type = 'button';
  cook.disabled = cookingSteps(recipe.steps).length === 0;
  if (cook.disabled) cook.title = 'Cooking instructions are not available.';
  cook.addEventListener('click', () => startCooking(recipe));
  detail.append(cook);
  const translate = mealElement('button', 'Translate this recipe', 'button');
  ask.type = translate.type = 'button';
  function promptChat(text) {
    detailDialog.close();
    openChat();
    document.querySelector('#chat-input').value = text;
  }
  ask.addEventListener('click', () =>
    promptChat(`Help me understand the recipe for ${recipe.name}.`),
  );
  translate.addEventListener('click', () =>
    promptChat(
      '请将当前菜谱的食材和全部做法翻译成中文。保持原文的用量、单位、温度和时间，不要添加或修改步骤。',
    ),
  );
  detail.append(ask, translate);
}

const recipeSearchForm = document.querySelector('#recipe-search-form');
recipeSearchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.querySelector('#recipe-search-status');
  const query = document.querySelector('#recipe-search-input').value.trim();
  if (query.length < 2 || query.length > 80) {
    status.textContent = 'Enter a recipe name between 2 and 80 characters.';
    return;
  }
  const base = (window.COOKING_STORY_CONFIG?.apiBaseUrl || '').replace(/\/+$/, '');
  if (location.protocol === 'file:' && !base) {
    status.textContent = 'Open the site through Flask or its Render URL to search recipes.';
    return;
  }
  const button = recipeSearchForm.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  const results = document.querySelector('#recipe-results');
  results.replaceChildren();
  results.setAttribute('aria-busy', 'true');
  status.textContent = 'Searching TheMealDB…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 70000);
  try {
    const response = await fetch(`${base}/api/recipes?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      credentials: 'omit',
    });
    if (!response.ok) throw new Error('recipe_search_failed');
    const body = await response.json();
    if (!Array.isArray(body.recipes)) throw new Error('invalid_recipes');
    status.textContent = body.recipes.length
      ? `${body.recipes.length} recipes found (up to 24 shown).`
      : 'No recipes found. Try another English dish name.';
    body.recipes.forEach((recipe) => {
      const card = mealElement('article', '', 'dish-card');
      if (recipe.image) card.append(mealImage(recipe));
      const content = mealElement('div', '', 'card-body');
      const view = mealElement('button', 'View recipe ↗', 'text-button');
      view.type = 'button';
      view.addEventListener('click', () => {
        currentDish = recipe;
        renderChatContext();
        renderDetail();
        detailDialog.showModal();
      });
      content.append(
        mealElement('p', [recipe.region, recipe.category].filter(Boolean).join(' · '), 'meta'),
        mealElement('h3', recipe.name),
        view,
      );
      card.append(content);
      results.append(card);
    });
  } catch (error) {
    status.textContent =
      error.name === 'AbortError'
        ? 'The search timed out. Please try again.'
        : 'Recipe search is temporarily unavailable. Please try again.';
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
    results.setAttribute('aria-busy', 'false');
  }
});
