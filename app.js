// 1. 中文菜谱数据：历史和正式食谱发布前需要核实并添加来源。
// 修改菜谱时，同时更新服务器使用的 recipes.json；测试会核对两者一致。
const dishes = [
  {
    id: 'tomato-eggs',
    name: '番茄炒蛋',
    region: '中国 · 家常厨房',
    category: '家常',
    time: '约 15 分钟',
    emoji: '🍅 🥚',
    color: '#ecddcc',
    description: '酸甜的番茄遇上柔软的鸡蛋，一道从熟悉味道开始的厨房练习。',
    story:
      '一道家常菜的故事，有时藏在每个家庭不同的做法里。有人偏爱多一点汤汁，有人喜欢鸡蛋煎得更香。这里将以番茄炒蛋为入口，探索食材、家庭记忆与日常餐桌之间的联系。',
    ingredients: [
      { name: '番茄', quantity: 2, unit: '个' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
      { name: '食用油', quantity: 1, unit: '汤匙' },
      { name: '盐', quantity: null, unit: '', note: '按口味添加' },
    ],
    steps: [
      '番茄洗净切块；鸡蛋打入碗中，搅拌均匀。',
      '锅中放油，中火加热，倒入蛋液，炒至凝固后盛出。',
      '加入番茄，翻炒至变软出汁；需要时加少量水。',
      '倒回鸡蛋，加盐调味，炒匀并充分加热后盛出。',
    ],
  },
  {
    id: 'tomato-pasta',
    name: '番茄罗勒意面',
    region: '意大利风味 · 日常灵感',
    category: '轻食',
    time: '约 25 分钟',
    emoji: '🍝 🌿',
    color: '#e2e5d4',
    description: '用几种简单食材，做一盘带着番茄香气和草本清新的意面。',
    story:
      '一盘意面可以让我们重新注意简单食材：番茄的酸甜、橄榄油的香气，以及最后加入的罗勒。后续的正式故事将介绍意面与番茄在意大利饮食中的发展，并附上核实后的阅读来源。',
    ingredients: [
      { name: '干意面', quantity: 160, unit: '克' },
      { name: '番茄', quantity: 3, unit: '个' },
      { name: '蒜', quantity: 2, unit: '瓣' },
      { name: '橄榄油', quantity: 1, unit: '汤匙' },
      { name: '罗勒', quantity: null, unit: '', note: '少量' },
      { name: '盐', quantity: null, unit: '', note: '按口味添加' },
    ],
    steps: [
      '按包装说明煮意面，沥水前留少量煮面水。',
      '番茄切块，蒜切碎；锅中加橄榄油，小火炒香蒜。',
      '加入番茄，煮至变软形成酱汁，加盐调味。',
      '拌入意面，按需要加入少量煮面水，出锅前加入罗勒。',
    ],
  },
  {
    id: 'mushroom-stew',
    name: '蘑菇蔬菜炖锅',
    region: '植物餐桌 · 温暖一锅',
    category: '慢炖',
    time: '约 40 分钟',
    emoji: '🍄 🥕',
    color: '#e5d9cb',
    description: '让蘑菇、土豆和胡萝卜在一口锅里慢慢变软，适合不赶时间的一餐。',
    story:
      '炖锅的吸引力在于等待：食材在汤汁中慢慢变软，厨房逐渐有了香气。这是一份现代家常示例，并不对应某一道有明确起源的传统名菜。我们也会区分个人厨房故事和有文献依据的食物历史。',
    ingredients: [
      { name: '食用蘑菇', quantity: 200, unit: '克' },
      { name: '土豆', quantity: 2, unit: '个' },
      { name: '胡萝卜', quantity: 1, unit: '根' },
      { name: '洋葱', quantity: 0.5, unit: '个' },
      { name: '蔬菜高汤', quantity: 500, unit: '毫升' },
      { name: '食用油', quantity: 1, unit: '汤匙' },
      { name: '盐', quantity: null, unit: '', note: '按口味添加' },
    ],
    steps: [
      '洗净蔬菜，土豆、胡萝卜和洋葱切块，蘑菇切片。',
      '锅中放油，炒软洋葱，加入蘑菇继续翻炒。',
      '加入土豆、胡萝卜与高汤，煮沸后转小火。',
      '炖至土豆和胡萝卜完全软熟，按口味加盐；汤汁不足时补水。',
    ],
  },
];
// 2. 中英文界面文案：通过 HTML 中的 data-i18n 属性匹配。
const translations = {
  zh: {
    title: '一餐一故事 · 厨房里的小旅行',
    brand: '一餐一故事',
    explore: '探索菜肴 ↗',
    languageLabel: '选择语言',
    heroEyebrow: '从一道菜，认识一种生活',
    heroTitle: '好故事，\n也可以端上桌。',
    heroIntro: '探索食物背后的文化，学着做一顿喜欢的饭。\n从厨房出发，走得比想象中更远。',
    inspiration: '寻找今天的灵感 ↓',
    artNote: '这一餐，从熟悉的味道开始。',
    collectionEyebrow: '精选菜谱',
    collectionTitle: '今天，想尝尝哪里的故事？',
    collectionNote: '首期 · 3 道厨房灵感',
    filterLabel: '筛选菜肴',
    all: '全部菜肴',
    home: '家常味道',
    easy: '轻松一餐',
    slow: '慢慢烹调',
    closingEyebrow: '厨房里的一点帮助',
    closingTitle: '做饭时有疑问？随时问问。',
    closingIntro: '从理解一个步骤，到替换一种食材，厨房助手会陪你一起琢磨。',
    openChat: '打开厨房助手 ↗',
    footerNote: '第一阶段原型 · 故事与菜谱为示例内容，历史资料待核实补充',
    closeRecipe: '关闭菜谱',
    chatToggle: '✦ 厨房助手',
    assistantTitle: '厨房助手',
    chatPreview: 'AI 做饭与食物文化助手',
    closeChat: '关闭厨房助手',
    welcome: '欢迎来到厨房。你可以问我做法、食材替换，或聊聊一道菜的故事。',
    suggestionOne: '没有番茄怎么办？',
    suggestionTwo: '给我推荐一道快手菜',
    inputLabel: '向厨房助手提问',
    placeholder: '输入你的做饭问题…',
    send: '发送问题',
    illustration: '示例插画',
    servings: '2 人份',
    read: '故事与做法 ↗',
    readLabel: '阅读故事与做法：',
    sampleRecipe: '示例菜谱',
    storyHeading: '餐桌上的故事',
    sampleNote: '这是编辑方向示例。正式的历史内容将核实事实并添加来源。',
    ingredientsHeading: '准备食材',
    stepsHeading: '一起做一顿饭',
    askDish: '问问这道菜的做法 ✦',
    aboutPrefix: '关于',
    aboutSuffix: '，',
  },
  en: {
    title: 'Stories at the Table · A little kitchen journey',
    brand: 'Stories at the Table',
    explore: 'Explore dishes ↗',
    languageLabel: 'Choose language',
    heroEyebrow: 'A dish. A story. A way of life.',
    heroTitle: 'Good stories,\nserved at the table.',
    heroIntro:
      'Explore the culture behind food and cook something you love.\nLet your kitchen take you somewhere new.',
    inspiration: 'Find today’s inspiration ↓',
    artNote: 'Start with a familiar flavor.',
    collectionEyebrow: 'THE RECIPE COLLECTION',
    collectionTitle: 'Which story will you taste today?',
    collectionNote: 'First collection · 3 kitchen inspirations',
    filterLabel: 'Filter dishes',
    all: 'All dishes',
    home: 'Home comforts',
    easy: 'Easy meals',
    slow: 'Slow cooking',
    closingEyebrow: 'A LITTLE HELP IN THE KITCHEN',
    closingTitle: 'A cooking question? Ask anytime.',
    closingIntro:
      'From understanding a step to swapping an ingredient, your kitchen assistant is here to help.',
    openChat: 'Open kitchen assistant ↗',
    footerNote:
      'Prototype · Sample stories and recipes; historical sources to be verified and added',
    closeRecipe: 'Close recipe',
    chatToggle: '✦ Kitchen assistant',
    assistantTitle: 'Kitchen assistant',
    chatPreview: 'AI cooking & food culture assistant',
    closeChat: 'Close kitchen assistant',
    welcome:
      'Welcome to the kitchen. Ask me about cooking steps, ingredient swaps, or the story behind a dish.',
    suggestionOne: 'What if I have no tomatoes?',
    suggestionTwo: 'Suggest a quick meal',
    inputLabel: 'Ask the kitchen assistant',
    placeholder: 'Ask a cooking question…',
    send: 'Send question',
    illustration: 'Sample illustration',
    servings: 'Serves 2',
    read: 'Story & recipe ↗',
    readLabel: 'Read the story and recipe for ',
    sampleRecipe: 'Sample recipe',
    storyHeading: 'A story at the table',
    sampleNote:
      'This is an editorial sample. Historical details will be verified and sources added.',
    ingredientsHeading: 'Gather your ingredients',
    stepsHeading: 'Let’s cook',
    askDish: 'Ask about this recipe ✦',
    aboutPrefix: 'About ',
    aboutSuffix: ', ',
  },
};
// 聊天状态与错误提示，集中维护两种语言的对应文案。
Object.assign(translations.zh, {
  newChat: '新对话',
  contextGeneral: '当前：自由咨询',
  contextSelected: '当前菜谱：',
  thinking: '正在准备回复…首次唤醒服务可能需要稍等。',
  filePreview: '请从 Flask 或 Render 的网址打开页面后聊天，不能直接使用本地文件预览。',
  not_configured: '后端尚未配置，请在 Render 设置 OpenAI API Key。',
  origin_not_allowed: '当前网站地址未获允许，请检查后端的 FRONTEND_ORIGINS。',
  invalid_request: '请求格式不正确，请刷新页面后重试。',
  invalid_messages: '对话过长或格式不正确，请开始新对话。',
  message_too_long: '消息太长，请缩短后重试。',
  unknown_dish: '未找到当前菜谱，请刷新页面后重试。',
  provider_rate_limit: 'AI 服务额度不足或请求过于频繁，请稍后重试或检查账户用量。',
  provider_unavailable: 'AI 服务暂时无法连接，请稍后重试。',
  provider_error: 'AI 服务调用失败，请检查后端的密钥和模型设置。',
  empty_reply: '没有收到有效回复，请重试。',
  incomplete_reply: '回复未能完成，请缩短问题后重试。',
  networkError: '无法连接聊天服务，请检查网络和后端地址后重试。',
  timeoutError: '等待回复超时，请稍后重试。',
  unexpectedError: '聊天服务暂时出错，请稍后重试。',
});
Object.assign(translations.en, {
  newChat: 'New chat',
  contextGeneral: 'General cooking questions',
  contextSelected: 'Current recipe: ',
  thinking: 'Preparing your reply… The service may take a moment to wake up.',
  filePreview:
    'Open the site through Flask or its Render URL to chat, rather than as a local file.',
  not_configured: 'The backend is not configured. Set the OpenAI API key in Render.',
  origin_not_allowed: 'This website origin is not allowed. Check FRONTEND_ORIGINS on the backend.',
  invalid_request: 'Invalid request. Refresh the page and try again.',
  invalid_messages: 'The conversation is too long or invalid. Please start a new chat.',
  message_too_long: 'The message is too long. Please shorten it.',
  unknown_dish: 'The current recipe was not found. Refresh and try again.',
  provider_rate_limit:
    'The AI service is busy or its quota is exhausted. Try later or check account usage.',
  provider_unavailable: 'The AI service is temporarily unreachable. Please try again.',
  provider_error: 'The AI request failed. Check the backend API key and model settings.',
  empty_reply: 'No valid reply was received. Please try again.',
  incomplete_reply: 'The reply could not finish. Shorten your question and try again.',
  networkError: 'Cannot reach the chat service. Check your network and backend URL.',
  timeoutError: 'The reply timed out. Please try again shortly.',
  unexpectedError: 'The chat service encountered an error. Please try again.',
});
// 3. 英文菜谱：名称、单位、故事和做法按菜谱 ID 对应中文数据。
const englishDishes = {
  'tomato-eggs': {
    name: 'Tomato & egg stir-fry',
    region: 'China · Home cooking',
    time: 'About 15 minutes',
    description:
      'Sweet-tart tomatoes meet soft eggs: a kitchen practice built around familiar flavors.',
    story:
      'The story of a home-cooked dish can live in the small differences between families. Some prefer more sauce; others like their eggs a little more golden. This dish will be our starting point for exploring ingredients, family memories, and everyday meals.',
    ingredients: [
      { name: 'Tomatoes', unit: 'whole' },
      { name: 'Eggs', unit: 'whole' },
      { name: 'Cooking oil', unit: 'tbsp' },
      { name: 'Salt', unit: '', note: 'to taste' },
    ],
    steps: [
      'Wash and chop the tomatoes. Beat the eggs in a bowl.',
      'Heat the oil over medium heat. Add the eggs, stir until set, and transfer to a plate.',
      'Add the tomatoes and cook until softened and juicy. Add a splash of water if needed.',
      'Return the eggs to the pan, season with salt, and stir until heated through.',
    ],
  },
  'tomato-pasta': {
    name: 'Tomato & basil pasta',
    region: 'Italian-inspired · Everyday cooking',
    time: 'About 25 minutes',
    description:
      'A few simple ingredients make a plate of pasta full of tomato flavor and fresh herbs.',
    story:
      'A plate of pasta invites us to notice simple ingredients: the sweetness and acidity of tomatoes, the aroma of olive oil, and basil added at the end. The finished story will explore the development of pasta and tomatoes in Italian food, with verified reading sources.',
    ingredients: [
      { name: 'Dried pasta', unit: 'g' },
      { name: 'Tomatoes', unit: 'whole' },
      { name: 'Garlic', unit: 'cloves' },
      { name: 'Olive oil', unit: 'tbsp' },
      { name: 'Basil', unit: '', note: 'a small handful' },
      { name: 'Salt', unit: '', note: 'to taste' },
    ],
    steps: [
      'Cook the pasta following the package instructions. Reserve a little cooking water before draining.',
      'Chop the tomatoes and garlic. Gently cook the garlic in olive oil over low heat.',
      'Add the tomatoes and cook until they soften into a sauce. Season with salt.',
      'Toss in the pasta, adding a little reserved water as needed. Add basil before serving.',
    ],
  },
  'mushroom-stew': {
    name: 'Mushroom & vegetable stew',
    region: 'Plant-based table · A warming pot',
    time: 'About 40 minutes',
    description:
      'Let mushrooms, potatoes, and carrots soften together in one pot, for a meal worth taking your time over.',
    story:
      'Part of the pleasure of a stew is the wait: ingredients soften in the broth while aromas fill the kitchen. This is a modern home-cooking sample, rather than a traditional dish with a specific documented origin. We will distinguish personal kitchen stories from food history supported by sources.',
    ingredients: [
      { name: 'Edible mushrooms', unit: 'g' },
      { name: 'Potatoes', unit: 'whole' },
      { name: 'Carrot', unit: 'whole' },
      { name: 'Onion', unit: 'whole' },
      { name: 'Vegetable stock', unit: 'ml' },
      { name: 'Cooking oil', unit: 'tbsp' },
      { name: 'Salt', unit: '', note: 'to taste' },
    ],
    steps: [
      'Wash the vegetables. Chop the potatoes, carrot, and onion; slice the mushrooms.',
      'Heat the oil in a pot. Soften the onion, then add the mushrooms and continue cooking.',
      'Add the potatoes, carrot, and stock. Bring to a boil, then reduce to a simmer.',
      'Simmer until the potatoes and carrot are fully tender. Season with salt; add water if needed.',
    ],
  },
};
// 4. 当前语言与菜谱展示。
let language = 'en';
try {
  if (localStorage.getItem('cooking-story-language') === 'en') language = 'en';
} catch {
  /* Storage may be unavailable in private browsing. */
}
const t = (key) => translations[language][key];
translations.en.recipe_provider_unavailable =
  'The recipe source is temporarily unavailable. Please try again.';
translations.zh.recipe_provider_unavailable = '菜谱来源暂时不可用，请稍后重试。';

function localizeDish(dish) {
  if (dish.source === 'TheMealDB') return dish;
  if (language === 'zh') return dish;
  const translated = englishDishes[dish.id];
  return {
    ...dish,
    ...translated,
    ingredients: dish.ingredients.map((ingredient, index) => ({
      ...ingredient,
      ...translated.ingredients[index],
    })),
  };
}
const grid = document.querySelector('#dish-grid');
const detailDialog = document.querySelector('#dish-dialog');
let currentDish = null;
let activeFilter = 'all';

function renderCards() {
  grid.innerHTML = dishes
    .filter((dish) => activeFilter === 'all' || dish.category === activeFilter)
    .map(localizeDish)
    .map(
      (dish) => /* HTML */ `
        <article class="dish-card">
          <div class="dish-art" style="--card-color:${dish.color}" aria-hidden="true">
            ${dish.emoji}
            <span class="illustration-label">${t('illustration')}</span>
          </div>
          <div class="card-body">
            <span class="meta">${dish.region}</span>
            <h3>${dish.name}</h3>
            <p>${dish.description}</p>
            <div class="card-bottom">
              <span>${dish.time} · ${t('servings')}</span>
              <button
                class="text-button"
                data-dish="${dish.id}"
                aria-label="${t('readLabel')}${dish.name}"
              >
                ${t('read')}
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    activeFilter = button.dataset.filter;
    renderCards();
  }),
);
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-dish]');
  if (!button) return;
  currentDish = dishes.find((d) => d.id === button.dataset.dish);
  renderChatContext();
  renderDetail();
  detailDialog.showModal();
});

function renderDetail() {
  if (!currentDish) return;
  if (currentDish.source === 'TheMealDB') {
    renderExternalDetail(currentDish);
    return;
  }
  const dish = localizeDish(currentDish);
  const ingredientsHtml = dish.ingredients
    .map((ingredient) => {
      const amount =
        ingredient.quantity === null
          ? ingredient.note
          : `${ingredient.quantity} ${ingredient.unit}`;
      return `<li>${ingredient.name} · ${amount}</li>`;
    })
    .join('');
  const stepsHtml = dish.steps.map((step) => `<li>${step}</li>`).join('');

  document.querySelector('#dish-detail').innerHTML = /* HTML */ `
    <div class="detail-art" aria-hidden="true">${dish.emoji}</div>
    <p class="eyebrow">${dish.region}</p>
    <h2 id="detail-title">${dish.name}</h2>
    <p class="meta">${dish.time} · ${t('servings')} · ${t('sampleRecipe')}</p>

    <h3>${t('storyHeading')}</h3>
    <p class="detail-story">${dish.story}</p>
    <p class="sample-note">${t('sampleNote')}</p>

    <div class="detail-columns">
      <section>
        <h3>${t('ingredientsHeading')}</h3>
        <ul>
          ${ingredientsHtml}
        </ul>
      </section>
      <section>
        <h3>${t('stepsHeading')}</h3>
        <ol>
          ${stepsHtml}
        </ol>
      </section>
    </div>

    <button id="start-cooking" class="button" type="button">Let’s cook!</button>
    <button id="ask-dish" class="button" style="border:0">${t('askDish')}</button>
  `;
  document.querySelector('#start-cooking').addEventListener('click', () => startCooking(dish));
  document.querySelector('#ask-dish').addEventListener('click', () => {
    detailDialog.close();
    openChat();
    document.querySelector('#chat-input').value =
      `${t('aboutPrefix')}${dish.name}${t('aboutSuffix')}`;
  });
}
document.querySelector('#close-detail').addEventListener('click', () => detailDialog.close());
// Native dialog backdrop events target the dialog, as do clicks on its padding.
// Check coordinates too, so clicks inside the recipe or on its scrollbar stay open.
function isOutsideRecipe(event) {
  if (event.target !== detailDialog) return false;
  const bounds = detailDialog.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}
let recipePointerStartedOutside = false;
detailDialog.addEventListener('pointerdown', (event) => {
  recipePointerStartedOutside = isOutsideRecipe(event);
});
detailDialog.addEventListener('click', (event) => {
  if (recipePointerStartedOutside && isOutsideRecipe(event)) detailDialog.close();
  recipePointerStartedOutside = false;
});
detailDialog.addEventListener('close', () => {
  recipePointerStartedOutside = false;
});
// 5. 助手面板：展开、关闭与快捷提问。
const panel = document.querySelector('#chat-panel');
const toggle = document.querySelector('#chat-toggle');

// Mobile keyboards can shrink the visual viewport without changing layout height.
// Track its usable space; CSS applies these values only on phone-sized screens.
function syncChatViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  panel.style.setProperty('--chat-viewport-height', `${viewport.height}px`);
  panel.style.setProperty(
    '--chat-viewport-bottom',
    `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
  );
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncChatViewport);
  window.visualViewport.addEventListener('scroll', syncChatViewport);
  syncChatViewport();
}

function openChat() {
  syncChatViewport();
  panel.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  document.querySelector('#chat-input').focus();
}

function closeChat() {
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.focus();
}
toggle.addEventListener('click', () => (panel.hidden ? openChat() : closeChat()));
document.querySelector('#close-chat').addEventListener('click', closeChat);
document.querySelector('#inline-chat').addEventListener('click', openChat);
panel.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeChat();
});
document.querySelectorAll('.suggestions button').forEach((button) =>
  button.addEventListener('click', () => {
    document.querySelector('#chat-input').value = button.textContent;
    document.querySelector('#chat-input').focus();
  }),
);
// 6. 聊天状态：仅在当前页面内保存，刷新后清空。
let chatHistory = [];
let sending = false;
let statusKey = '';

function renderChatContext() {
  document.querySelector('#chat-context').textContent = currentDish
    ? t('contextSelected') + localizeDish(currentDish).name
    : t('contextGeneral');
}

function setStatus(key, error = false) {
  statusKey = key;
  const status = document.querySelector('#chat-status');
  status.hidden = !key;
  status.textContent = key ? t(key) : '';
  status.classList.toggle('error', error);
}

function setSending(value) {
  sending = value;
  document.querySelector('#chat-form button').disabled = value;
  document.querySelector('#chat-input').readOnly = value;
  document.querySelector('#new-chat').disabled = value;
  document.querySelector('#chat-messages').setAttribute('aria-busy', String(value));
  document.querySelectorAll('.suggestions button').forEach((button) => {
    button.disabled = value;
  });
}

function appendMessage(role, content) {
  const message = document.createElement('p');
  message.className = `message ${role}`;
  // Model output and user input are always plain text, never executable HTML.
  message.textContent = content;
  const messages = document.querySelector('#chat-messages');
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

function requestHistory(text) {
  // 保留最近五轮完整问答。删减时一次移除一对，避免打乱角色顺序。
  const recent = chatHistory.slice(-10);
  while (
    recent.length &&
    recent.reduce((sum, m) => sum + m.content.length, 0) + text.length > 24000
  ) {
    recent.splice(0, 2);
  }
  return [...recent, { role: 'user', content: text }];
}
document.querySelector('#new-chat').addEventListener('click', () => {
  if (sending) return;
  chatHistory = [];
  currentDish = null;
  const messages = document.querySelector('#chat-messages');
  messages.replaceChildren();
  appendMessage('assistant', t('welcome')).dataset.i18n = 'welcome';
  document.querySelector('#chat-input').value = '';
  renderChatContext();
  setStatus('');
});
// 7. 请求后端：等待时禁止重复发送，失败时保留输入便于重试。
document.querySelector('#chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sending) return;
  const input = document.querySelector('#chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (text.length > 2000) {
    setStatus('message_too_long', true);
    return;
  }
  const base = (window.COOKING_STORY_CONFIG?.apiBaseUrl || '').replace(/\/+$/, '');
  if (location.protocol === 'file:' && !base) {
    setStatus('filePreview', true);
    return;
  }
  const requestMessages = requestHistory(text);
  const userMessage = appendMessage('user', text);
  setSending(true);
  setStatus('thinking');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: requestMessages,
        language,
        dish_id: currentDish?.id || null,
      }),
      signal: controller.signal,
      credentials: 'omit',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const code = body?.error;
      const known = [
        'not_configured',
        'origin_not_allowed',
        'invalid_request',
        'invalid_messages',
        'message_too_long',
        'unknown_dish',
        'provider_rate_limit',
        'provider_unavailable',
        'provider_error',
        'empty_reply',
        'incomplete_reply',
        'recipe_provider_unavailable',
      ];
      throw new Error(known.includes(code) ? code : 'unexpectedError');
    }
    if (typeof body?.reply !== 'string' || !body.reply.trim() || body.reply.length > 8000)
      throw new Error('empty_reply');
    appendMessage('assistant', body.reply);
    chatHistory = [...requestMessages, { role: 'assistant', content: body.reply }];
    if (input.value.trim() === text) input.value = '';
    setStatus('');
  } catch (error) {
    userMessage.remove();
    const key =
      error.name === 'AbortError'
        ? 'timeoutError'
        : translations[language][error.message]
          ? error.message
          : 'networkError';
    setStatus(key, true);
  } finally {
    clearTimeout(timeout);
    setSending(false);
  }
});
// 8. 语言切换与页面初始化：界面文案会切换，已有聊天文字保留原文。
function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });
  document.querySelector('#chat-input').placeholder = t('placeholder');
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  renderChatContext();
  if (statusKey) document.querySelector('#chat-status').textContent = t(statusKey);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  renderCards();
  if (currentDish) renderDetail();
}
document.querySelectorAll('[data-language]').forEach((button) =>
  button.addEventListener('click', () => {
    language = button.dataset.language;
    try {
      localStorage.setItem('cooking-story-language', language);
    } catch {
      /* The switch still works without storage. */
    }
    applyLanguage();
  }),
);
applyLanguage();
