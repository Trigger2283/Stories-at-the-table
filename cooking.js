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
  cookingIndex = 0;
  returnToRecipe = detailDialog.open;
  if (returnToRecipe) detailDialog.close();
  document.querySelector('#cooking-title').textContent = recipe.name;
  renderCookingCard();
  cookingDialog.showModal();
  document.querySelector('#cooking-step-title').focus();
}

function moveCookingStep(direction) {
  const next = cookingIndex + direction;
  if (next < 0 || next > activeCookingSteps.length) return;
  cookingIndex = next;
  renderCookingCard();
  document.querySelector('#cooking-step-title').focus();
}

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
  if (returnToRecipe && !detailDialog.open) {
    detailDialog.showModal();
    const start =
      document.querySelector('#dish-detail #start-cooking') ||
      document.querySelector('#close-detail');
    start.focus();
  }
  returnToRecipe = false;
});
