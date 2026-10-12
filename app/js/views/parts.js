// Pieces several pages share: the open fridge, food tiles, Eat first, Today, Needs a look, Room at home.
import { food, foodName, shortName } from '../foods.js';
import { eatFirst, oldestFrozen, units, nudge, placeOf, hasFreezer, mealAnswer, mealSkipped } from '../state.js';
import { frozenWeeks, urgency, longDay } from '../dates.js';
import { shelvesOf } from '../seed.js';
import { ICON, placeIcon, appIcon } from '../icons.js';
import { esc, pic, tag, dotHtml, label, amountText } from '../ui.js';


const lowerFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);

// A lot's shelf inside a cold place (old or hand-moved lots may have none yet).
export function effSpot(lot, place, persona) {
  if (place.kind !== 'cold') return null;
  const spots = shelvesOf(place, persona).map((x) => x.spot);
  if (lot.spot && spots.includes(lot.spot)) return lot.spot;
  if (food(lot.food).cat === 'produce' && food(lot.food).spot === 'crisper') return 'crisper';
  return persona.house ? (lot.owner === 'shared' ? 'shared' : 'mine') : food(lot.food).spot === 'top' ? 'top' : 'middle';
}

// One tile per food on a shelf, most urgent / oldest lot first.
export function shelfGroups(app, place, spot, { filter } = {}) {
  const s = app.store.state, p = app.store.persona;
  const groups = new Map();
  for (const l of s.lots.values()) {
    if (l.place !== place.id || l.owner === 'housemate') continue;
    if (spot !== undefined && effSpot(l, place, p) !== spot) continue;
    if (filter && !filter(l)) continue;
    const k = l.name ? `${l.food}|${l.name}` : l.food;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(l);
  }
  return [...groups.values()].map((lots) => {
    lots.sort((a, b) => (a.date?.on || '9999').localeCompare(b.date?.on || '9999') || a.id.localeCompare(b.id));
    return { food: lots[0].food, lots, lot: lots[0], count: lots.reduce((n, l) => n + units(l), 0), fresh: lots.some((l) => s.fresh.has(l.id)) };
  }).sort((a, b) => (urgency(a.lot.date, app.store.today) ?? 99) - (urgency(b.lot.date, app.store.today) ?? 99) || foodName(a.food, 2, a.lot).localeCompare(foodName(b.food, 2, b.lot)));
}

export function tileHtml(app, t, { size = 54, oldestId } = {}) {
  const today = app.store.today;
  const frozen = t.lot.date?.kind === 'frozen';
  const wk = frozen && t.lots.some((l) => l.id === oldestId) ? frozenWeeks(t.lot.date.on, today) : 0;
  const q = app.ui.food.q.trim().toLowerCase();
  // Food at home's Mine / Shared filter fades the other tiles, the way search does.
  const own = ownFilter(app);
  const notOwn = own !== 'all' && !t.lots.some((l) => (own === 'shared') === (l.owner === 'shared'));
  const dim = (q && !foodName(t.food, 2, t.lot).toLowerCase().includes(q)) || notOwn;
  return `<button class="tile${t.fresh && app.ui.flash ? ' fresh' : ''}${dim ? ' dim' : ''}" data-act="lot" data-arg="${esc(t.lot.id)}" aria-label="${esc(label(t.food, t.count, t.lot.date, today, 'tile', t.lot))}">
    ${pic(t.food, { bag: t.lot.bag, size, lot: t.lot })}
    ${wk >= 2 ? `<span class="wk">${wk} wk</span>` : ''}
    ${dotHtml(t.lot.date, today)}
    ${t.count > 1 ? `<span class="count">${t.count}</span>` : ''}
    <span class="tile-name">${esc(shortName(t.food, t.lot))}</span>
  </button>`;
}

function fullness(n, capacity) {
  const filled = Math.min(capacity, n);
  const bars = Array.from({ length: capacity }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  return filled / capacity >= 0.75 ? `<span class="nearly" aria-label="Nearly full"><span class="bars">${bars}</span>Nearly full</span>` : '';
}

const othersIn = (persona, placeId) => (persona.others || []).filter((o) => o.place === placeId);

// 'all' | 'me' | 'shared': only on the Food at home page, and only in a shared house.
const ownFilter = (app) => (app.route === 'food' && app.store.state.house ? app.ui.food.own : 'all');

// The open fridge from boards 01/02: freezer on top, shelves, crisper. Housemates' shelf locked.
export function fridgePicture(app, { places } = {}) {
  const s = app.store.state, p = app.store.persona;
  const oldest = oldestFrozen(s);
  const cold = (places || s.places).filter((x) => x.kind === 'cold');
  const frozen = (places || s.places).filter((x) => x.kind === 'frozen');
  const zones = [];
  for (const fz of frozen) {
    const ts = shelfGroups(app, fz);
    zones.push(`<div class="zone zone-freezer"><span class="zone-label">${ICON.snow({ size: 13, stroke: 2.2 })}${esc(fz.name)}</span><div class="tiles">${ts.map((t) => tileHtml(app, t, { oldestId: oldest?.id })).join('') || '<span class="zone-empty">Empty</span>'}</div></div>`);
  }
  for (const c of cold) {
    for (const sh of shelvesOf(c, p)) {
      if (sh.kind === 'locked') {
        const os = othersIn(p, c.id);
        const n = os.reduce((a, o) => a + o.n, 0);
        const names = p.house.mates.map((m) => m.name).join(' & ');
        zones.push(`<div class="zone zone-locked${ownFilter(app) !== 'all' ? ' dim' : ''}" aria-label="${esc(names)}: ${n} items, private">${ICON.lock({ size: 18 })}<span class="avatars sm">${p.house.mates.map((m, i) => `<span class="avatar av-${i + 1}">${esc(m.initial)}</span>`).join('')}</span><span class="zl-name">${esc(names)}</span><span class="zl-n">${n}</span></div>`);
        continue;
      }
      const ts = shelfGroups(app, c, sh.spot);
      const head = sh.label
        ? `<div class="zone-head"><span class="pill">${sh.icon === 'people' ? ICON.people({ size: 14 }) : `<span class="avatar av-0 xs">${esc(p.initial)}</span>`}${esc(sh.label)}</span>${sh.capacity ? fullness(ts.length, sh.capacity) : ''}</div>`
        : '';
      zones.push(`<div class="zone zone-${sh.kind || 'shelf'}">${head}<div class="tiles">${ts.map((t) => tileHtml(app, t, { oldestId: oldest?.id })).join('')}</div></div>`);
    }
  }
  return zones.length ? `<section class="fridge" aria-label="Fridge">${zones.join('')}</section>` : '';
}

// Cupboard, rice bin, balcony …: one panel each, same tiles.
export function shelfPanel(app, place) {
  const p = app.store.persona;
  const ts = shelfGroups(app, place);
  const os = othersIn(p, place.id);
  const locked = os.length ? `<div class="zone zone-locked sm${ownFilter(app) !== 'all' ? ' dim' : ''}">${ICON.lock({ size: 16 })}<span class="zl-name">${esc(os.map((o) => o.who).join(' & '))}</span><span class="zl-n">${os.reduce((a, o) => a + o.n, 0)}</span></div>` : '';
  return `<section class="cab" aria-label="${esc(place.name)}">
    <div class="cab-h">${placeIcon(place, { size: 16 })}<b>${esc(place.name)}</b></div>
    <div class="tiles">${ts.map((t) => tileHtml(app, t, { size: 46 })).join('') || '<span class="zone-empty">Empty</span>'}</div>${locked}
  </section>`;
}

export function homePicture(app) {
  const s = app.store.state;
  const others = s.places.filter((x) => x.kind === 'room');
  return fridgePicture(app) + others.map((pl) => shelfPanel(app, pl)).join('');
}

export function eatFirstHtml(app, { limit = 3 } = {}) {
  const { store } = app;
  const today = store.today;
  const cards = eatFirst(store.state, today, limit);
  if (!cards.length) return '';
  return `<section class="eatfirst" aria-labelledby="ef-h">
    <h2 id="ef-h">Eat first</h2>
    <div class="ef-cards">${cards.map(({ food: f, lot }) => `
      <button class="ef-card" data-act="lot" data-arg="${esc(lot.id)}" aria-label="${esc(label(f, 1, lot.date, today, 'card', lot))}">
        ${pic(f, { size: 40, lot })}
        <span class="ef-name">${esc(foodName(f, 1, lot))}</span>
        ${tag(lot.date, today, 'card')}
      </button>`).join('')}
    </div>
  </section>`;
}

// One list row for a lot (Food list, Plan, Needs a look …).
export function lotRow(app, lot, { meta, right, act = 'lot' } = {}) {
  const today = app.store.today;
  const s = app.store.state, p = app.store.persona;
  const place = placeOf(s, lot.place);
  const m = meta ?? [amountText(lot), place?.name, p.house ? (lot.owner === 'shared' ? 'Shared' : 'Mine') : null].filter(Boolean).join(' · ');
  return `<button class="row" data-act="${act}" data-arg="${esc(lot.id)}">${pic(lot.food, { bag: lot.bag, size: 36, lot })}<span class="r-main"><b>${esc(foodName(lot.food, lot.unit === 'pc' ? lot.qty : 1, lot))}</b><small>${esc(m)}</small></span>${right ?? tag(lot.date, today)}</button>`;
}

// Today on Home: just "Ate at home today?" (and the freezer nudge when a bag is old enough).
export function todayHtml(app) {
  const s = app.store.state, today = app.store.today;
  const thaw = nudge(s, today);
  return `<div class="card today-card">
    ${thaw ? `<p class="thaw-line">${ICON.snow({ size: 15 })}${esc(shortName(thaw.food, thaw))}, bag 1 · ${frozenWeeks(thaw.date.on, today)} weeks<button class="link" data-act="thaw" data-arg="${esc(thaw.id)}">Thaw tonight</button></p>` : ''}
    ${mealCheck(app, today)}
  </div>`;
}


export function roomBars(app) {
  const s = app.store.state;
  const rows = s.places.map((pl) => {
    const v = pl.full ?? 0;
    const txt = pl.full == null ? 'not measured yet' : `${pl.src === 'photo' ? '≈' : 'about'} ${pl.full}% full`;
    return `<li><span class="rb-name">${placeIcon(pl, { size: 18 })}<b>${esc(pl.name)}</b></span><em>${esc(txt)}</em><div class="bar${v >= 80 ? ' hi' : ''}${pl.src === 'photo' ? ' est' : ''}"><i style="width:${v}%"></i></div></li>`;
  }).join('');
  const noFz = hasFreezer(s) ? '' : `<li class="muted-row"><span class="rb-name">${ICON.snow({ size: 18 })}<b>Freezer</b></span><em>none at home</em></li>`;
  return `<ul class="room">${rows || '<li class="muted-row">No storage places yet.</li>'}${noFz}</ul>`;
}


// Phone header for the other tabs: app icon + page title (board 01 style), optional action.
export function phoneTitle(app, title, right = '') {
  return `<header class="top phone-only"><span class="app-icon">${appIcon({ size: 34, badge: false })}</span><h1>${esc(title)}</h1>${right}</header>`;
}

// ---------- what happened on a day (week calendar, Home) ----------

function historyLine(h) {
  const n = foodName(h.food, 2, h);
  switch (h.kind) {
    case 'ate':
      if (h.left) return `${n}: ${h.left === 'none' ? 'all gone' : h.left === 'little' ? 'a little left' : 'plenty left'}`;
      if (h.part) return `${n}: some`;
      return `${n} −${h.qty}${h.unit === 'bag' ? (h.qty === 1 ? ' bag' : ' bags') : ''}`;
    case 'use': return `${n}: ${h.how === 'some' ? 'used some' : 'used one'}`;
    case 'qty': return h.to <= 0 ? `${n}: all gone` : `${n}: ${h.from} → ${h.to}`;
    case 'amount': return `${n}: ${h.value.toLowerCase()} left`;
    case 'toss': return `${n}: thrown out`;
    case 'thaw': return `${n}: thawed`;
    case 'freeze': return `${n}: frozen`;
    default: return '';
  }
}

// Several taps on − for the same food in a row read as one change: "Eggs: 6 → 4".
function mergeFixes(list) {
  const out = [];
  for (const h of list) {
    const prev = out[out.length - 1];
    if (h.kind === 'qty' && prev?.kind === 'qty' && prev.food === h.food && prev.name === h.name && prev.to === h.from) prev.to = h.to;
    else out.push({ ...h });
  }
  return out;
}

// Lines like "Tomatoes −2", "Curry: all gone", "Eggs: 6 → 4" for one day.
export function dayLog(s, day) {
  return mergeFixes((s.history[day] || []).filter((h) => h.kind !== 'put')).map(historyLine).filter(Boolean);
}

// "Ate at home today?" — the check that leads to logging what was used (stock out), for today or
// any earlier day in the calendar. Yes asks whether to record it now (by voice); No marks the day as
// eaten out (nothing to log). Once something is logged it lists what was used, with a way to add more.
// A day still to come can be planned ahead: "Eating at home on Thursday?" — No marks it as a day out.
export function mealCheck(app, day) {
  const s = app.store.state;
  const isToday = day === app.store.today;
  const name = longDay(day).split(' ')[0];
  const when = isToday ? 'today' : `on ${name}`;
  const lines = dayLog(s, day);
  const ans = mealAnswer(s, day);
  const change = `<button class="link" data-act="meal" data-arg="${day}|none">Change</button>`;
  if (day > app.store.today) {
    if (ans === 'out') return `<div class="meal"><p>${ICON.fork({ size: 15 })}Eating out on ${esc(name)}</p>${change}</div>`;
    if (ans === 'home') return `<div class="meal"><p>${ICON.home({ size: 15 })}Eating at home on ${esc(name)}</p>${change}</div>`;
    return `<div class="meal ask"><p class="meal-q">Eating at home on ${esc(name)}?</p><div class="btn-row wrap"><button class="btn btn-primary sm" data-act="meal" data-arg="${day}|home">Yes</button><button class="btn btn-secondary sm" data-act="meal" data-arg="${day}|out">No, eating out</button></div></div>`;
  }
  const record = (label, cls) => `<button class="btn ${cls} sm" data-act="ate-for" data-arg="${day}">${ICON.mic({ size: 16 })}${label}</button>`;
  if (lines.length) return `<div class="meal"><ul class="plain">${lines.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><button class="chip-btn" data-act="ate-for" data-arg="${day}">${ICON.mic({ size: 14 })}Add more</button></div>`;
  if (ans === 'out') return `<div class="meal"><p>${ICON.fork({ size: 15 })}Ate out, nothing to log</p>${change}</div>`;
  if (ans === 'home' && mealSkipped(s, day)) return `<div class="meal"><p>${ICON.home({ size: 15 })}At home · not recorded</p><div class="btn-row wrap">${record('Record now', 'btn-secondary')}${change}</div></div>`;
  if (ans === 'home') {
    return `<div class="meal ask"><p class="meal-q">Record what you used?</p>
      <div class="btn-row wrap">${record('Record by voice', 'btn-primary')}<button class="btn btn-quiet sm" data-act="meal" data-arg="${day}|skip">Not now</button></div></div>`;
  }
  return `<div class="meal ask"><p class="meal-q">Ate at home ${esc(when)}?</p><div class="btn-row wrap"><button class="btn btn-primary sm" data-act="meal" data-arg="${day}|home">Yes</button><button class="btn btn-secondary sm" data-act="meal" data-arg="${day}|out">No, ate out</button></div></div>`;
}
