// Boards 05 and 06: what the app looks like outside the app. A web page can't put real widgets on
// an iPhone, so these are live previews drawn from the same fridge; taps here change the fridge.

import { food, foodName, shortName } from '../foods.js';
import { eatFirst, oldestFrozen, frozenLots, bagNumber, nudge, modeOf, awayRuns } from '../state.js';
import { urgency, frozenWeeks, frozenFor, longDay, dot } from '../dates.js';
import { ICON, appIcon } from '../icons.js';
import { esc, pic, label } from '../ui.js';
import { shelfGroups, awayTitle } from './parts.js';

function freshGroups(app) {
  const s = app.store.state, today = app.store.today;
  return s.places.filter((pl) => pl.kind !== 'frozen').flatMap((pl) => shelfGroups(app, pl))
    .sort((a, b) => (urgency(a.lot.date, today) ?? 99) - (urgency(b.lot.date, today) ?? 99));
}

function widgetGrid(app) {
  const today = app.store.today;
  const groups = freshGroups(app);
  const fruit = [...groups.filter((t) => food(t.food).cat === 'produce'), ...groups.filter((t) => food(t.food).cat !== 'produce')].slice(0, 4);
  return `<section class="w w-sm w-grid" aria-label="Use soon">${fruit.map((t) => {
    const d = dot(t.lot.date, today);
    return `<button class="wg-tile${d ? ' hot' : ''}" data-act="use" data-arg="${esc(t.lot.id)}|one" aria-label="Used one: ${esc(label(t.food, t.count, t.lot.date, today, 'tile', t.lot))}">${pic(t.food, { size: 34, lot: t.lot })}${d ? '<span class="dot dot-red"></span>' : ''}</button>`;
  }).join('')}</section>`;
}

function widgetFreezer(app) {
  const s = app.store.state, today = app.store.today;
  const lot = oldestFrozen(s);
  if (!lot) {
    const n = eatFirst(s, today).length;
    return `<section class="w w-sm w-count" aria-label="${n} to use soon"><span class="wc-n">${n}</span><span class="wc-l">Use soon</span></section>`;
  }
  const n = frozenLots(s).filter((l) => l.food === lot.food).length;
  const wk = frozenWeeks(lot.date.on, today);
  return `<section class="w w-sm w-freezer" aria-label="Freezer: ${n} bags of ${esc(foodName(lot.food, 2, lot))}, oldest ${esc(frozenFor(lot.date.on, today))}">
    <span class="wf-snow">${ICON.snow({ size: 18 })}</span>
    ${wk >= 1 ? `<span class="wf-wk">${wk} wk</span>` : ''}
    <span class="wf-pic">${pic(lot.food, { bag: true, size: 52, lot })}</span>
    <span class="wf-n">${n}</span>
  </section>`;
}

function widgetMedium(app) {
  const groups = freshGroups(app).slice(0, 8);
  return `<section class="w w-md" aria-label="My fridge">
    <div class="wm-main">
      <div class="wm-h">${appIcon({ size: 18, badge: false })}<span>My fridge</span></div>
      <div class="wm-tiles">${groups.map((t) => `<span class="wm-tile">${pic(t.food, { size: 24, lot: t.lot })}${t.count > 1 ? `<b>${t.count}</b>` : ''}</span>`).join('')}</div>
    </div>
    <div class="wm-btns">
      <button class="wm-b plus" data-act="go" data-arg="add" aria-label="Add food">${ICON.plus({ size: 18, stroke: 2.4 })}</button>
      <button class="wm-b minus" data-act="go" data-arg="ate" aria-label="I ate">${ICON.minus({ size: 18, stroke: 2.4 })}</button>
    </div>
  </section>`;
}

function widgetOut(app) {
  const s = app.store.state, today = app.store.today;
  const on = modeOf(s, today) === 'out';
  return `<section class="w w-sm w-out">
    ${on ? `<span class="wo-moved">${ICON.fork({ size: 18 })}Eating out</span>` : `<span class="wo-icon">${ICON.plate({ size: 22, stroke: 1.8 })}</span>`}
    <span class="wo-title">Out tonight</span>
    <button class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="Out tonight" data-act="out"><i></i></button>
  </section>`;
}

function homeScreenInner(app) {
  const badge = eatFirst(app.store.state, app.store.today).length > 0;
  return `<div class="screen phone home-screen">
    <div class="hs-grid">
      ${widgetGrid(app)}${widgetFreezer(app)}${widgetMedium(app)}${widgetOut(app)}
      <button class="hs-app" data-act="go" data-arg="home" aria-label="Open Eat It!">${appIcon({ size: 54, badge })}<span>Eat It!</span></button>
      <span class="hs-ghost"></span><span class="hs-ghost"></span><span class="hs-ghost"></span>
    </div>
    <div class="hs-dock" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  </div>`;
}

function lockInner(app) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const due = nudge(s, today);
  const use = eatFirst(s, today, 5).filter((x) => x.u <= 1);
  const n = eatFirst(s, today).length;
  const oldest = oldestFrozen(s);
  const names = s.settings.lockNames;
  const clock = app.store.clock;
  const ring = `<svg viewBox="0 0 44 44" width="48" height="48" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--white)" stroke-width="4.5" opacity=".7"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--tomato)" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${Math.min(1, n / 3) * 113} 113" transform="rotate(-90 22 22)"/></svg>`;
  let notif = '';
  const away = awayRuns(s, today).find((r) => r.prep === today);
  if (away && !app.ui.lockDismissed) {
    const list = away.lots.map((l) => foodName(l.food, 2, l).toLowerCase());
    const body = names ? `Use or freeze today: ${list.slice(0, -1).join(', ')}${list.length > 1 ? ' and ' : ''}${list[list.length - 1]}.` : `${list.length} thing${list.length > 1 ? 's' : ''} to use or freeze today.`;
    notif = `<section class="notif" aria-label="Notification from Eat It!">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>now</small></div>
      <div class="nf-b">${names ? `<span class="nf-pics">${away.lots.slice(0, 3).map((l) => pic(l.food, { size: 30, lot: l })).join('')}</span>` : ''}<div><b>${esc(awayTitle(away, today))}</b><small>${esc(body)}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="go" data-arg="home">Open</button><button class="btn btn-secondary sm" data-act="lock-dismiss">Later</button></div>
    </section>`;
  } else if (due && !app.ui.lockDismissed) {
    const title = names ? `${shortName(due.food, due)}, bag ${bagNumber(s, due)}` : 'The oldest bag in your freezer';
    notif = `<section class="notif" aria-label="Notification from Eat It!">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>now</small></div>
      <div class="nf-b">${names ? pic(due.food, { bag: true, size: 40, lot: due }) : ''}<div><b>${esc(title)}</b><small>Frozen ${esc(frozenFor(due.date.on, today))}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="thaw" data-arg="${esc(due.id)}">Thaw tonight</button><button class="btn btn-secondary sm" data-act="later">Later</button></div>
    </section>`;
  } else if (use.length && !app.ui.lockDismissed) {
    const list = use.map((x) => foodName(x.food, 2, x.lot).toLowerCase());
    const body = names ? `${list.slice(0, -1).join(', ')}${list.length > 1 ? ' and ' : ''}${list[list.length - 1]}.` : `${use.length} thing${use.length > 1 ? 's' : ''} to use today.`;
    notif = `<section class="notif" aria-label="Notification from Eat It!">
      <div class="nf-h">${appIcon({ size: 18, badge: false })}<span>Eat It!</span><small>now</small></div>
      <div class="nf-b">${names ? `<span class="nf-pics">${use.slice(0, 3).map((x) => pic(x.food, { size: 30, lot: x.lot })).join('')}</span>` : ''}<div><b>${use.some((x) => x.u <= 0) ? 'Use today' : 'Use soon'}</b><small>${esc(body.charAt(0).toUpperCase() + body.slice(1))}</small></div></div>
      <div class="btn-row"><button class="btn btn-primary sm" data-act="go" data-arg="home">Open</button><button class="btn btn-secondary sm" data-act="lock-dismiss">Later</button></div>
    </section>`;
  }
  return `<div class="screen phone lock">
    <div class="lk-top">
      <p class="lk-date">${esc(longDay(today))}</p>
      <p class="lk-time">${esc(clock)}</p>
      <div class="lk-widgets">
        <span class="lk-ring" role="img" aria-label="${n} to eat first">${ring}<b>${n}</b></span>
        ${oldest ? `<span class="lk-rect">${pic(oldest.food, { bag: true, size: 26, lot: oldest })}<span><b>Bag ${bagNumber(s, oldest)}</b><small>${frozenWeeks(oldest.date.on, today)} wk frozen</small></span></span>` : ''}
      </div>
    </div>
    ${notif}
    <button class="home-bar" data-act="go" data-arg="home" aria-label="Open Eat It!"><i></i></button>
  </div>`;
}

export function widgetsPage(app) {
  return `<div class="phone-only fill">${homeScreenInner(app)}</div><div class="desk-only device-stage">${homeScreenInner(app)}<p class="stage-note">Home-screen widgets. A web page can't add real widgets, so this preview uses the same data: tap a fruit to use one, or turn on Out tonight.</p></div>`;
}

export function lockPage(app) {
  return `<div class="phone-only fill">${lockInner(app)}</div><div class="desk-only device-stage">${lockInner(app)}<p class="stage-note">Lock screen with one quiet nudge a day. You can hide food names in Household.</p></div>`;
}
