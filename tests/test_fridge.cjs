// Browser storage tests without network requests or paid model calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../fridge.js'), 'utf8');
const key = 'cooking-story-fridge-v1';

function fixture(storage = new Map(), blocked = false) {
  const nodes = new Map();
  const handlers = {};
  function element() {
    return {
      value: '',
      children: [],
      textContent: '',
      hidden: false,
      attributes: {},
      focus() {},
      append(...items) {
        this.children.push(...items);
      },
      replaceChildren() {
        this.children = [];
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      addEventListener(name, handler) {
        this[name] = handler;
      },
    };
  }
  const q = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  };
  const context = vm.createContext({
    document: { querySelector: q, createElement: element },
    localStorage: {
      getItem(name) {
        if (blocked) throw Error('blocked');
        return storage.get(name) ?? null;
      },
      setItem(name, value) {
        if (blocked) throw Error('blocked');
        storage.set(name, value);
      },
    },
    window: {
      COOKING_STORY_CONFIG: { apiBaseUrl: '' },
      addEventListener(name, handler) {
        handlers[name] = handler;
      },
    },
    location: { protocol: 'https:' },
    AbortController,
    setTimeout: () => 1,
    clearTimeout() {},
    fetch: async () => {
      throw new Error('unexpected network request');
    },
    currentDish: null,
    renderChatContext() {},
    renderDetail() {},
    detailDialog: { showModal() {} },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cooking.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../mealdb.js'), 'utf8'), context);
  vm.runInContext(source, context);
  return {
    q,
    storage,
    handlers,
    context,
    add(name, amount = '') {
      q('#fridge-name').value = name;
      q('#fridge-amount').value = amount;
      q('#fridge-form').submit({ preventDefault() {} });
    },
    items: () => q('#fridge-list').children,
  };
}

const f = fixture();
assert.equal(f.q('#fridge-empty').hidden, false);
f.add('  Chicken  ', '500 g');
assert.equal(f.items()[0].children[0].textContent, 'Chicken · 500 g');
f.add('CHICKEN');
assert.equal(f.items().length, 1);
assert.equal(f.items()[0].children[0].textContent, 'Chicken · 500 g');
f.add('chicken', '200 g');
assert.equal(f.items()[0].children[0].textContent, 'Chicken · 200 g');
f.add('eggs', '3');
let reopened = fixture(f.storage);
assert.equal(reopened.items().length, 2, 'Reopening restores inventory');
assert.equal(reopened.items()[1].children[0].textContent, 'eggs · 3');
reopened.items()[0].children[1].children[0].click();
assert.equal(reopened.q('#fridge-name').value, 'Chicken');
reopened.q('#fridge-amount').value = '';
reopened.q('#fridge-form').submit({ preventDefault() {} });
assert.equal(reopened.items()[0].children[0].textContent, 'Chicken');
reopened.items()[0].children[1].children[1].click();
reopened = fixture(f.storage);
assert.equal(reopened.items().length, 1, 'Deletion survives reopening');
reopened.add('  ');
assert.equal(reopened.items().length, 1);
reopened.add('a'.repeat(61));
assert.equal(reopened.items().length, 1);
reopened.add('<img src=x onerror=alert(1)>');
assert.equal(reopened.items()[1].children[0].textContent, '<img src=x onerror=alert(1)>');
reopened.handlers.storage({
  key,
  newValue: JSON.stringify({ version: 1, ingredients: [{ name: 'rice', amount: '1 kg' }] }),
});
assert.equal(reopened.items()[0].children[0].textContent, 'rice · 1 kg');
reopened.handlers.storage({ key: null, newValue: null });
assert.equal(reopened.items().length, 0);
for (const raw of [
  'broken json',
  '{"version":1,"ingredients":[null]}',
  '{"version":2,"ingredients":[]}',
]) {
  const storage = new Map([[key, raw]]);
  const corrupted = fixture(storage);
  assert.equal(corrupted.items().length, 0);
  assert(corrupted.q('#fridge-status').textContent.includes('could not be loaded'));
  assert.equal(storage.get(key), raw, 'Do not overwrite corrupt data during initialization');
}
const blocked = fixture(new Map(), true);
blocked.add('tomatoes', '2');
assert.equal(blocked.items().length, 1);
assert(blocked.q('#fridge-status').textContent.includes('only kept for this visit'));
const limit = fixture();
for (let i = 0; i < 101; i++) limit.add(`item ${i}`);
assert.equal(limit.items().length, 100);
assert(limit.q('#fridge-status').textContent.includes('up to 100'));
async function testMatching() {
  const f = fixture();
  const button = f.q('#fridge-match');
  await button.click();
  assert(f.q('#fridge-match-status').textContent.includes('Add at least one'));
  f.add('chicken', '500 g');
  f.add('eggs', '3');
  const inventory = f.storage.get(key);
  const recipe = {
    id: 'mealdb-1',
    name: '<b>Test recipe</b>',
    region: 'Italian',
    category: 'Chicken',
    image: '',
    have: ['Chicken', 'Egg'],
    missing: ['Salt'],
    ingredients: [],
    steps: [],
  };
  const result = { recipes: [recipe], discovery_ingredients: ['chicken', 'egg'], partial: true };
  let calls = 0;
  f.context.fetch = async (url, options) => {
    calls++;
    assert.equal(url, '/api/recipes/match');
    assert.deepEqual(JSON.parse(options.body), { ingredients: ['chicken', 'eggs'] });
    return { ok: true, json: async () => result };
  };
  await button.click();
  const cards = f.q('#fridge-match-results').children;
  assert.equal(cards.length, 1);
  const content = cards[0].children[0];
  assert.equal(content.children[1].textContent, '<b>Test recipe</b>');
  assert(content.children[4].textContent.includes('Salt'));
  content.children[5].click();
  assert.equal(f.context.currentDish.id, 'mealdb-1');
  assert(f.q('#fridge-match-status').textContent.includes('partial'));
  assert.equal(f.storage.get(key), inventory, 'Matching never changes inventory');
  let finish;
  f.context.fetch = () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const pending = button.click();
  await button.click();
  assert.equal(calls, 2, 'Duplicate matching is blocked');
  f.add('rice');
  finish({ ok: true, json: async () => result });
  await pending;
  assert.equal(
    f.q('#fridge-match-results').children.length,
    0,
    'Discard stale results after fridge edit',
  );
  assert.equal(button.disabled, false);
  f.context.fetch = async () => {
    throw new Error('offline');
  };
  await button.click();
  assert(f.q('#fridge-match-status').textContent.includes('unavailable'));
  assert.equal(button.disabled, false);
  f.context.location.protocol = 'file:';
  await button.click();
  assert(f.q('#fridge-match-status').textContent.includes('Flask'));
  console.log(
    'PASS: matching request, inventory preservation, safe result cards, detail selection, partial results, duplicate prevention, stale result handling, errors, local-file guard.',
  );
}
testMatching().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

console.log(
  'PASS: fridge add/edit/remove, deduplication, reload persistence, validation, safe text, cross-tab updates, corrupt/blocked storage, capacity limit.',
);
