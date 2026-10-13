// Home, kept short: Eat first, the open fridge (boards 01/02) and "Ate at home today?".
// Everything else has its own page now (Food at home, Week calendar, Shopping list, Household).

import { foodName, canFreeze } from '../foods.js?v=1d4b465';
import { fmtDay, greeting, dateTag, daysBetween } from '../dates.js?v=1d4b465';
import { awayRuns, hasFreezer } from '../state.js?v=1d4b465';
import { ICON, appIcon } from '../icons.js?v=1d4b465';
import { esc, pic, pageHead, label, tag } from '../ui.js?v=1d4b465';
import { prefs } from '../store.js?v=1d4b465';
import { homePicture, eatFirstHtml, todayHtml, shelfGroups, awayTitle, awayWhen } from './parts.js?v=1d4b465';

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

// First visit: how it works in three lines, until "Got it" (once per user, on this device).
function guide(app) {
  if (prefs.get(`guide:${app.store.persona.id}`, false)) return '';
  const row = (icon, t, d) => `<li><span class="g-ic">${icon}</span><span><b>${t}</b><small>${d}</small></span></li>`;
  return `<section class="card guide" aria-label="How it works">
    <ul>${row(ICON.plus({ size: 18, stroke: 2.4 }), 'Add food', 'Snap it or the receipt.')}${row(ICON.fridge({ size: 18 }), 'Eat first', 'Use these soon.')}${row(ICON.mic({ size: 18 }), 'I ate', 'Say what you cooked.')}</ul>
    <button class="btn btn-primary sm" data-act="guide-done">Got it</button>
  </section>`;
}

// Days out coming up (marked in the week calendar): from two days before, a big reminder of the food
// that would go off while you're away: use it, or freeze it if it freezes and there is a freezer.
function awayCard(app) {
  const s = app.store.state, today = app.store.today, id = app.store.persona.id;
  const r = awayRuns(s, today).find((x) => x.prep >= today && daysBetween(today, x.prep) <= 2 && !prefs.get(`away:${id}:${x.from}`, false));
  if (!r) return '';
  const freezer = hasFreezer(s);
  return `<section class="card away" aria-label="Before you're out">
    <div class="away-h"><span class="g-ic">${ICON.fork({ size: 18 })}</span><div><b>${esc(awayTitle(r, today))}</b><small>Use or freeze these ${esc(awayWhen(r, today))}.</small></div></div>
    <ul class="away-list">${r.lots.map((l) => `<li><button class="away-food" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 32, lot: l })}<span><b>${esc(foodName(l.food, 2, l))}</b>${tag(l.date, today)}</span></button>${freezer && canFreeze(l.food) ? `<button class="chip-btn" data-act="freeze" data-arg="${esc(l.id)}">${ICON.snow({ size: 14 })}Freeze</button>` : ''}</li>`).join('')}</ul>
    <button class="link" data-act="away-ok" data-arg="${r.from}">Got it</button>
  </section>`;
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
    ${guide(app)}
    ${awayCard(app)}
    ${empty}
    <div class="home-grid">
      <div class="h-eat">${eatFirstHtml(app)}</div>
      <div class="h-fridge">${ui.view === 'list' ? listAll(app) : homePicture(app)}</div>
      <div class="h-today">${todayHtml(app)}</div>
    </div>
  </div>`;
}
