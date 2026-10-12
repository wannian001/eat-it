// Boards 05 and 06: what the app looks like outside the app. A web page can't put real widgets on
// an iPhone, so these are live previews drawn from the same fridge; taps here change the fridge.
import { food } from '../foods.js';
import { tiles, eatFirst, oldestFrozen, frozenLots, bagNumber, nudge } from '../state.js';
import { urgency, frozenWeeks, frozenFor, longDay, dot } from '../dates.js';
import { zonesOf } from '../seed.js';
import { ICON, appIcon } from '../icons.js';
import { esc, pic, label } from '../ui.js';

function freshGroups(app) {
  const { store } = app;
  const spots = zonesOf(store.persona).filter((z) => z.kind !== 'freezer' && z.kind !== 'locked').map((z) => z.spot);
  return spots.flatMap((sp) => tiles(store.state, sp, store.today))
    .sort((a, b) => (urgency(a.lot.date, store.today) ?? 99) - (urgency(b.lot.date, store.today) ?? 99));
}

function widgetGrid(app) {
  const today = app.store.today;
  const groups = freshGroups(app);
  const fruit = [...groups.filter((t) => food(t.food).cat === 'produce'), ...groups.filter((t) => food(t.food).cat !== 'produce')].slice(0, 4);
  return `<section class="w w-sm w-grid" aria-label="Use soon">${fruit.map((t) => {
    const d = dot(t.lot.date, today);
    return `<button class="wg-tile${d ? ' hot' : ''}" data-act="use" data-arg="${esc(t.lot.id)}|one" aria-label="Used one: ${esc(label(t.food, t.count, t.lot.date, today))}">${pic(t.food, { size: 34 })}${d ? '<span class="dot dot-red"></span>' : ''}</button>`;
  }).join('')}</section>`;
}

function widgetFreezer(app) {
  const { store } = app;
  const s = store.state;
  const lot = oldestFrozen(s);
  if (!lot) {
    const n = eatFirst(s, store.today).length;
    return `<section class="w w-sm w-count" aria-label="${n} to use soon"><span class="wc-n">${n}</span><span class="wc-l">Use soon</span></section>`;
  }
  const n = frozenLots(s).filter((l) => l.food === lot.food).length;
  const wk = frozenWeeks(lot.date.on, store.today);
  return `<section class="w w-sm w-freezer" aria-label="Freezer: ${n} bags of ${esc(food(lot.food).name)}, oldest ${esc(frozenFor(lot.date.on, store.today))}">
    <span class="wf-snow">${ICON.snow({ size: 18 })}</span>
    ${wk >= 1 ? `<span class="wf-wk">${wk} wk</span>` : ''}
    <span class="wf-pic">${pic(lot.food, { bag: true, size: 46 })}</span>
    <span class="wf-n">${n}</span>
  </section>`;
}

function widgetMedium(app) {
  const groups = freshGroups(app).slice(0, 8);
  return `<section class="w w-md" aria-label="My fridge">
    <div class="wm-main">
      <div class="wm-h">${appIcon({ size: 18, badge: false })}<span>My fridge</span></div>
      <div class="wm-tiles">${groups.map((t) => `<span class="wm-tile">${pic(t.food, { size: 24 })}${t.count > 1 ? `<b>${t.count}</b>` : ''}</span>`).join('')}</div>
    </div>
    <div class="wm-btns">
      <button class="wm-b plus" data-act="go" data-arg="add" aria-label="Add food">${ICON.plus({ size: 18, stroke: 2.4 })}</button>
      <button class="wm-b minus" data-act="go" data-arg="ate" aria-label="I ate">${ICON.minus({ size: 18, stroke: 2.4 })}</button>
    </div>
  </section>`;
}

function widgetOut(app) {
  const { store } = app;
  const on = !!store.state.out[store.today];
  return `<section class="w w-sm w-out">
    ${on ? `<span class="wo-moved">${ICON.sprout({ size: 18 })}Moved to tomorrow</span>` : `<span class="wo-icon">${ICON.plate({ size: 22, stroke: 1.8 })}</span>`}
    <span class="wo-title">Out tonight</span>
    <button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="Out tonight" data-act="out"><i></i></button>
  </section>`;
}

export function widgetsScreen(app) {
  const badge = eatFirst(app.store.state, app.store.today).length > 0;
  return `<div class="screen phone home-screen">
    <div class="hs-grid">
      ${widgetGrid(app)}
      ${widgetFreezer(app)}
      ${widgetMedium(app)}
      ${widgetOut(app)}
      <button class="hs-app" data-act="go" data-arg="home" aria-label="Open Eat It!">${appIcon({ size: 54, badge })}<span>Eat It!</span></button>
      <span class="hs-ghost"></span><span class="hs-ghost"></span><span class="hs-ghost"></span>
    </div>
    <div class="hs-dock" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </div>`;
}

function clockNow(store) {
  if (store.persona.clock) return store.persona.clock;
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function lockScreen(app) {
  const { store } = app;
  const s = store.state;
  const n = eatFirst(s, store.today).length;
  const oldest = oldestFrozen(s);
  const due = nudge(s, store.today);
  const name = (lot) => `${food(lot.food).short || food(lot.food).name}, bag ${bagNumber(s, lot)}`;
  const ring = `<svg viewBox="0 0 44 44" width="48" height="48" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--white)" stroke-width="4.5" opacity=".7"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--tomato)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${Math.min(1, n / 3) * 113} 113" transform="rotate(-90 22 22)"/></svg>`;
  return `<div class="screen phone lock">
    <div class="lk-top">
      <p class="lk-date">${esc(longDay(store.today))}</p>
      <p class="lk-time">${esc(clockNow(store))}</p>
      <div class="lk-widgets">
        <span class="lk-ring" role="img" aria-label="${n} to eat first">${ring}<b>${n}</b></span>
        ${oldest ? `<span class="lk-rect">${pic(oldest.food, { bag: true, size: 26 })}<span><b>Bag ${bagNumber(s, oldest)}</b><small>${frozenWeeks(oldest.date.on, store.today)} wk frozen</small></span></span>` : ''}
      </div>
    </div>
    ${due ? `<section class="notif" aria-label="Notification from Eat It!">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>now</small></div>
      <div class="nf-b">${pic(due.food, { bag: true, size: 40 })}<div><b>${esc(name(due))}</b><small>Frozen ${esc(frozenFor(due.date.on, store.today))}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="thaw" data-arg="${esc(due.id)}">Thaw tonight</button><button class="btn btn-secondary sm" data-act="later">Later</button></div>
    </section>` : ''}
    <button class="home-bar" data-act="go" data-arg="home" aria-label="Open Eat It!"><i></i></button>
  </div>`;
}
