// Guided cooking is page-local. No model requests, timers or inventory mutations.
function cookingSteps(rawSteps) {
  if (!Array.isArray(rawSteps)) return [];
  return (
    rawSteps
      .filter((step) => typeof step === 'string')
      .flatMap((step) => step.split(/\r?\n/))
      .map((step) => step.trim())
      // Remove heading-only lines, not quantities, temperatures or recipe wording.
      .filter(
        (step) => step && !/^(?:step\s*\d+\s*[:.)-]?|第\s*\d+\s*步\s*[:：]?|\d+[.)])$/i.test(step),
      )
  );
}

const cookingDialog = document.querySelector('#cooking-dialog');
let activeCookingSteps = [];
let cookingIndex = 0;
let returnToRecipe = false;
let cookingTransition = false;
let cookingSession = 0;
let cardAnimation = null;
let cardDrag = null;
const cookingCard = document.querySelector('#cooking-card');
const swipeHandle = document.querySelector('#cooking-swipe');
const reduceCookingMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function resetCardDrag() {
  cardDrag = null;
  if (cookingCard.style) {
    cookingCard.style.transform = '';
    cookingCard.style.opacity = '';
  }
}

function setCookingBusy(busy) {
  cookingTransition = busy;
  cookingCard.setAttribute?.('aria-busy', String(busy));
  document.querySelector('#cooking-previous').disabled = busy || cookingIndex === 0;
  document.querySelector('#cooking-next').disabled =
    busy || cookingIndex === activeCookingSteps.length;
}

function renderCookingCard() {
  const complete = cookingIndex === activeCookingSteps.length;
  document.querySelector('#cooking-progress').textContent = complete
    ? `All ${activeCookingSteps.length} steps reviewed`
    : `Step ${cookingIndex + 1} of ${activeCookingSteps.length}`;
  document.querySelector('#cooking-step-title').textContent = complete
    ? 'Enjoy your meal!'
    : `Step ${cookingIndex + 1}`;
  document.querySelector('#cooking-step-text').textContent = complete
    ? 'You have reached the end of the instructions. Check that your food is fully cooked before serving. You can return to the last step or exit to the recipe.'
    : activeCookingSteps[cookingIndex];
  document.querySelector('.cooking-card-scroll').scrollTop = 0;
  document.querySelector('#cooking-previous').disabled = cookingIndex === 0;
  document.querySelector('#cooking-next').disabled = complete;
  document.querySelector('#cooking-next').textContent =
    cookingIndex === activeCookingSteps.length - 1 ? 'Finish →' : 'Next step →';
  document.querySelector('.cooking-stack').classList.toggle('cooking-complete', complete);
}

function startCooking(recipe) {
  const steps = cookingSteps(recipe.steps);
  if (!steps.length || cookingDialog.open) return;
  activeCookingSteps = steps;
  cookingSession += 1;
  setCookingBusy(false);
  resetCardDrag();
  cookingIndex = 0;
  returnToRecipe = detailDialog.open;
  if (returnToRecipe) detailDialog.close();
  document.querySelector('#cooking-title').textContent = recipe.name;
  renderCookingCard();
  cookingDialog.showModal();
  document.querySelector('#cooking-step-title').focus();
}

async function moveCookingStep(direction) {
  const next = cookingIndex + direction;
  if (cookingTransition || !cookingDialog.open || next < 0 || next > activeCookingSteps.length)
    return;
  const session = cookingSession;
  const draggedTransform = cookingCard.style?.transform || 'none';
  const draggedOpacity = cookingCard.style?.opacity || 1;
  resetCardDrag();
  const animate = typeof cookingCard.animate === 'function' && !reduceCookingMotion();
  setCookingBusy(true);
  try {
    if (animate) {
      cardAnimation = cookingCard.animate(
        [
          { transform: draggedTransform, opacity: draggedOpacity },
          {
            transform: `translateY(${direction > 0 ? '-64px' : '64px'}) rotate(${direction > 0 ? '-4deg' : '4deg'}) scale(.96)`,
            opacity: 0,
          },
        ],
        { duration: 170, easing: 'ease-in', fill: 'forwards' },
      );
      await cardAnimation.finished;
      if (session !== cookingSession || !cookingDialog.open) return;
    }
    cookingIndex = next;
    renderCookingCard();
    setCookingBusy(true);
    cardAnimation?.cancel();
    if (animate) {
      cardAnimation = cookingCard.animate(
        [
          { transform: `translateY(${direction > 0 ? '32px' : '-32px'}) scale(.96)`, opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
      await cardAnimation.finished;
    }
    if (session === cookingSession && cookingDialog.open)
      document.querySelector('#cooking-step-title').focus();
  } catch {
    // Closing the dialog cancels animations; never update a new session afterward.
  } finally {
    if (session === cookingSession) {
      cardAnimation?.cancel();
      cardAnimation = null;
      setCookingBusy(false);
    }
  }
}

// Gestures are restricted to a visible handle: recipe text remains native scrolling.
swipeHandle.addEventListener('pointerdown', (event) => {
  if (cookingTransition || !cookingDialog.open || event.isPrimary === false || event.button !== 0)
    return;
  cardDrag = { id: event.pointerId, y: event.clientY, x: event.clientX, delta: 0 };
  swipeHandle.setPointerCapture?.(event.pointerId);
});
swipeHandle.addEventListener('pointermove', (event) => {
  if (!cardDrag || cardDrag.id !== event.pointerId) return;
  cardDrag.delta = event.clientY - cardDrag.y;
  if (Math.abs(event.clientX - cardDrag.x) > Math.abs(cardDrag.delta)) return;
  if (!reduceCookingMotion()) {
    const offset = Math.max(-100, Math.min(100, cardDrag.delta));
    cookingCard.style.transform = `translateY(${offset}px) rotate(${offset / 35}deg)`;
    cookingCard.style.opacity = String(1 - Math.abs(offset) / 250);
  }
});
swipeHandle.addEventListener('pointerup', (event) => {
  if (!cardDrag || cardDrag.id !== event.pointerId) return;
  const delta = event.clientY - cardDrag.y;
  const vertical = Math.abs(delta) > Math.abs(event.clientX - cardDrag.x) * 1.25;
  const direction = delta < 0 ? 1 : -1;
  const next = cookingIndex + direction;
  if (vertical && Math.abs(delta) >= 55 && next >= 0 && next <= activeCookingSteps.length) {
    moveCookingStep(direction);
  } else {
    resetCardDrag();
  }
});
swipeHandle.addEventListener('pointercancel', resetCardDrag);
swipeHandle.addEventListener('lostpointercapture', resetCardDrag);

document.querySelector('#cooking-previous').addEventListener('click', () => moveCookingStep(-1));
document.querySelector('#cooking-next').addEventListener('click', () => moveCookingStep(1));
document.querySelector('#exit-cooking').addEventListener('click', () => cookingDialog.close());
cookingDialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    moveCookingStep(event.key === 'ArrowRight' ? 1 : -1);
  }
});
// Handles the exit button and the native Escape action consistently.
cookingDialog.addEventListener('close', () => {
  cookingSession += 1;
  cardAnimation?.cancel();
  cardAnimation = null;
  setCookingBusy(false);
  resetCardDrag();
  if (returnToRecipe && !detailDialog.open) {
    detailDialog.showModal();
    const start =
      document.querySelector('#dish-detail #start-cooking') ||
      document.querySelector('#close-detail');
    start.focus();
  }
  returnToRecipe = false;
});
