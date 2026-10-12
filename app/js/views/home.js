// Home, kept short: Eat first, the open fridge (boards 01/02) and "Ate at home today?".
// Everything else has its own page now (Food at home, Week calendar, Shopping list, Household).

import { foodName } from '../foods.js';
import { fmtDay, greeting, dateTag } from '../dates.js';
import { ICON, appIcon } from '../icons.js';
import { esc, pic, pageHead, label } from '../ui.js';
import { homePicture, eatFirstHtml, todayHtml, shelfGroups } from './parts.js';

export function phoneHeader(app, title) {
  const { store, ui } = app;
  const p = store.persona;
  const s = store.state;
  const people = s.house && p.house
    ? `<span class="avatars">${[{ initial: p.initial }, ...p.house.mates].map((m, i) => `<span class="avatar av-${i}">${esc(m.initial)}</span>`).join('')}</span>`
    : `<span class="avatar av-0">${esc((s.profile.name || p.name)[0])}</span>`;
  return `<header class="top phone-only">
    <span class="app-icon">${appIcon({ size: 34, badge: false })}</span>
    <h1>${esc(title)}</h1>
    <button class="round" data-act="view" aria-label="${ui.view === 'list' ? 'Show fridge' : 'Show list'}">${ui.view === 'list' ? ICON.fridge() : ICON.grid()}</button>
    <button class="people" data-act="go" data-arg="settings" aria-label="Household and settings">${people}</button>
  </header>`;
}

function listAll(app) {
  const s = app.store.state, today = app.store.today;
  const body = s.places.map((pl) => {
    const ts = shelfGroups(app, pl);
    if (!ts.length) return '';
    return `<h3 class="list-h">${esc(pl.name)}</h3><div class="list-grid">${ts.map((t) => {
      const d = dateTag(t.lot.date, today);
      return `<button class="ltile${pl.kind === 'frozen' ? ' ltile-frozen' : ''}" data-act="lot" data-arg="${esc(t.lot.id)}" aria-label="${esc(label(t.food, t.count, t.lot.date, today, 'tile', t.lot))}">
        ${pic(t.food, { bag: t.lot.bag, size: 34, lot: t.lot })}
        <span class="lt-name">${esc(foodName(t.food, t.count, t.lot))}${t.count > 1 ? ` <b>${t.count}</b>` : ''}</span>
        <span class="lt-date d-${d.kind}">${esc(d.text)}</span>
      </button>`;
    }).join('')}</div>`;
  }).join('');
  return `<section class="list">${body || ''}</section>`;
}

export function homePage(app) {
  const { store, ui } = app;
  const s = store.state, p = store.persona, today = store.today, clock = store.clock;
  const title = s.house ? 'Our fridge' : 'My fridge';
  const empty = s.lots.size === 0
    ? `<div class="card card-leaf h-empty"><p class="card-t">Your fridge is empty</p><div class="btn-row"><button class="btn btn-primary sm" data-act="go" data-arg="add">${ICON.plus({ size: 16, stroke: 2.4 })}Add food</button></div></div>`
    : '';
  return `<div class="page home">
    ${phoneHeader(app, title)}
    <div class="desk-only">${pageHead(`${esc(fmtDay(today))} · ${esc(clock)}`, `${esc(greeting(clock))}, ${esc(s.profile.name || p.name)}`)}</div>
    ${empty}
    <div class="home-grid">
      <div class="h-eat">${eatFirstHtml(app)}</div>
      <div class="h-fridge">${ui.view === 'list' ? listAll(app) : homePicture(app)}</div>
      <div class="h-today">${todayHtml(app)}</div>
    </div>
  </div>`;
}
