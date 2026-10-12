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
// others: leave the current user out (the card above already shows them).
export function userList(app, { compact = false, others = false } = {}) {
  const cur = app.store.persona.id;
  const users = listUsers();
  return `<div class="user-list${compact ? ' compact' : ''}" role="menu" aria-label="Switch user">
    ${users.map((u, i) => (others && u.id === cur ? '' : `<button class="user-row${u.id === cur ? ' on' : ''}" role="menuitemradio" aria-checked="${u.id === cur}" data-act="user" data-arg="${esc(u.id)}"><span class="avatar av-${i % 3}">${esc(u.initial)}</span><span class="ur-main"><b>${esc(u.name)}</b><small>${esc(about(u))}</small></span>${u.id === cur ? ICON.check({ size: 16, stroke: 2.6 }) : ''}</button>`)).join('')}
    <button class="user-row" role="menuitem" data-act="user-add"><span class="avatar add-av">${ICON.plus({ size: 16, stroke: 2.4 })}</span><span class="ur-main"><b>Add a user</b></span></button>
    <button class="user-row quiet" role="menuitem" data-act="sign-out"><span class="avatar add-av">${ICON.back({ size: 16 })}</span><span class="ur-main"><b>Sign out</b></span></button>
  </div>`;
}

// Phone: one small card with who is signed in; tap it to switch user, add one or sign out.
export function userCard(app) {
  const cur = app.store.persona.id;
  const users = listUsers();
  const i = Math.max(0, users.findIndex((u) => u.id === cur));
  const u = users[i] || { name: app.store.persona.name, initial: (app.store.persona.name || '?')[0] };
  const open = !!app.ui.userMenu;
  return `<div class="me-card${open ? ' open' : ''}">
    <button class="me-head" data-act="user-menu" aria-expanded="${open}"><span class="avatar av-${i % 3}">${esc(u.initial)}</span><span class="ur-main"><small>Signed in as</small><b>${esc(app.store.state.profile.name || u.name)}</b></span><span class="chev" aria-hidden="true">${ICON.next({ size: 16 })}</span></button>
    ${open ? userList(app, { others: true }) : ''}
  </div>`;
}
