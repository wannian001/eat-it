// Setting up a new user (v0.2 sign-up, without the email code): name, where you keep food, then
// whether you share a kitchen. John and May come set up already.

import { ICON, appIcon, wordmark } from '../icons.js';
import { esc } from '../ui.js';

const KIND = { cold: 'Cold (fridge)', frozen: 'Frozen (freezer)', room: 'Room temperature' };
const BASE = [['fridge', 'Fridge', 'cold'], ['freezer', 'Freezer', 'frozen'], ['pantry', 'Cupboard', 'room']];

export const freshOnboarding = () => ({ step: 'welcome', name: '', places: { fridge: true, freezer: true, pantry: true }, extra: [], house: 'alone', code: '' });

export function onboardingPage(app) {
  const o = app.ui.onb;
  const brand = `<div class="ob-brand">${appIcon({ size: 40, badge: true })}${wordmark('md')}</div>`;
  const dots = (n) => `<div class="ob-dots">${[1, 2].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  let body;
  if (o.step === 'welcome') {
    body = `${brand}<h1>Know what food you have, wherever you are.</h1>
      <p class="muted">Eat It! keeps track of the food in your fridge, freezer and cupboard, and quietly tells you what to eat first.</p>
      <label class="fld"><span>Your first name</span><input type="text" id="ob-name" autocomplete="given-name" value="${esc(o.name)}" placeholder="e.g. Alex"></label>
      <div class="btn-row"><button class="btn btn-primary" data-act="ob" data-arg="places">Set up my kitchen</button></div>
      <p class="small"><button class="link" data-act="user-add-cancel">${ICON.back({ size: 14 })}Back to users</button></p>`;
  } else if (o.step === 'places') {
    body = `${brand}${dots(1)}<h1>Where do you keep food?</h1><p class="muted">Tick the places you really have. You can change this any time.</p>
      ${BASE.map(([id, n, k]) => `<label class="pchk"><input type="checkbox" data-change="ob-place" data-arg="${id}"${o.places[id] ? ' checked' : ''}><span>${n}</span><small>${KIND[k]}</small></label>`).join('')}
      ${o.extra.map((x, i) => `<div class="pchk"><span>${ICON.check({ size: 16 })} ${esc(x.name)}</span><small>${KIND[x.kind]}</small><button class="chip-btn" data-act="ob-del" data-arg="${i}">Remove</button></div>`).join('')}
      <div class="np-row"><input type="text" id="ob-place" placeholder="Another place, e.g. Rice bin" autocomplete="off" aria-label="Another place"><select id="ob-kind" aria-label="Type of place">${Object.entries(KIND).map(([k, t]) => `<option value="${k}"${k === 'room' ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="btn btn-secondary sm" data-act="ob-add">Add</button></div>
      <div class="btn-row"><button class="btn btn-quiet" data-act="ob" data-arg="welcome">Back</button><button class="btn btn-primary" data-act="ob" data-arg="house">Next</button></div>`;
  } else {
    const ch = (v, t, sub, ic) => `<button class="choice${o.house === v ? ' on' : ''}" data-act="ob-house" data-arg="${v}" aria-pressed="${o.house === v}"><span class="row-ic">${ICON[ic]({ size: 20 })}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
    body = `${brand}${dots(2)}<h1>Do you share a kitchen?</h1><p class="muted">Housemates only ever see food you mark as shared.</p>
      ${ch('alone', 'Just me', 'You can invite people later.', 'user')}${ch('create', 'I share. Start a household', "You'll get a code to send your housemates.", 'people')}${ch('join', 'I share. Join a household', 'A housemate gave you an invite code.', 'store')}
      ${o.house === 'join' ? `<label class="fld"><span>Invite code</span><input type="text" id="ob-code" placeholder="SL-4821" autocomplete="off" value="${esc(o.code)}"></label>` : ''}
      <div class="btn-row"><button class="btn btn-quiet" data-act="ob" data-arg="places">Back</button><button class="btn btn-primary" data-act="ob-finish">Finish</button></div>`;
  }
  return `<div class="onboard"><div class="ob-card">${body}</div></div>`;
}
