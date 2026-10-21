// Week calendar: a strip of seven small days (what's dated, eating out, recorded), and the chosen day
// opened below it: the meal check (today / earlier: "Ate at home?" → record by voice; ahead: "Eating
// at home?", so days out can be planned), the food dated that day, the freezer, and before days out
// what to use or freeze. Coming up sits beside it on a computer.

import { foodName, shortName, canFreeze } from '../foods.js';
import { modeOf, nudge, bagNumber, frozenLots, placeOf, mealAnswer, awayRuns, hasFreezer } from '../state.js';
import { addDays, daysBetween, weekday, fmtDay, longDay, dateTag, lastGood, frozenWeeks } from '../dates.js';
import { ICON } from '../icons.js';
import { esc, pic, pageHead, secHead } from '../ui.js';
import { L, plural } from '../i18n.js';
import { phoneTitle, mealLog, mealCheck, awayTitle } from './parts.js';

const monday = (day) => addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));


// Food in stock whose date falls on a day (not in the freezer, not a housemate's).
function dueOn(s, day) {
  return [...s.lots.values()].filter((l) => l.owner !== 'housemate' && placeOf(s, l.place)?.kind !== 'frozen' && lastGood(l.date) === day);
}

export function weekDays(app, offset = 0) {
  const s = app.store.state, today = app.store.today;
  const start = addDays(monday(today), offset * 7);
  const oldest = frozenLots(s);
  const runs = awayRuns(s, today, 28);
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
      away: d >= today ? runs.find((r) => r.prep === d) || null : null,
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

// ---------- the strip: seven small days ----------

// A day as a small chip: weekday, date, and marks for what's on (food dated that day, eating out,
// recorded). An amber corner = the last day at home before days out.
function dayChip(app, d, sel) {
  const s = app.store.state;
  const dots = [...d.overdue, ...d.due].slice(0, 3).map((l) => `<i class="c-dot ${l.date.kind}"></i>`).join('');
  const out = mealAnswer(s, d.date) === 'out';
  const marks = `${dots}${out ? ICON.fork({ size: 12 }) : ''}${!out && d.ate.length ? ICON.check({ size: 12, stroke: 2.8 }) : ''}`;
  const nDated = d.due.length + d.overdue.length;
  const says = [nDated ? L(`${nDated} dated`, `${nDated} 样到期`) : '', out ? L('eating out', '在外面吃') : '', d.ate.length ? L('recorded', '已记录') : '', d.away ? L('use or freeze before days out', '出门前要吃掉或冻起来') : ''].filter(Boolean).join(L(', ', '，'));
  return `<button class="wk-chip${d.isToday ? ' today' : ''}${d.past ? ' past' : ''}${sel ? ' sel' : ''}${d.away ? ' prep' : ''}" data-act="day" data-arg="${d.date}" aria-pressed="${sel}" aria-label="${esc(longDay(d.date))}${says ? `${L(': ', '：')}${esc(says)}` : ''}">
    <span class="c-wd">${esc(weekday(d.date))}</span><span class="c-d">${esc(d.date.slice(8).replace(/^0/, ''))}</span><span class="c-marks">${marks}</span>
  </button>`;
}

// ---------- the chosen day ----------

function dayDetail(app, d) {
  const s = app.store.state, today = app.store.today;
  const future = !d.past && !d.isToday;
  const food = (l, right = '') => { const t = dateTag(l.date, today); return `<li><button class="wd-food" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 30, lot: l })}<b>${esc(foodName(l.food, 2, l))}</b><span class="tag tag-${t.kind}">${esc(t.text)}</span></button>${right}</li>`; };
  const freeze = (l) => (hasFreezer(s) && canFreeze(l.food) ? `<button class="chip-btn" data-act="freeze" data-arg="${esc(l.id)}">${ICON.snow({ size: 14 })}${L('Freeze', '冻起来')}</button>` : '');
  const bag = (l) => L(`${shortName(l.food, l)}, bag ${bagNumber(s, l)}`, `${shortName(l.food, l)}第 ${bagNumber(s, l)} 袋`);
  const cards = [];
  if (d.away) cards.push(`<section class="wd-card away wide"><h3>${esc(awayTitle(d.away, today))}</h3><p class="wd-sub">${d.isToday ? L('Use or freeze these today.', '这些今天要吃掉或冻起来。') : L('Use or freeze these this day.', '这些要在这天吃掉或冻起来。')}</p><ul class="wd-list">${d.away.lots.map((l) => food(l, freeze(l))).join('')}</ul></section>`);
  const note = future && d.out && d.due.length ? `<p class="meal-note">${L('Food due this day: have it the day before.', '这天有食物到期，前一天吃掉。')}</p>` : '';
  cards.push(`<section class="wd-card"><h3>${L('Meals', '吃饭')}</h3>${mealCheck(app, d.date)}${note}</section>`);
  if (d.overdue.length) cards.push(`<section class="wd-card warn"><h3>${L('Past the date', '已经过期')}</h3><ul class="wd-list">${d.overdue.map((l) => food(l)).join('')}</ul></section>`);
  if (d.due.length) cards.push(`<section class="wd-card"><h3>${L('Dates this day', '这天到期')}</h3><ul class="wd-list">${d.due.map((l) => food(l)).join('')}</ul></section>`);
  else if (!d.past && !d.overdue.length) cards.push(`<section class="wd-card"><h3>${L('Dates this day', '这天到期')}</h3><p class="wd-sub">${L('Nothing due.', '没有到期的。')}</p></section>`);
  if (d.thaw) cards.push(`<section class="wd-card frost"><h3>${L('Freezer', '冷冻室')}</h3><div class="wd-food static">${pic(d.thaw.food, { bag: true, size: 30, lot: d.thaw })}<b>${esc(bag(d.thaw))}</b><span class="wd-sub">${L(`Frozen ${frozenWeeks(d.thaw.date.on, today)} weeks`, `冻了 ${frozenWeeks(d.thaw.date.on, today)} 周`)}</span></div><button class="btn btn-primary sm" data-act="thaw" data-arg="${esc(d.thaw.id)}">${ICON.snow({ size: 16 })}${L('Thaw tonight', '今晚解冻')}</button></section>`);
  else if (d.freezer.length) cards.push(`<section class="wd-card frost"><h3>${L('Freezer', '冷冻室')}</h3><ul class="wd-list">${d.freezer.map((l) => `<li><div class="wd-food static">${pic(l.food, { bag: true, size: 30, lot: l })}<b>${esc(bag(l))}</b><span class="wd-sub">${L(`Frozen ${daysBetween(l.date.on, d.date) / 7} weeks`, `冻满 ${daysBetween(l.date.on, d.date) / 7} 周`)}</span></div></li>`).join('')}</ul></section>`);
  if ((d.past || d.isToday) && d.added) cards.push(`<section class="wd-card"><h3>${L('Added', '新加的')}</h3><p class="wd-sub">${L(`${d.added} ${plural(d.added, 'item')} went in.`, `放进去 ${d.added} 样。`)}</p></section>`);
  return `<section class="wk-detail" aria-label="${esc(longDay(d.date))}">
    <header class="wd-head"><h2>${esc(longDay(d.date))}</h2>${d.isToday ? `<span class="wd-pill">${L('Today', '今天')}</span>` : ''}${d.out ? `<span class="wd-pill out">${ICON.fork({ size: 13 })}${L('Eating out', '在外面吃')}</span>` : ''}</header>
    <div class="wd-grid">${cards.join('')}</div>
  </section>`;
}

export function weekPage(app) {
  const s = app.store.state, today = app.store.today;
  const off = app.ui.weekOffset || 0;
  const days = weekDays(app, off);
  // The chosen day: the one tapped, else today, else the first day of the week shown.
  const sel = days.find((d) => d.date === app.ui.weekOpen) || days.find((d) => d.isToday) || days[0];
  const end = addDays(days[0].date, 6);
  // Further ahead: everything that falls due in the next three weeks after this week.
  const later = [...s.lots.values()].filter((l) => l.owner !== 'housemate' && placeOf(s, l.place)?.kind !== 'frozen' && lastGood(l.date) && lastGood(l.date) > end && daysBetween(today, lastGood(l.date)) <= 28)
    .sort((a, b) => lastGood(a.date).localeCompare(lastGood(b.date)));
  const nav = `<div class="wk-nav"><button class="round" data-act="week-move" data-arg="-1" aria-label="${L('Previous week', '上一周')}">${ICON.back({ size: 16 })}</button><span>${esc(fmtDay(days[0].date))} – ${esc(fmtDay(end))}</span><button class="round" data-act="week-move" data-arg="1" aria-label="${L('Next week', '下一周')}">${ICON.next({ size: 16 })}</button>${off ? `<button class="link" data-act="week-move" data-arg="0">${L('This week', '回到本周')}</button>` : ''}</div>`;
  const which = off === 0 ? L('This week', '本周') : off === 1 ? L('Next week', '下周') : off === -1 ? L('Last week', '上周') : off > 0 ? L(`In ${off} weeks`, `${off} 周后`) : L(`${-off} weeks ago`, `${-off} 周前`);
  return `<div class="page week">
    ${phoneTitle(app, L('Week calendar', '周历'))}
    <div class="desk-only">${pageHead(which, L('Week calendar', '周历'))}</div>
    ${nav}
    <div class="wk-strip" role="group" aria-label="${L('Seven days', '七天')}">${days.map((d) => dayChip(app, d, d === sel)).join('')}</div>
    <div class="wk-body">
    ${dayDetail(app, sel)}
    ${later.length && off >= 0 ? `<section class="wk-later">${secHead(L('Coming up', '接下来'))}<ul class="rows">${later.map((l) => { const t = dateTag(l.date, today); const n = daysBetween(today, lastGood(l.date)); return `<li><button class="row" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { size: 32, lot: l })}<span class="r-main"><b>${esc(foodName(l.food, 2, l))}</b><small>${esc(n === 1 ? L('tomorrow', '明天') : L(`in ${n} days`, `${n} 天后`))} · ${esc(fmtDay(lastGood(l.date)))}</small></span><span class="tag tag-${t.kind}">${esc(t.text)}</span></button></li>`; }).join('')}</ul></section>` : ''}
    </div>
  </div>`;
}

