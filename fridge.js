// Browser-only inventory. No API requests, accounts, or automatic deductions.
// Version the storage format so a future recipe matcher/database can migrate it.
(() => {
  const STORAGE_KEY = 'cooking-story-fridge-v1';
  const MAX_ITEMS = 100;
  const form = document.querySelector('#fridge-form');
  const nameInput = document.querySelector('#fridge-name');
  const amountInput = document.querySelector('#fridge-amount');
  const list = document.querySelector('#fridge-list');
  const status = document.querySelector('#fridge-status');
  let ingredients = [];
  let storageWarning = '';
  let editingKey = null;

  const normalize = (value) => value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  const nameKey = (value) => normalize(value).toLowerCase();

  function parseInventory(raw) {
    if (raw === null) return [];
    const data = JSON.parse(raw);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.ingredients) ||
      data.ingredients.length > MAX_ITEMS
    ) {
      throw new Error('Invalid inventory');
    }
    const seen = new Set();
    return data.ingredients.map((item) => {
      if (typeof item?.name !== 'string' || typeof item.amount !== 'string') {
        throw new Error('Invalid ingredient');
      }
      const name = normalize(item.name);
      const amount = normalize(item.amount);
      const key = nameKey(name);
      if (!name || name.length > 60 || amount.length > 40 || seen.has(key)) {
        throw new Error('Invalid ingredient');
      }
      seen.add(key);
      return { name, amount };
    });
  }

  function announce(message = '') {
    status.textContent = [message, storageWarning].filter(Boolean).join(' ');
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ingredients }));
      storageWarning = '';
    } catch {
      storageWarning =
        'Changes are only kept for this visit: browser storage is unavailable or full.';
    }
  }

  function render() {
    list.replaceChildren();
    document.querySelector('#fridge-empty').hidden = ingredients.length !== 0;
    ingredients.forEach((ingredient) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      // Stored user text is not trusted HTML.
      label.textContent = ingredient.amount
        ? `${ingredient.name} · ${ingredient.amount}`
        : ingredient.name;
      const actions = document.createElement('div');
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.setAttribute('aria-label', `Edit ${ingredient.name}`);
      edit.addEventListener('click', () => {
        nameInput.value = ingredient.name;
        amountInput.value = ingredient.amount;
        editingKey = nameKey(ingredient.name);
        nameInput.focus();
        announce(
          'Update the amount and choose Add / update. To rename, remove the old item first.',
        );
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${ingredient.name}`);
      remove.addEventListener('click', () => {
        ingredients = ingredients.filter(
          (entry) => nameKey(entry.name) !== nameKey(ingredient.name),
        );
        save();
        render();
        nameInput.focus();
        announce(`Removed ${ingredient.name}.`);
      });
      actions.append(edit, remove);
      item.append(label, actions);
      list.append(item);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = normalize(nameInput.value);
    const amount = normalize(amountInput.value);
    if (!name || name.length > 60 || amount.length > 40) {
      announce('Enter an ingredient (up to 60 characters) and an optional amount (up to 40).');
      return;
    }
    const existing = ingredients.find((item) => nameKey(item.name) === nameKey(name));
    if (existing) {
      // Adding the same name without an amount must not erase an existing amount.
      // Use Edit to clear an amount explicitly.
      if (amount || editingKey === nameKey(existing.name)) existing.amount = amount;
    } else {
      if (ingredients.length >= MAX_ITEMS) {
        announce(
          'Your fridge can hold up to 100 ingredients. Remove an item before adding another.',
        );
        return;
      }
      ingredients.push({ name, amount });
    }
    save();
    render();
    nameInput.value = '';
    amountInput.value = '';
    editingKey = null;
    nameInput.focus();
    announce(existing ? `Updated ${existing.name}.` : `Added ${name}.`);
  });

  try {
    ingredients = parseInventory(localStorage.getItem(STORAGE_KEY));
  } catch {
    storageWarning =
      'Saved ingredients could not be loaded. Existing storage is unchanged until you add or remove an item.';
  }
  render();
  announce();

  // Reflect changes from another tab without writing them back in a loop.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      ingredients = parseInventory(event.newValue);
      storageWarning = '';
      render();
      announce('Fridge updated from another tab.');
    } catch {
      announce(
        'Could not load the update from another tab. Your displayed ingredients are unchanged.',
      );
    }
  });
})();
