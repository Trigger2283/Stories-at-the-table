// Dependency-free request/state tests. No live model calls.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function fixture() {
  const nodes = new Map();
  function element() {
    return {dataset:{}, value:'', hidden:true, innerHTML:'', textContent:'', children:[], attributes:{},
      classList:{toggle(){}}, addEventListener(name,fn){this[name] = fn;},
      setAttribute(name,value){this.attributes[name] = value;}, focus(){},
      append(child){this.children.push(child);child.parent=this;},
      remove(){this.parent.children = this.parent.children.filter(child => child !== this);},
      replaceChildren(){this.children=[];}, showModal(){this.open=true;}, close(){this.open=false;}};
  }
  const labels = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => Object.assign(element(), {dataset:{i18n:match[1]}}));
  const aria = [...html.matchAll(/data-i18n-aria="([^"]+)"/g)].map(match => Object.assign(element(), {dataset:{i18nAria:match[1]}}));
  const placeholders = [...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map(match => Object.assign(element(), {dataset:{i18nPlaceholder:match[1]}}));
  const languages = ['zh','en'].map(language => Object.assign(element(), {dataset:{language}}));
  const filters = ['all','家常','轻食','慢炖'].map(filter => Object.assign(element(), {dataset:{filter}}));
  const suggestions = [element(),element()];
  const document = {
    documentElement:{},
    querySelector(selector){if(!nodes.has(selector)) nodes.set(selector,element()); return nodes.get(selector);},
    querySelectorAll(selector){return ({'[data-i18n]':labels,'[data-i18n-aria]':aria,'[data-i18n-placeholder]':placeholders,'[data-language]':languages,'[data-filter]':filters,'.suggestions button':suggestions})[selector] || [];},
    createElement:element
  };
  const calls = [];
  const storage = new Map();
  const context = vm.createContext({document,window:{COOKING_STORY_CONFIG:{apiBaseUrl:''}},location:{protocol:'http:'},
    localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
    AbortController, setTimeout:()=>1,clearTimeout:()=>{},
    fetch:async(url,options)=>{calls.push({url,options}); return {ok:true,json:async()=>({reply:'A real-shaped test reply.'})};}
  });
  vm.runInContext(source,context);
  return {context,document,calls,storage,languages,filters,labels,aria,placeholders,submit:()=>document.querySelector('#chat-form').submit({preventDefault(){}})};
}

async function run() {
  const f = fixture();
  const q = selector => f.document.querySelector(selector);
  assert.equal(f.document.documentElement.lang,'zh-CN');
  assert(f.labels.every(label => typeof label.textContent === 'string'));
  assert(f.aria.every(label => typeof label.attributes['aria-label'] === 'string'));
  q('#chat-input').value='How do I cook this?';
  await f.submit();
  assert.equal(f.calls.length,0);
  assert.equal(vm.runInContext('statusKey',f.context),'passwordRequired');
  q('#chat-password').value='test-access';
  f.context.location.protocol='file:';
  await f.submit();
  assert.equal(vm.runInContext('statusKey',f.context),'filePreview');
  assert.equal(f.calls.length,0);
  f.context.location.protocol='https:';
  f.languages[1].click();
  vm.runInContext('currentDish=dishes[0];renderChatContext();',f.context);
  await f.submit();
  assert.equal(f.calls[0].url,'/api/chat');
  const payload=JSON.parse(f.calls[0].options.body);
  assert.equal(payload.language,'en');
  assert.equal(payload.dish_id,'tomato-eggs');
  assert.equal(f.calls[0].options.headers['X-Chat-Password'],'test-access');
  assert.equal(q('#chat-input').value,'');
  assert.equal(vm.runInContext('chatHistory.length',f.context),2);
  assert.equal(q('#chat-messages').children[1].textContent,'A real-shaped test reply.');

  // While an answer is pending, a second submission must not start another request.
  let finish;
  let pendingCalls=0;
  f.context.fetch=()=>{pendingCalls++; return new Promise(resolve=>{finish=resolve;});};
  q('#chat-input').value='And then?';
  const pending=f.submit();
  assert.equal(q('#chat-form button').disabled,true);
  assert.equal(q('#new-chat').disabled,true);
  await f.submit();
  assert.equal(pendingCalls,1);
  finish({ok:true,json:async()=>({reply:'Then stir gently.'})});
  await pending;
  assert.equal(q('#chat-form button').disabled,false);
  assert.equal(vm.runInContext('chatHistory.length',f.context),4);

  // A failed request keeps the question, removes the pending bubble and adds no history.
  f.context.fetch=async()=>({ok:false,json:async()=>({error:'unauthorized'})});
  q('#chat-input').value='Keep this question';
  const before=q('#chat-messages').children.length;
  await f.submit();
  assert.equal(q('#chat-input').value,'Keep this question');
  assert.equal(q('#chat-password').value,'');
  assert.equal(q('#chat-messages').children.length,before);
  assert.equal(vm.runInContext('chatHistory.length',f.context),4);
  assert.equal(vm.runInContext('statusKey',f.context),'unauthorized');
  q('#chat-password').value='test-access';
  f.context.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await f.submit();
  assert.equal(vm.runInContext('statusKey',f.context),'networkError');
  f.context.fetch=async()=>{const error=new Error();error.name='AbortError';throw error;};
  await f.submit();
  assert.equal(vm.runInContext('statusKey',f.context),'timeoutError');
  f.context.fetch=async()=>({ok:true,json:async()=>({reply:'<img src=x onerror=alert(1)>'})});
  await f.submit();
  const last=q('#chat-messages').children.at(-1);
  assert.equal(last.textContent,'<img src=x onerror=alert(1)>');
  assert.equal(last.innerHTML,'');
  f.filters[1].click();f.languages[0].click();
  assert.equal((q('#dish-grid').innerHTML.match(/<article/g)||[]).length,1);
  assert.equal(f.storage.get('cooking-story-language'),'zh');
  q('#new-chat').click();
  assert.equal(vm.runInContext('chatHistory.length',f.context),0);
  assert.equal(vm.runInContext('currentDish',f.context),null);

  // Keep server catalogue aligned with the current prototype's display data.
  const catalogue=JSON.parse(fs.readFileSync(path.join(root,'recipes.json'),'utf8'));
  const frontend=JSON.parse(vm.runInContext('JSON.stringify(dishes.map(d=>({id:d.id,zh:{...d},en:{...d,...englishDishes[d.id],ingredients:d.ingredients.map((i,n)=>({...i,...englishDishes[d.id].ingredients[n]}))}})))',f.context));
  assert.deepEqual(catalogue,frontend);
  vm.runInContext("chatHistory=Array.from({length:16},(_,i)=>({role:i%2?'assistant':'user',content:'x'.repeat(2000)}));",f.context);
  const trimmed=JSON.parse(vm.runInContext("JSON.stringify(requestHistory('follow up'))",f.context));
  assert.equal(trimmed.length,11);
  assert.equal(trimmed[0].role,'user');
  assert.equal(trimmed.at(-1).role,'user');
  console.log('PASS: bilingual requests, context, multi-turn state, duplicate prevention, failures, retry input, text rendering, reset, catalogue parity.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
