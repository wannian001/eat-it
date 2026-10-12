// Week calendar: seven day cards, like the owner's personal "week" page, each saying what to watch
// for in food that day — what to eat by, which freezer bag gets old, eating out — and, for days that
// have passed, what was actually eaten, used or bought (from the voice log and the food card).

import { foodName, shortName } from '../foods.js';
import { modeOf, nudge, bagNumber, frozenLots, placeOf } from '../state.js';
import { addDays, daysBetween, weekday, dayMonth, fmtDay, dateTag, lastGood, frozenWeeks } from '../dates.js';
import { ICON } from '../icons.js';
import { esc, pic, pageHead, secHead } from '../ui.js';
import { phoneTitle, dayLog, mealCheck } from './parts.js';

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
      freezer: past ? [] : freezer,
      thaw: isToday ? nudge(s, today) : null,
      ate: dayLog(s, d),
      added: hist.filter((h) => h.kind === 'put').reduce((a, h) => a + h.count, 0),
    };
  });
}

function dayCard(app, d) {
  const today = app.store.today;
  const s = app.store.state;
  const blocks = [];
  const item = (l) => { const t = dateTag(l.date, today); return `<li><button class="wk-food" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 26, lot: l })}<span class="wf-text"><b>${esc(foodName(l.food, 2, l))}</b><small class="d-${t.kind}">${esc(KIND_WORD[l.date.kind] || '')}</small></span></button></li>`; };
  if (d.overdue.length) blocks.push(`<div class="block warn"><span class="k">Check today</span><ul>${d.overdue.map(item).join('')}</ul></div>`);
  if (d.due.length) blocks.push(`<div class="block"><span class="k">Eat by</span><ul>${d.due.map(item).join('')}</ul></div>`);
  if (d.thaw) blocks.push(`<div class="block frost"><span class="k">Freezer</span><div class="wk-line">${pic(d.thaw.food, { bag: true, size: 26, lot: d.thaw })}<span class="wf-text"><b>${esc(shortName(d.thaw.food, d.thaw))}, bag ${bagNumber(s, d.thaw)}</b><small>${frozenWeeks(d.thaw.date.on, today)} weeks frozen</small></span></div><button class="chip-btn on" data-act="thaw" data-arg="${esc(d.thaw.id)}">Thaw tonight</button></div>`);
  else if (d.freezer.length) blocks.push(`<div class="block frost"><span class="k">Freezer</span><ul>${d.freezer.map((l) => `<li class="wk-line">${pic(l.food, { bag: true, size: 26, lot: l })}<span class="wf-text"><b>${esc(shortName(l.food, l))}, bag ${bagNumber(s, l)}</b><small>${daysBetween(l.date.on, d.date) / 7} weeks frozen</small></span></li>`).join('')}</ul></div>`);
  if (d.isToday) {
    blocks.push(`<div class="block"><span class="k">Meals today</span>${mealCheck(app, d.date)}</div>`);
  } else if (d.past) {
    blocks.push(`<div class="block"><span class="k">${d.out ? 'Used · ate out' : 'Used'}</span>${d.ate.length ? `<ul class="plain">${d.ate.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p class="muted">${d.out ? 'Nothing to log' : 'Nothing recorded'}</p>`}</div>`);
  }
  if (d.past || d.isToday) {
    if (d.added) blocks.push(`<div class="block"><span class="k">Added</span><p>${d.added} item${d.added > 1 ? 's' : ''}</p></div>`);
  }
  if (!d.past && !d.due.length && !d.freezer.length && !d.thaw && !d.overdue.length) blocks.splice(0, 0, '<div class="block"><span class="k">Eat by</span><p class="muted">Nothing due</p></div>');
  return `<article class="day${d.isToday ? ' today' : ''}${d.past ? ' past' : ''}" id="day-${d.date}">
    <h2>${esc(weekday(d.date))}${d.isToday ? ' · Today' : ''}</h2><div class="date">${esc(dayMonth(d.date))}</div>
    ${blocks.join('')}
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
    <div class="desk-only">${pageHead(off === 0 ? 'This week' : off === 1 ? 'Next week' : off === -1 ? 'Last week' : off > 0 ? `In ${off} weeks` : `${-off} weeks ago`, 'Week calendar', 'What to watch for in food each day: what to eat by, which freezer bag is getting old, nights out — and what you actually ate.')}</div>
    ${nav}
    <div class="days" tabindex="0" aria-label="Seven days">${days.map((d) => dayCard(app, d)).join('')}</div>
    ${later.length ? `<section>${secHead('Coming up')}<ul class="rows">${later.map((l) => { const t = dateTag(l.date, today); return `<li><button class="row" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 32, lot: l })}<span class="r-main"><b>${esc(foodName(l.food, 2, l))}</b><small>${esc(fmtDay(lastGood(l.date)))}</small></span><span class="tag tag-${t.kind}">${esc(`in ${daysBetween(today, lastGood(l.date))} days`)}</span></button></li>`; }).join('')}</ul></section>` : ''}
    <p class="small muted pad">Forgot to say what you ate? Open any food on Home and change how much is left.</p>
  </div>`;
}

