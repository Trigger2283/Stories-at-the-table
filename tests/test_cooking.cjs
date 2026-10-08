// Cooking state, step cleanup and exit behavior. No network or model calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const nodes = new Map();
const q = (selector) => {
  if (!nodes.has(selector))
    nodes.set(selector, {
      open: false,
      textContent: '',
      disabled: false,
      scrollTop: 0,
      style: {},
      classList: { toggle() {} },
      focus() {
        this.focused = true;
      },
      addEventListener(name, callback) {
        this[`on${name}`] = callback;
      },
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
        this.onclose?.();
      },
    });
  return nodes.get(selector);
};
const detailDialog = q('#dish-dialog');
detailDialog.open = true;
const context = vm.createContext({ document: { querySelector: q }, detailDialog });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../cooking.js'), 'utf8'), context);
const steps = vm.runInContext(
  "cookingSteps(['STEP 1', 'Cook at 180°C for 25 minutes.', 'Step 2:', 'Add 2 tbsp oil.\\nServe.', '3.', '第4步', '', null])",
  context,
);
assert.deepEqual(Array.from(steps), ['Cook at 180°C for 25 minutes.', 'Add 2 tbsp oil.', 'Serve.']);
context.recipe = {
  name: '<b>Pasta</b>',
  steps: ['Step 1', 'Boil 200 g pasta.', 'Step 2', 'Add sauce.'],
};
vm.runInContext('startCooking(recipe)', context);
assert.equal(q('#cooking-dialog').open, true);
assert.equal(detailDialog.open, false);
assert.equal(q('#cooking-title').textContent, '<b>Pasta</b>');
assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2');
assert.equal(q('#cooking-previous').disabled, true);
q('#cooking-next').onclick();
assert.equal(q('#cooking-step-text').textContent, 'Add sauce.');
q('#cooking-previous').onclick();
assert.equal(q('#cooking-step-text').textContent, 'Boil 200 g pasta.');
vm.runInContext('moveCookingStep(-1)', context);
assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2');
q('#cooking-next').onclick();
q('#cooking-next').onclick();
assert.equal(q('#cooking-step-title').textContent, 'Enjoy your meal!');
assert.equal(q('#cooking-next').disabled, true);
q('#cooking-next').onclick();
assert.equal(q('#cooking-step-title').textContent, 'Enjoy your meal!');
q('#cooking-previous').onclick();
assert.equal(q('#cooking-step-text').textContent, 'Add sauce.');
q('#exit-cooking').onclick();
assert.equal(q('#cooking-dialog').open, false);
assert.equal(detailDialog.open, true);
vm.runInContext('startCooking(recipe)', context);
assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2', 'New session starts at step 1');
q('#cooking-dialog').close(); // Native Escape triggers the same close event.
assert.equal(detailDialog.open, true);
vm.runInContext("startCooking({name: 'Empty', steps:['Step 1','']})", context);
assert.equal(q('#cooking-dialog').open, false);
console.log(
  'PASS: cooking step cleanup, preserved quantities, first/last bounds, next/previous, completion/backtracking, safe text, exit return, restart, empty steps.',
);

async function testMotion() {
  vm.runInContext('startCooking(recipe)', context);
  const handle = q('#cooking-swipe');
  const event = (x, y = 50) => ({
    pointerId: 1,
    clientX: x,
    clientY: y,
    button: 0,
    isPrimary: true,
  });
  handle.onpointerdown(event(150));
  handle.onpointermove(event(80));
  handle.onpointerup(event(80));
  assert.equal(q('#cooking-progress').textContent, 'Step 2 of 2');
  handle.onpointerdown(event(150));
  handle.onpointerup(event(220));
  assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2');
  handle.onpointerdown(event(150, 50));
  handle.onpointerup(event(150, 130));
  assert.equal(
    q('#cooking-progress').textContent,
    'Step 1 of 2',
    'Vertical gesture does not navigate',
  );
  handle.onpointerdown(event(150));
  handle.onpointerup(event(130));
  assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2');
  handle.onpointerdown(event(150));
  handle.onpointercancel();
  assert.equal(q('#cooking-card').style.transform, '');
  const animations = [];
  context.window = { matchMedia: () => ({ matches: false }) };
  q('#cooking-card').animate = () => {
    let resolve, reject;
    const finished = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    const animation = {
      finished,
      resolve,
      cancel() {
        reject(new Error('cancelled'));
      },
    };
    animations.push(animation);
    return animation;
  };
  const pending = vm.runInContext('moveCookingStep(1)', context);
  assert.equal(q('#cooking-next').disabled, true);
  await vm.runInContext('moveCookingStep(1)', context);
  assert.equal(animations.length, 1);
  animations[0].resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(animations.length, 2);
  animations[1].resolve();
  await pending;
  assert.equal(q('#cooking-progress').textContent, 'Step 2 of 2');
  const cancelled = vm.runInContext('moveCookingStep(-1)', context);
  q('#exit-cooking').onclick();
  vm.runInContext('startCooking(recipe)', context);
  await cancelled;
  assert.equal(q('#cooking-progress').textContent, 'Step 1 of 2');
  context.window.matchMedia = () => ({ matches: true });
  const count = animations.length;
  await vm.runInContext('moveCookingStep(1)', context);
  assert.equal(animations.length, count);
  assert.equal(q('#cooking-progress').textContent, 'Step 2 of 2');
  console.log(
    'PASS: swipe thresholds, reverse swipe, cancellation, transition locking, exit/restart race, reduced motion.',
  );
}
testMotion().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
