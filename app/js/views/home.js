// Home. Phone: boards 01/02 (open fridge + Eat first), then Tonight and Needs a look.
// Desktop: the v0.2 "Today" page — greeting, fridge on the left, Tonight / Needs a look / Room at home on the right.
import { foodName } from '../foods.js';

import { fmtDay, greeting, dateTag } from '../dates.js';
import { ICON, appIcon } from '../icons.js';
import { esc, pic, pageHead, secHead, label } from '../ui.js';
import { homePicture, eatFirstHtml, tonightHtml, needsLook, roomBars, moveBanner, shelfGroups } from './parts.js';

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
  const hr = parseInt(clock, 10);
  const empty = s.lots.size === 0
    ? `<div class="card card-leaf"><p class="card-t">Your fridge is empty</p><p>Add what you have now. The quickest way is a photo of your fridge or your last receipt.</p>
        <div class="btn-row wrap"><button class="btn btn-primary sm" data-act="go" data-arg="add">Add food</button><button class="btn btn-secondary sm" data-act="method" data-arg="type">Type it in</button></div></div>`
    : '';
  const desk = pageHead(`${esc(fmtDay(today))} · ${esc(clock)}`, `${esc(greeting(clock))}, ${esc(s.profile.name || p.name)}`, null,
    `<button class="btn btn-secondary" data-act="go" data-arg="ate">${ICON.minus({ size: 18, stroke: 2.4 })}I ate</button><button class="btn btn-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}Add food</button>`);
  const picture = ui.view === 'list' ? listAll(app) : homePicture(app);
  const pictureHead = `<div class="sec-h desk-only"><h2>${esc(title)}</h2><button class="link" data-act="view">${ui.view === 'list' ? 'Show the fridge' : 'Show as a list'}</button></div>`;
  return `<div class="page home">
    ${phoneHeader(app, title)}
    <div class="desk-only">${desk}</div>
    ${empty}
    <div class="cols2 home-grid">
      <div class="stack">
        ${eatFirstHtml(app)}
        ${pictureHead}
        ${picture}
      </div>
      <div class="stack">
        <section>${secHead(hr >= 15 ? 'Tonight' : 'Today')}${moveBanner(app)}${tonightHtml(app)}</section>
        <section>${secHead('Needs a look')}${needsLook(app)}</section>
        <section class="desk-only">${secHead('Room at home', '<button class="link" data-act="sheet" data-arg="places">Update</button>')}<div class="card flush">${roomBars(app)}</div></section>
      </div>
    </div>
  </div>`;
}
