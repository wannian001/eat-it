// Week calendar: seven day cards, like the owner's personal "week" page, each saying what to watch
// for in food that day — what to eat by, which freezer bag gets old — plus a one-line meal status.
// Tapping a day opens its card in place: for today or an earlier day, "Ate at home that day?" and, if
// yes, record what was used by voice (earlier days can be filled in later); for a day still to come,
// "Eating at home?", so a day out can be planned ahead.

import { foodName, shortName } from '../foods.js';
import { modeOf, nudge, bagNumber, frozenLots, placeOf, mealAnswer, mealSkipped } from '../state.js';
import { addDays, daysBetween, weekday, dayMonth, fmtDay, longDay, dateTag, lastGood, frozenWeeks } from '../dates.js';
import { ICON } from '../icons.js';
import { esc, pic, pageHead, secHead } from '../ui.js';
import { phoneTitle, mealLog, mealCheck } from './parts.js';

const monday = (day) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));

const KIND_WORD = { use_by: 'use by', best_before: 'best before', est: 'our guess' };

// Food in stock whose date falls on a day (not in the freezer, not a housemate's).
function dueOn(s, day) {
  return [...s.lots.values()].filter((l) => l.owner !== 'housemate' && placeOf(s, l.place)?.kind !== 'frozen' && lastGood(l.date) === day);
}

export function weekDays(app, offset = 0) {
  const s = app.store.state, today = app.store.today;
  const start = addDays(monday(today), offset * 7);
  const oldest = frozenLots(s);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    const past = d < today, isToday = d === today;
    const hist = s.history[d] || [];
    // A frozen bag reaching 4, 5, 6 … weeks that day (only the oldest bag of each food).
    const seen = new Set();
    const freezer = oldest.filter((l) => { if (seen.has(l.food)) return false; seen.add(l.food); return true; })
      .filter((l) => { const n = daysBetween(l.date.on, d); return n >= 28 && n % 7 === 0; });
    return {
      date: d, past, isToday,
      out: modeOf(s, d) === 'out',
      due: past ? [] : dueOn(s, d),
      overdue: isToday ? [...s.lots.values()].filter((l) => l.owner !== 'housemate' && lastGood(l.date) && lastGood(l.date) < today) : [],
      // Once a bag was taken out today, today's card doesn't nag about the freezer again.
      freezer: past || (isToday && s.thawedOn === today) ? [] : freezer,
      thaw: isToday ? nudge(s, today) : null,
      ate: mealLog(s, d),
      added: hist.filter((h) => h.kind === 'put').reduce((a, h) => a + h.count, 0),
    };
  });
}

// What to watch for that day: overdue food (today), what to eat by, the freezer.
function foodBlocks(app, d) {
  const today = app.store.today;
  const s = app.store.state;
  const blocks = [];
  const item = (l) => { const t = dateTag(l.date, today); return `<li><button class="wk-food" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 26, lot: l })}<span class="wf-text"><b>${esc(foodName(l.food, 2, l))}</b><small class="d-${t.kind}">${esc(KIND_WORD[l.date.kind] || '')}</small></span></button></li>`; };
  if (d.overdue.length) blocks.push(`<div class="block warn"><span class="k">Past the date</span><ul>${d.overdue.map(item).join('')}</ul></div>`);
  if (d.due.length) blocks.push(`<div class="block"><span class="k">Dates this day</span><ul>${d.due.map(item).join('')}</ul></div>`);
  if (d.thaw) blocks.push(`<div class="block frost"><span class="k">Freezer</span><div class="wk-line">${pic(d.thaw.food, { bag: true, size: 26, lot: d.thaw })}<span class="wf-text"><b>${esc(shortName(d.thaw.food, d.thaw))}, bag ${bagNumber(s, d.thaw)}</b><small>Frozen ${frozenWeeks(d.thaw.date.on, today)} weeks</small></span></div><button class="chip-btn on" data-act="thaw" data-arg="${esc(d.thaw.id)}">Thaw tonight</button></div>`);
  else if (d.freezer.length) blocks.push(`<div class="block frost"><span class="k">Freezer</span><ul>${d.freezer.map((l) => `<li class="wk-line">${pic(l.food, { bag: true, size: 26, lot: l })}<span class="wf-text"><b>${esc(shortName(l.food, l))}, bag ${bagNumber(s, l)}</b><small>Frozen ${daysBetween(l.date.on, d.date) / 7} weeks</small></span></li>`).join('')}</ul></div>`);
  if (!d.past && !blocks.length) blocks.push('<div class="block"><span class="k">Dates this day</span><p class="muted">Nothing due</p></div>');
  return blocks;
}

// One line on the card once the day has an answer; nothing while it hasn't.
function mealStatus(s, d) {
  const ans = mealAnswer(s, d.date);
  if (!d.past && !d.isToday) {
    if (ans === 'out') return `<p class="wk-meal out">${ICON.fork({ size: 14 })}Eating out</p>`;
    if (ans === 'home') return `<p class="wk-meal">${ICON.home({ size: 14 })}Eating at home</p>`;
    return '';
  }
  if (ans === 'out') return `<p class="wk-meal">${ICON.fork({ size: 14 })}Ate out</p>`;
  if (d.ate.length) return `<p class="wk-meal done">${ICON.check({ size: 14, stroke: 2.6 })}Recorded · ${d.ate.length}</p>`;
  if (ans === 'home') return `<p class="wk-meal">${ICON.home({ size: 14 })}${mealSkipped(s, d.date) ? 'At home · not recorded' : 'At home'}</p>`;
  return '';
}

function dayCard(app, d) {
  const s = app.store.state;
  const blocks = foodBlocks(app, d);
  const open = app.ui.weekOpen === d.date;
  const future = !d.past && !d.isToday;
  // Opened in place: the meal check ("Ate at home?" → record by voice) shows inside the card.
  if (open) {
    const early = future && d.out && d.due.length ? '<p class="meal-note">Food due that day: have it the day before.</p>' : '';
    blocks.push(`<div class="block day-more"><span class="k">Meals</span>${mealCheck(app, d.date)}${early}</div>`);
    if (d.added) blocks.push(`<div class="block"><span class="k">Added</span><p>${d.added} item${d.added > 1 ? 's' : ''}</p></div>`);
  }
  const added = !future && d.added ? `<p class="wk-meal">${ICON.plus({ size: 14, stroke: 2.4 })}${d.added} added</p>` : '';
  const foot = open ? '' : mealStatus(s, d) + added;
  const title = `<h2>${esc(weekday(d.date))}${d.isToday ? ' · Today' : ''}</h2><span class="date">${esc(dayMonth(d.date))}</span>`;
  const head = `<button class="day-head" data-act="day" data-arg="${d.date}" aria-expanded="${open}"><span>${title}</span><span class="chev" aria-hidden="true">${ICON.next({ size: 16 })}</span></button>`;
  // A closed card opens from anywhere on it; an open one only closes from its head.
  return `<article class="day${d.isToday ? ' today' : ''}${d.past ? ' past' : ''}${open ? ' open' : ' can-open'}" id="day-${d.date}"${!open ? ` data-act="day" data-arg="${d.date}"` : ''}>
    ${head}
    ${blocks.join('')}
    ${foot ? `<div class="wk-foot">${foot}</div>` : ''}
  </article>`;
}

export function weekPage(app) {
  const s = app.store.state, today = app.store.today;
  const off = app.ui.weekOffset || 0;
  const days = weekDays(app, off);
  const end = addDays(days[0].date, 6);
  // Further ahead: everything that falls due in the next three weeks after this week.
  const later = [...s.lots.values()].filter((l) => l.owner !== 'housemate' && placeOf(s, l.place)?.kind !== 'frozen' && lastGood(l.date) && lastGood(l.date) > end && daysBetween(today, lastGood(l.date)) <= 28)
    .sort((a, b) => lastGood(a.date).localeCompare(lastGood(b.date)));
  const nav = `<div class="wk-nav"><button class="round" data-act="week-move" data-arg="-1" aria-label="Previous week">${ICON.back({ size: 16 })}</button><span>${esc(fmtDay(days[0].date))} – ${esc(fmtDay(end))}</span><button class="round" data-act="week-move" data-arg="1" aria-label="Next week">${ICON.next({ size: 16 })}</button>${off ? '<button class="link" data-act="week-move" data-arg="0">This week</button>' : ''}</div>`;
  return `<div class="page week">
    ${phoneTitle(app, 'Week calendar')}
    <div class="desk-only">${pageHead(off === 0 ? 'This week' : off === 1 ? 'Next week' : off === -1 ? 'Last week' : off > 0 ? `In ${off} weeks` : `${-off} weeks ago`, 'Week calendar', 'The dates on your food, day by day, and which freezer bag is getting old.')}</div>
    ${nav}
    <p class="wk-hint">Tap a day to record what you used, or to mark a day you'll eat out.</p>
    <div class="days" tabindex="0" aria-label="Seven days">${days.map((d) => dayCard(app, d)).join('')}</div>
    ${later.length && off >= 0 ? `<section>${secHead('Coming up')}<ul class="rows">${later.map((l) => { const t = dateTag(l.date, today); const n = daysBetween(today, lastGood(l.date)); return `<li><button class="row" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 32, lot: l })}<span class="r-main"><b>${esc(foodName(l.food, 2, l))}</b><small>${esc(n === 1 ? 'tomorrow' : `in ${n} days`)} · ${esc(fmtDay(lastGood(l.date)))}</small></span><span class="tag tag-${t.kind}">${esc(t.text)}</span></button></li>`; }).join('')}</ul></section>` : ''}
    <p class="small muted pad">Forgot to say what you ate? Open any food on Home and change how much is left.</p>
  </div>`;
}

