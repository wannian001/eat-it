// Pieces several pages share: the open fridge, food tiles, Eat first, Tonight, Needs a look, Room at home.
import { food, foodName, shortName } from '../foods.js';
import { eatFirst, oldestFrozen, units, modeOf, planWarnings, rescueDay, placeOf, hasFreezer } from '../state.js';
import { frozenWeeks, dateTag, fmtDay, urgency, daysBetween } from '../dates.js';
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
  const dim = q && !foodName(t.food, 2, t.lot).toLowerCase().includes(q);
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
        zones.push(`<div class="zone zone-locked" aria-label="${esc(names)}: ${n} items, private">${ICON.lock({ size: 18 })}<span class="avatars sm">${p.house.mates.map((m, i) => `<span class="avatar av-${i + 1}">${esc(m.initial)}</span>`).join('')}</span><span class="zl-name">${esc(names)}</span><span class="zl-n">${n}</span></div>`);
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
  const locked = os.length ? `<div class="zone zone-locked sm">${ICON.lock({ size: 16 })}<span class="zl-name">${esc(os.map((o) => o.who).join(' & '))}</span><span class="zl-n">${os.reduce((a, o) => a + o.n, 0)}</span></div>` : '';
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

// What moved after plans changed, and what won't last (v0.2 banner).
export function moveBanner(app) {
  const s = app.store.state, today = app.store.today;
  const mv = s.lastMove;
  const warns = planWarnings(s, today);
  if (!mv && !warns.length) return '';
  let msg = '';
  if (mv && mv.mode !== 'cook') {
    const moved = mv.moved.filter((m) => s.lots.has(m.lot));
    const tos = [...new Set(moved.map((m) => m.to))];
    msg = !moved.length ? 'Nothing was planned for that day, so nothing moved.'
      : tos.length === 1 && tos[0] ? `${moved.length} item${moved.length > 1 ? 's' : ''} moved to ${fmtDay(tos[0])}.` : `${moved.length} items moved to the next days you cook.`;
    const first = moved.map((m) => s.lots.get(m.lot)).filter((l) => l && l.date?.kind !== 'frozen')
      .sort((a, b) => (urgency(a.date, today) ?? 99) - (urgency(b.date, today) ?? 99))[0];
    if (first) msg += ` Use the ${foodName(first.food, 2, first).toLowerCase()} first: ${lowerFirst(dateTag(first.date, today).text)}.`;
  }
  const w = warns.map(({ lot, day }) => {
    const alt = rescueDay(s, lot, today);
    const fix = alt && alt !== day ? `<button class="chip-btn on" data-act="plan-move" data-arg="${esc(lot.id)}|${alt}">Move to ${esc(fmtDay(alt))}</button>`
      : hasFreezer(s) && lot.date?.kind !== 'frozen' ? `<button class="chip-btn" data-act="lot" data-arg="${esc(lot.id)}">Freeze it</button>` : '';
    return `<div class="warn-row"><span><b>${esc(foodName(lot.food, 2, lot))}</b> may not last until ${esc(fmtDay(day))} (${esc(lowerFirst(dateTag(lot.date, today).text))}).</span>${fix}</div>`;
  }).join('');
  const undo = app.ui.lastPlanEvent ? `<button class="chip-btn" data-act="undo" data-arg="${esc(app.ui.lastPlanEvent)}">${ICON.undo({ size: 14 })}Undo</button>` : '';
  return `<div class="banner" role="status">${msg ? `<p>${esc(msg)}</p>` : ''}${w}${undo ? `<div>${undo}</div>` : ''}</div>`;
}

export function tonightHtml(app) {
  const s = app.store.state, today = app.store.today;
  const hr = parseInt(app.store.clock, 10);
  const when = hr >= 15 ? 'tonight' : 'today';
  const d = s.plan[today];
  const m = modeOf(s, today);
  if (m !== 'cook') {
    return `<div class="card"><p class="card-t">${m === 'out' ? 'Eating out' : 'Not cooking'} ${when}</p><p class="muted">Food planned for ${when} has moved to your next cooking day.</p>
      <div class="btn-row wrap"><button class="btn btn-secondary sm" data-act="go" data-arg="plan">See the week</button>${app.ui.lastPlanEvent ? `<button class="btn btn-quiet sm" data-act="undo" data-arg="${esc(app.ui.lastPlanEvent)}">Undo</button>` : ''}</div></div>`;
  }
  const lots = (d?.lots || []).map((id) => s.lots.get(id)).filter(Boolean);
  return `<div class="card card-leaf"><p class="card-t">${lots.length ? `Planned for ${when}` : `Nothing planned for ${when}`}</p>
    ${lots.length ? `<div class="pills">${lots.map((l) => `<button class="pill-food" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { bag: l.bag, size: 22, lot: l })}${esc(foodName(l.food, 2, l))}</button>`).join('')}</div>` : ''}
    <div class="btn-row wrap"><button class="btn btn-primary sm" data-act="sheet" data-arg="planchg">Plans changed?</button><button class="btn btn-secondary sm" data-act="go" data-arg="plan">See the week</button></div></div>`;
}

export function needsLook(app) {
  const s = app.store.state, p = app.store.persona, today = app.store.today;
  const out = [];
  if (p.id === 'john' && p.receipt && !s.done.receipt) out.push({ ic: ICON.receipt({ size: 20 }), txt: `Receipt from ${fmtDay(p.receipt.when)}: ${p.receipt.lines.filter((l) => l.unsure || l.nonfood).length} lines to check`, act: 'review', arg: 'receipt', btn: 'Check' });
  if (s.links.email && p.email && !s.done.email) out.push({ ic: ICON.mail({ size: 20 }), txt: `AI found a receipt in your email: ${p.email.lines.length} lines to check`, act: 'review', arg: 'email', btn: 'Check' });
  for (const l of s.lots.values()) {
    if (l.date?.guess) out.push({ pic: pic(l.food, { size: 28, lot: l }), txt: `${foodName(l.food, 2, l)}: no pack date yet, so it's an estimate`, act: 'lot', arg: l.id, btn: 'Fix' });
  }
  const loose = [...s.lots.values()].filter((l) => l.date?.kind === 'est' && !l.date.guess && food(l.food).cat === 'produce' && placeOf(s, l.place)?.kind === 'cold' && daysBetween(l.addedOn, today) <= 3)
    .sort((a, b) => (urgency(a.date, today) ?? 99) - (urgency(b.date, today) ?? 99)).slice(0, 2);
  for (const l of loose) out.push({ pic: pic(l.food, { size: 28, lot: l }), txt: `${foodName(l.food, 2, l)} had no date on the pack, so the date is our guess`, act: 'lot', arg: l.id, btn: 'Check' });
  if (!out.length) return '<div class="card"><p class="muted">Nothing to check.</p></div>';
  return `<ul class="rows">${out.map((o) => `<li><button class="row" data-act="${o.act}" data-arg="${esc(o.arg)}">${o.pic || `<span class="row-ic">${o.ic}</span>`}<span class="r-main"><span>${esc(o.txt)}</span></span><span class="mini">${o.btn}</span></button></li>`).join('')}</ul>`;
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
