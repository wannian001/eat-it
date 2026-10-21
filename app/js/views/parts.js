// Pieces several pages share: the open fridge, food tiles, Eat first, Today, Room at home.
import { food, foodName, shortName, nameMatches } from '../foods.js';
import { eatFirst, oldestFrozen, units, nudge, hasFreezer, mealAnswer, mealSkipped } from '../state.js';
import { frozenWeeks, urgency, weekdayLong, weekday, addDays } from '../dates.js';
import { shelvesOf } from '../seed.js';
import { ICON, placeIcon, appIcon } from '../icons.js';
import { esc, pic, tag, dotHtml, label, langSwitch } from '../ui.js';
import { L, isZh, dz, amountWord } from '../i18n.js';


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
  const dim = (q && !nameMatches(t.food, t.lot, q)) || notOwn;
  return `<button class="tile${t.fresh && app.ui.flash ? ' fresh' : ''}${dim ? ' dim' : ''}" data-act="lot" data-arg="${esc(t.lot.id)}" aria-label="${esc(label(t.food, t.count, t.lot.date, today, 'tile', t.lot))}">
    ${pic(t.food, { bag: t.lot.bag, size, lot: t.lot })}
    ${wk >= 2 ? `<span class="wk">${L(`${wk} wk`, `${wk}周`)}</span>` : ''}
    ${dotHtml(t.lot.date, today)}
    ${t.count > 1 ? `<span class="count">${t.count}</span>` : ''}
    <span class="tile-name">${esc(shortName(t.food, t.lot))}</span>
  </button>`;
}

function fullness(n, capacity) {
  const filled = Math.min(capacity, n);
  const bars = Array.from({ length: capacity }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('');
  return filled / capacity >= 0.75 ? `<span class="nearly" aria-label="${L('Nearly full', '快满了')}"><span class="bars">${bars}</span>${L('Nearly full', '快满了')}</span>` : '';
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
    zones.push(`<div class="zone zone-freezer"><span class="zone-label">${ICON.snow({ size: 13, stroke: 2.2 })}${esc(dz(fz.name))}</span><div class="tiles">${ts.map((t) => tileHtml(app, t, { oldestId: oldest?.id })).join('') || `<span class="zone-empty">${L('Empty', '空的')}</span>`}</div></div>`);
  }
  for (const c of cold) {
    for (const sh of shelvesOf(c, p)) {
      if (sh.kind === 'locked') {
        if (!p.house.mates.length) continue;
        const os = othersIn(p, c.id);
        const n = os.reduce((a, o) => a + o.n, 0);
        const names = p.house.mates.map((m) => m.name).join(' & ');
        zones.push(`<div class="zone zone-locked${ownFilter(app) !== 'all' ? ' dim' : ''}" aria-label="${esc(L(`${names}: ${n} items, private`, `${names}：${n} 样，不公开`))}">${ICON.lock({ size: 18 })}<span class="avatars sm">${p.house.mates.map((m, i) => `<span class="avatar av-${i + 1}">${esc(m.initial)}</span>`).join('')}</span><span class="zl-name">${esc(names)}</span><span class="zl-n">${n}</span></div>`);
        continue;
      }
      const ts = shelfGroups(app, c, sh.spot);
      const head = sh.label
        ? `<div class="zone-head"><span class="pill">${sh.icon === 'people' ? ICON.people({ size: 14 }) : `<span class="avatar av-0 xs">${esc(p.initial)}</span>`}${esc(spotLabel(sh.label))}</span>${sh.capacity ? fullness(ts.length, sh.capacity) : ''}</div>`
        : '';
      zones.push(`<div class="zone zone-${sh.kind || 'shelf'}">${head}<div class="tiles">${ts.map((t) => tileHtml(app, t, { oldestId: oldest?.id })).join('')}</div></div>`);
    }
  }
  return zones.length ? `<section class="fridge" aria-label="${L('Fridge', '冰箱')}">${zones.join('')}</section>` : '';
}

// Cupboard, rice bin, balcony …: one panel each, same tiles.
export function shelfPanel(app, place) {
  const p = app.store.persona;
  const ts = shelfGroups(app, place);
  const os = othersIn(p, place.id);
  const locked = os.length ? `<div class="zone zone-locked sm${ownFilter(app) !== 'all' ? ' dim' : ''}">${ICON.lock({ size: 16 })}<span class="zl-name">${esc(os.map((o) => o.who).join(' & '))}</span><span class="zl-n">${os.reduce((a, o) => a + o.n, 0)}</span></div>` : '';
  return `<section class="cab" aria-label="${esc(dz(place.name))}">
    <div class="cab-h">${placeIcon(place, { size: 16 })}<b>${esc(dz(place.name))}</b></div>
    <div class="tiles">${ts.map((t) => tileHtml(app, t, { size: 46 })).join('') || `<span class="zone-empty">${L('Empty', '空的')}</span>`}</div>${locked}
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
    <h2 id="ef-h">${L('Eat first', '先吃这些')}</h2>
    <div class="ef-cards">${cards.map(({ food: f, lot }) => `
      <button class="ef-card" data-act="lot" data-arg="${esc(lot.id)}" aria-label="${esc(label(f, 1, lot.date, today, 'card', lot))}">
        ${pic(f, { size: 40, lot })}
        <span class="ef-name">${esc(foodName(f, 1, lot))}</span>
        ${tag(lot.date, today, 'card')}
      </button>`).join('')}
    </div>
  </section>`;
}

// "Eating out tomorrow to Mon" / "Eating out Sat": a run of days out (state.awayRuns).
// Chinese: "明天到周一在外面吃" / "周六在外面吃".
export function awayTitle(r, today) {
  const w = (d) => (d === addDays(today, 1) ? L('tomorrow', '明天') : weekday(d));
  if (isZh()) return r.from === r.to ? `${w(r.from)}在外面吃` : `${w(r.from)}到${weekday(r.to)}在外面吃`;
  return r.from === r.to ? `Eating out ${w(r.from)}` : `Eating out ${w(r.from)} to ${weekday(r.to)}`;
}
// "today" / "by Wed"; Chinese "今天" / "在周三前".
export const awayWhen = (r, today) => (r.prep === today ? L('today', '今天') : L(`by ${weekday(r.prep)}`, `在${weekday(r.prep)}前`));

// The shelf names drawn on the open fridge.
const SHELF_LABEL = { Shared: '公共', Mine: '我的' };
const spotLabel = (t) => (isZh() && SHELF_LABEL[t]) || t;

// Today on Home: just "Ate at home today?" (and the freezer nudge when a bag is old enough).
export function todayHtml(app) {
  const s = app.store.state, today = app.store.today;
  const thaw = nudge(s, today);
  return `<div class="card today-card">
    ${thaw ? `<p class="thaw-line">${ICON.snow({ size: 15 })}${esc(L(`${shortName(thaw.food, thaw)}, bag 1 · ${frozenWeeks(thaw.date.on, today)} weeks`, `${shortName(thaw.food, thaw)}第 1 袋 · 冻了 ${frozenWeeks(thaw.date.on, today)} 周`))}<button class="link" data-act="thaw" data-arg="${esc(thaw.id)}">${L('Thaw tonight', '今晚解冻')}</button></p>` : ''}
    ${mealCheck(app, today)}
  </div>`;
}


export function roomBars(app) {
  const s = app.store.state;
  const rows = s.places.map((pl) => {
    const v = pl.full ?? 0;
    const txt = fullText(pl);
    return `<li><span class="rb-name">${placeIcon(pl, { size: 18 })}<b>${esc(dz(pl.name))}</b></span><em>${esc(txt)}</em><div class="bar${v >= 80 ? ' hi' : ''}${pl.src === 'photo' ? ' est' : ''}"><i style="width:${v}%"></i></div></li>`;
  }).join('');
  const noFz = hasFreezer(s) ? '' : `<li class="muted-row"><span class="rb-name">${ICON.snow({ size: 18 })}<b>${L('Freezer', '冷冻室')}</b></span><em>${L('none at home', '家里没有')}</em></li>`;
  return `<ul class="room">${rows || `<li class="muted-row">${L('No storage places yet.', '还没有存放的地方。')}</li>`}${noFz}</ul>`;
}

// "about 35% full" / "≈ 60% full" (from a photo) / "not measured yet".
export function fullText(pl) {
  if (pl.full == null) return L('not measured yet', '还没量过');
  return isZh() ? `${pl.src === 'photo' ? '约' : '大约'} ${pl.full}% 满` : `${pl.src === 'photo' ? '≈' : 'about'} ${pl.full}% full`;
}


// Phone header for the other tabs: app icon + page title (board 01 style), optional action.
export function phoneTitle(app, title, right = '') {
  return `<header class="top phone-only"><span class="app-icon">${appIcon({ size: 34, badge: false })}</span><h1>${esc(title)}</h1>${langSwitch({ compact: true })}${right}</header>`;
}

// ---------- what happened on a day (week calendar, Home) ----------

function historyLine(h) {
  const n = foodName(h.food, 2, h);
  const c = L(': ', '：');
  switch (h.kind) {
    case 'ate':
      if (h.left) return `${n}${c}${h.left === 'none' ? L('all gone', '吃完了') : h.left === 'little' ? L('a little left', '剩一点') : L('plenty left', '还剩不少')}`;
      if (h.part) return `${n}${c}${L('some', '用了一些')}`;
      { const t = +(h.taken ?? h.qty).toFixed(2);
        return t > 0 ? `${n} −${t}${h.unit === 'bag' ? L(t === 1 ? ' bag' : ' bags', ' 袋') : ''}` : ''; }
    case 'use': return `${n}${c}${h.how === 'some' ? L('used some', '用了一些') : L('used one', '用了一个')}`;
    case 'qty': return h.to <= 0 ? `${n}${c}${L('all gone', '没有了')}` : `${n}${c}${h.from} → ${h.to}`;
    case 'amount': return `${n}${c}${L(`${h.value.toLowerCase()} left`, h.value === 'Low' ? '快没了' : `还剩${amountWord(h.value)}`)}`;
    case 'toss': return `${n}${c}${L('thrown out', '扔掉了')}`;
    case 'thaw': return `${n}${c}${L('thawed', '解冻了')}`;
    case 'freeze': return `${n}${c}${L('frozen', '冻起来了')}`;
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
  // − then + on the same food is no change at all.
  return out.filter((h) => !(h.kind === 'qty' && h.from === h.to));
}

// Lines like "Tomatoes −2", "Curry: all gone", "Eggs: 6 → 4" for one day.
export function dayLog(s, day) {
  return mergeFixes((s.history[day] || []).filter((h) => h.kind !== 'put')).map(historyLine).filter(Boolean);
}

// Only what was used that day (voice, Used it, changed stock), not freezing, thawing or throwing out.
const USED = new Set(['ate', 'use', 'qty', 'amount']);
export function mealLog(s, day) {
  return mergeFixes((s.history[day] || []).filter((h) => USED.has(h.kind))).map(historyLine).filter(Boolean);
}

// "Ate at home today?" — the check that leads to logging what was used (stock out), for today or
// any earlier day in the calendar. Yes asks whether to record it now (by voice); No marks the day as
// eaten out (nothing to record). Once something is recorded it lists what was used, with a way to add more.
// A day still to come can be planned ahead: "Eating at home on Thursday?" — No marks it as a day out.
export function mealCheck(app, day) {
  const s = app.store.state;
  const isToday = day === app.store.today;
  const name = weekdayLong(day);
  const when = isToday ? L('today', '今天') : L(`on ${name}`, name);
  const lines = mealLog(s, day);
  const ans = mealAnswer(s, day);
  const change = `<button class="link" data-act="meal" data-arg="${day}|none">${L('Change', '改一下')}</button>`;
  if (day > app.store.today) {
    if (ans === 'out') return `<div class="meal"><p>${ICON.fork({ size: 15 })}${esc(L(`Eating out on ${name}`, `${name}在外面吃`))}</p>${change}</div>`;
    if (ans === 'home') return `<div class="meal"><p>${ICON.home({ size: 15 })}${esc(L(`Eating at home on ${name}`, `${name}在家吃`))}</p>${change}</div>`;
    return `<div class="meal ask"><p class="meal-q">${esc(L(`Eating at home on ${name}?`, `${name}在家吃吗？`))}</p><div class="btn-row wrap"><button class="btn btn-primary sm" data-act="meal" data-arg="${day}|home">${L('Yes', '在家吃')}</button><button class="btn btn-secondary sm" data-act="meal" data-arg="${day}|out">${L('No, eating out', '不，在外面吃')}</button></div></div>`;
  }
  const record = (label, cls) => `<button class="btn ${cls} sm" data-act="ate-for" data-arg="${day}">${ICON.mic({ size: 16 })}${label}</button>`;
  if (ans === 'out') return `<div class="meal"><p>${ICON.fork({ size: 15 })}${isToday ? L('Eating out today, nothing to record', '今天在外面吃，不用记') : L('Ate out, nothing to record', '在外面吃的，不用记')}</p>${change}</div>`;
  if (lines.length) return `<div class="meal"><p class="meal-q">${isToday ? L('Used today', '今天用掉的') : L('Used', '用掉的')}</p><ul class="plain">${lines.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><button class="chip-btn" data-act="ate-for" data-arg="${day}">${ICON.mic({ size: 14 })}${L('Add more', '再记一些')}</button></div>`;
  if (ans === 'home' && mealSkipped(s, day)) return `<div class="meal"><p>${ICON.home({ size: 15 })}${L('At home · not recorded', '在家吃 · 没记')}</p><div class="btn-row wrap">${record(L('Record now', '现在记'), 'btn-secondary')}${change}</div></div>`;
  if (ans === 'home') {
    return `<div class="meal ask"><p class="meal-q">${L('Record what you used?', '记一下用了什么？')}</p>
      <div class="btn-row wrap">${record(L('Record by voice', '用语音记'), 'btn-primary')}<button class="btn btn-quiet sm" data-act="meal" data-arg="${day}|skip">${L('Not now', '先不记')}</button></div></div>`;
  }
  return `<div class="meal ask"><p class="meal-q">${esc(L(`Ate at home ${when}?`, `${when}在家吃的吗？`))}</p><div class="btn-row wrap"><button class="btn btn-primary sm" data-act="meal" data-arg="${day}|home">${L('Yes', '是')}</button><button class="btn btn-secondary sm" data-act="meal" data-arg="${day}|out">${L('No, ate out', '不，在外面吃的')}</button></div></div>`;
}
