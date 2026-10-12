// The user system: the sign-in screen (pick who you are), the switcher in the side bar / Me tab.
import { listUsers } from '../users.js';
import { BUILTIN } from '../seed.js';
import { ICON, appIcon, wordmark } from '../icons.js';
import { esc } from '../ui.js';

const about = (u) => {
  const b = BUILTIN[u.id];
  if (!b) return 'Your own kitchen';
  return b.house ? b.house.name : 'Lives alone';
};

// Shown when nobody is signed in.
export function signInPage() {
  const users = listUsers();
  return `<div class="onboard"><div class="ob-card wide">
    <div class="ob-brand">${appIcon({ size: 40, badge: true })}${wordmark('md')}</div>
    <h1>Who's using Eat It!?</h1>
    <p class="muted">Each person has their own fridge, plan and settings on this device.</p>
    <div class="user-grid">
      ${users.map((u, i) => `<button class="user-card" data-act="user" data-arg="${esc(u.id)}"><span class="avatar av-${i % 3} lg">${esc(u.initial)}</span><b>${esc(u.name)}</b><small>${esc(about(u))}</small></button>`).join('')}
      <button class="user-card add" data-act="user-add"><span class="avatar lg add-av">${ICON.plus({ size: 22, stroke: 2.4 })}</span><b>Add a user</b><small>Start with an empty kitchen</small></button>
    </div>
  </div></div>`;
}

// List of users with the current one ticked, plus Add a user and Sign out.
export function userList(app, { compact = false } = {}) {
  const cur = app.store.persona.id;
  const users = listUsers();
  return `<div class="user-list${compact ? ' compact' : ''}" role="menu" aria-label="Switch user">
    ${users.map((u, i) => `<button class="user-row${u.id === cur ? ' on' : ''}" role="menuitemradio" aria-checked="${u.id === cur}" data-act="user" data-arg="${esc(u.id)}"><span class="avatar av-${i % 3}">${esc(u.initial)}</span><span class="ur-main"><b>${esc(u.name)}</b><small>${esc(about(u))}</small></span>${u.id === cur ? ICON.check({ size: 16, stroke: 2.6 }) : ''}</button>`).join('')}
    <button class="user-row" role="menuitem" data-act="user-add"><span class="avatar add-av">${ICON.plus({ size: 16, stroke: 2.4 })}</span><span class="ur-main"><b>Add a user</b></span></button>
    <button class="user-row quiet" role="menuitem" data-act="sign-out"><span class="avatar add-av">${ICON.back({ size: 16 })}</span><span class="ur-main"><b>Sign out</b></span></button>
  </div>`;
}
