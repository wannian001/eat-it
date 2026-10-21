// Setting up a new user (v0.2 sign-up, without the email code): name, where you keep food, then
// whether you share a kitchen. John and May come set up already.

import { ICON, appIcon, wordmark } from '../icons.js?v=a3e659d';
import { esc, langSwitch } from '../ui.js?v=a3e659d';
import { placeKinds } from '../seed.js?v=a3e659d';
import { L, dz } from '../i18n.js?v=a3e659d';

const BASE = [['fridge', 'Fridge', 'cold'], ['freezer', 'Freezer', 'frozen'], ['pantry', 'Cupboard', 'room']];

export const freshOnboarding = () => ({ step: 'welcome', name: '', places: { fridge: true, freezer: true, pantry: true }, extra: [], house: 'alone', code: '' });

export function onboardingPage(app) {
  const o = app.ui.onb;
  const KIND = placeKinds();
  const brand = `<div class="ob-top">${langSwitch()}</div><div class="ob-brand">${appIcon({ size: 40, badge: true })}${wordmark('md')}</div>`;
  const dots = (n) => `<div class="ob-dots">${[1, 2].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  let body;
  if (o.step === 'welcome') {
    body = `${brand}<h1>${L('Know what food you have, wherever you are.', '在哪儿都知道家里有什么吃的。')}</h1>
      <p class="muted">${L('Eat It! keeps track of the food in your fridge, freezer and cupboard, and quietly tells you what to eat first.', 'Eat It! 帮你记住冰箱、冷冻室和橱柜里的食物，安静地提醒你先吃什么。')}</p>
      <label class="fld"><span>${L('Your first name', '你的名字')}</span><input type="text" id="ob-name" autocomplete="given-name" value="${esc(o.name)}" placeholder="${L('e.g. Alex', '比如：小林')}"></label>
      <div class="btn-row"><button class="btn btn-primary" data-act="ob" data-arg="places">${L('Set up my kitchen', '设置我的厨房')}</button></div>
      <p class="small"><button class="link" data-act="user-add-cancel">${ICON.back({ size: 14 })}${L('Back to users', '回到用户列表')}</button></p>`;
  } else if (o.step === 'places') {
    body = `${brand}${dots(1)}<h1>${L('Where do you keep food?', '你把食物放在哪里？')}</h1><p class="muted">${L('Tick the places you really have. You can change this any time.', '勾选你真正有的地方，之后随时能改。')}</p>
      ${BASE.map(([id, n, k]) => `<label class="pchk"><input type="checkbox" data-change="ob-place" data-arg="${id}"${o.places[id] ? ' checked' : ''}><span>${dz(n)}</span><small>${KIND[k]}</small></label>`).join('')}
      ${o.extra.map((x, i) => `<div class="pchk"><span>${ICON.check({ size: 16 })} ${esc(x.name)}</span><small>${KIND[x.kind]}</small><button class="chip-btn" data-act="ob-del" data-arg="${i}">${L('Remove', '删除')}</button></div>`).join('')}
      <div class="np-row"><input type="text" id="ob-place" placeholder="${L('Another place, e.g. Rice bin', '别的地方，比如：米桶')}" autocomplete="off" aria-label="${L('Another place', '别的地方')}"><select id="ob-kind" aria-label="${L('Type of place', '类型')}">${Object.entries(KIND).map(([k, t]) => `<option value="${k}"${k === 'room' ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="btn btn-secondary sm" data-act="ob-add">${L('Add', '添加')}</button></div>
      <div class="btn-row"><button class="btn btn-quiet" data-act="ob" data-arg="welcome">${L('Back', '上一步')}</button><button class="btn btn-primary" data-act="ob" data-arg="house">${L('Next', '下一步')}</button></div>`;
  } else {
    const ch = (v, t, sub, ic) => `<button class="choice${o.house === v ? ' on' : ''}" data-act="ob-house" data-arg="${v}" aria-pressed="${o.house === v}"><span class="row-ic">${ICON[ic]({ size: 20 })}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
    body = `${brand}${dots(2)}<h1>${L('Do you share a kitchen?', '你和别人共用厨房吗？')}</h1><p class="muted">${L('Housemates only ever see food you mark as shared.', '室友只看得到你标成公共的食物。')}</p>
      ${ch('alone', L('Just me', '就我一个'), L('You can invite people later.', '以后也可以邀请别人。'), 'user')}${ch('create', L('I share. Start a household', '共用，建一个家'), L("You'll get a code to send your housemates.", '你会拿到一个邀请码发给室友。'), 'people')}${ch('join', L('I share. Join a household', '共用，加入一个家'), L('A housemate gave you an invite code.', '室友给了你邀请码。'), 'store')}
      ${o.house === 'join' ? `<label class="fld"><span>${L('Invite code', '邀请码')}</span><input type="text" id="ob-code" placeholder="EI-4821" autocomplete="off" value="${esc(o.code)}"></label>` : ''}
      <div class="btn-row"><button class="btn btn-quiet" data-act="ob" data-arg="places">${L('Back', '上一步')}</button><button class="btn btn-primary" data-act="ob-finish">${L('Finish', '完成')}</button></div>`;
  }
  return `<div class="onboard"><div class="ob-card">${body}</div></div>`;
}
