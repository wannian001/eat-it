// Boards 01 and 02: the open fridge (or the list view), "Eat first", and the food card.
import { food, foodName } from '../foods.js';
import { tiles, eatFirst, bagNumber, oldestFrozen } from '../state.js';
import { daysBetween, frozenWeeks, dateTag } from '../dates.js';
import { zonesOf } from '../seed.js';
import { ICON, appIcon } from '../icons.js';
import { esc, pic, tag, dotHtml, label } from '../ui.js';

export function header(app) {
  const { store, ui } = app;
  const p = store.persona;
  const people = p.house
    ? `<span class="avatars">${[{ initial: p.initial }, ...p.house.mates].map((m, i) => `<span class="avatar av-${i}">${esc(m.initial)}</span>`).join('')}</span>`
    : `<span class="avatar av-0">${esc(p.initial)}</span>`;
  return `<header class="top">
    <span class="app-icon">${appIcon({ size: 34, badge: false })}</span>
    <h1>${esc(p.title)}</h1>
    <button class="round" data-act="view" aria-label="${ui.view === 'list' ? 'Show fridge' : 'Show list'}">${ui.view === 'list' ? ICON.fridge() : ICON.grid()}</button>
    <button class="people" data-act="me" aria-label="People and settings">${people}</button>
  </header>`;
}

function eatFirstHtml(app) {
  const { store } = app;
  const today = store.today;
  const cards = eatFirst(store.state, today);
  if (!cards.length) return '';
  return `<section class="eatfirst" aria-labelledby="ef-h">
    <h2 id="ef-h">Eat first</h2>
    <div class="ef-cards">${cards.map(({ food: f, lot }) => `
      <button class="ef-card" data-act="food" data-arg="${esc(lot.spot)}|${esc(f)}" aria-label="${esc(label(f, 1, lot.date, today, 'card'))}">
        ${pic(f, { size: 40 })}
        <span class="ef-name">${esc(food(f).name)}</span>
        ${tag(lot.date, today, 'card')}
      </button>`).join('')}
    </div>
  </section>`;
}

function tileHtml(app, t, { oldestId }) {
  const today = app.store.today;
  const inFreezer = t.lot.spot === 'freezer';
  const wk = inFreezer && t.lots.some((l) => l.id === oldestId) ? frozenWeeks(t.lot.date.on, today) : 0;
  return `<button class="tile${t.fresh && app.ui.flash ? ' fresh' : ''}" data-act="food" data-arg="${esc(t.lot.spot)}|${esc(t.food)}" aria-label="${esc(label(t.food, t.count, t.lot.date, today))}">
    ${pic(t.food, { bag: t.lot.bag, size: 54 })}
    ${wk >= 2 ? `<span class="wk">${wk} wk</span>` : ''}
    ${dotHtml(t.lot.date, today)}
    ${t.count > 1 ? `<span class="count">${t.count}</span>` : ''}
  </button>`;
}

function fullness(n, capacity) {
  const filled = Math.min(capacity, n);
  const bars = Array.from({ length: capacity }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  return filled / capacity >= 0.75
    ? `<span class="full" aria-label="Nearly full"><span class="bars">${bars}</span>Nearly full</span>` : '';
}

function fridgeHtml(app) {
  const { store } = app;
  const s = store.state;
  const p = store.persona;
  const oldest = oldestFrozen(s);
  const zones = zonesOf(p).map((z) => {
    if (z.kind === 'locked') {
      const n = [...s.lots.values()].filter((l) => l.owner === 'housemate').length;
      const names = p.house.mates.map((m) => m.name).join(' & ');
      return `<div class="zone zone-locked" aria-label="${esc(names)}: ${n} items">
        ${ICON.lock({ size: 18 })}
        <span class="avatars sm">${p.house.mates.map((m, i) => `<span class="avatar av-${i + 1}">${esc(m.initial)}</span>`).join('')}</span>
        <span class="zl-name">${esc(names)}</span><span class="zl-n">${n}</span>
      </div>`;
    }
    const ts = tiles(s, z.spot, store.today);
    const head = z.kind === 'freezer'
      ? `<span class="zone-label">${ICON.snow({ size: 13, stroke: 2.2 })}Freezer</span>`
      : z.label
        ? `<div class="zone-head"><span class="pill">${z.icon === 'people' ? ICON.people({ size: 14 }) : `<span class="avatar av-0 xs">${esc(p.initial)}</span>`}${esc(z.label)}</span>${z.capacity ? fullness(ts.length, z.capacity) : ''}</div>`
        : '';
    return `<div class="zone zone-${z.kind || 'shelf'}">${head}<div class="tiles">${ts.map((t) => tileHtml(app, t, { oldestId: oldest?.id })).join('')}</div></div>`;
  }).join('');
  const empty = s.lots.size === 0 ? '<p class="empty">Tap Add food to fill your fridge.</p>' : '';
  return `<section class="fridge" aria-label="${esc(p.title)}">${zones}</section>${empty}`;
}

function listHtml(app) {
  const { store } = app;
  const s = store.state;
  const today = store.today;
  const p = store.persona;
  const sections = [];
  const groupTiles = (spots) => spots.flatMap((spot) => tiles(s, spot, today));
  const zones = zonesOf(p);
  if (zones.some((z) => z.kind === 'freezer')) sections.push(['Freezer', groupTiles(['freezer']), 'frozen']);
  if (p.house) {
    sections.push(['Mine', groupTiles(['mine', 'crisper'])]);
    sections.push(['Shared', groupTiles(['shared'])]);
  } else {
    sections.push(['Fridge', groupTiles(['top', 'middle', 'crisper'])]);
  }
  const body = sections.filter(([, ts]) => ts.length).map(([title, ts, kind]) => `
    <h3 class="list-h">${esc(title)}</h3>
    <div class="list-grid">${ts.map((t) => {
      const d = dateTag(t.lot.date, today);
      return `<button class="ltile${kind ? ` ltile-${kind}` : ''}${t.fresh && app.ui.flash ? ' fresh' : ''}" data-act="food" data-arg="${esc(t.lot.spot)}|${esc(t.food)}" aria-label="${esc(label(t.food, t.count, t.lot.date, today))}">
        ${pic(t.food, { bag: t.lot.bag, size: 34 })}
        <span class="lt-name">${esc(foodName(t.food, t.count))}${t.count > 1 ? ` <b>${t.count}</b>` : ''}</span>
        <span class="lt-date d-${d.kind}">${esc(d.text)}</span>
      </button>`;
    }).join('')}</div>`).join('');
  const mates = p.house ? [...s.lots.values()].filter((l) => l.owner === 'housemate').length : 0;
  const locked = p.house ? `<p class="list-locked">${ICON.lock({ size: 16 })}${esc(p.house.mates.map((m) => m.name).join(' & '))}<b>${mates}</b></p>` : '';
  return `<section class="list" aria-label="Food list">${body || '<p class="empty">Tap Add food to fill your fridge.</p>'}${locked}</section>`;
}

export function homeScreen(app) {
  return `<div class="screen home">
    ${header(app)}
    <main class="scroll">
      ${eatFirstHtml(app)}
      ${app.ui.view === 'list' ? listHtml(app) : fridgeHtml(app)}
    </main>
    <nav class="dock" aria-label="Actions">
      <div class="seg">
        <button class="seg-primary" data-act="go" data-arg="add">${ICON.plus({ size: 18, stroke: 2.4 })}Add food</button>
        <button class="seg-plain" data-act="go" data-arg="ate">${ICON.minus({ size: 18, stroke: 2.4 })}I ate</button>
      </div>
    </nav>
  </div>`;
}

// ---------- food card (bottom sheet) ----------

function sentence(app, lot) {
  const today = app.store.today;
  const d = lot.date;
  if (!d) return 'No date for this one.';
  const days = daysBetween(today, d.on);
  switch (d.kind) {
    case 'use_by':
      return days < 0 ? "The use by date has passed, so don't eat it." : 'Use by is a safety date. Eat it by then.';
    case 'best_before':
      return 'Best before is about quality. Often still fine after — check it.';
    case 'frozen':
      return lot.id === oldestFrozen(app.store.state)?.id ? 'The oldest bag in your freezer. Use it first.' : 'Use older bags before this one.';
    case 'est': {
      if (food(lot.food).leftover) {
        const ago = daysBetween(lot.addedOn, today);
        const when = ago <= 0 ? 'Cooked today.' : ago === 1 ? 'Cooked yesterday.' : `Cooked ${ago} days ago.`;
        return `${when} Leftovers keep about 2–3 days in the fridge.`;
      }
      if (lot.thawed) return 'Thawed in the fridge. Our guess — tap the date to change it.';
      return 'No date on the pack. Our guess — tap the date to change it.';
    }
    default: return '';
  }
}

export function foodSheet(app) {
  const { store, ui } = app;
  const [spot, f] = ui.sheet.arg.split('|');
  const t = tiles(store.state, spot, store.today).find((x) => x.food === f);
  if (!t) return '';
  const lot = t.lot;
  const today = store.today;
  const bagNo = lot.spot === 'freezer' && lot.bag ? bagNumber(store.state, lot) : 0;
  const title = bagNo ? `${food(f).short || food(f).name}, bag ${bagNo}` : foodName(f, t.count);
  const isEst = lot.date?.kind === 'est';
  const dateHtml = isEst
    ? (ui.sheet.edit
      ? `<span class="stepper"><button class="step" data-act="est" data-arg="${esc(lot.id)}|-1" aria-label="One day sooner">${ICON.minus({ size: 16 })}</button>${tag(lot.date, today, 'sheet')}<button class="step" data-act="est" data-arg="${esc(lot.id)}|1" aria-label="One day later">${ICON.plus({ size: 16 })}</button></span>`
      : `<button class="tag-btn" data-act="est-edit" aria-label="Change the estimate, now ${esc(dateTag(lot.date, today, 'sheet').text)}">${tag(lot.date, today, 'sheet')}</button>`)
    : tag(lot.date, today, 'sheet');
  return `<div class="sheet-wrap" data-act="close" role="presentation">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-stop>
      <span class="handle" aria-hidden="true"></span>
      <div class="sheet-head">
        <span class="sheet-pic">${pic(f, { bag: lot.bag, size: 56 })}</span>
        <div><h2 id="sheet-title">${esc(title)}</h2>${dateHtml}</div>
      </div>
      <p class="sheet-text">${esc(sentence(app, lot))}${lot.part ? ' Some already used.' : ''}</p>
      <div class="btn-row">
        <button class="btn btn-primary" data-act="use" data-arg="${esc(lot.id)}|one">Used it</button>
        <button class="btn btn-secondary" data-act="use" data-arg="${esc(lot.id)}|some">Used some</button>
      </div>
    </section>
  </div>`;
}
