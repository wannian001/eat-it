// Week plan (v0.2), optional (Brief O1): mark the days you won't cook; food planned for those days
// moves to the next day you will. "Out tonight" on the widget is the same switch for today.
import { foodName } from '../foods.js';
import { modeOf, plannedDay } from '../state.js';
import { addDays, weekday, dayMonth, fmtDay, dateTag, urgency } from '../dates.js';
import { ICON } from '../icons.js';
import { esc, pic, pageHead, secHead } from '../ui.js';
import { moveBanner, phoneTitle } from './parts.js';

const MODES = { cook: 'Cooking', out: 'Eating out', busy: 'Too busy' };
const MODE_ICON = { cook: 'pan', out: 'fork', busy: 'clock' };

export function planPage(app) {
  const s = app.store.state, today = app.store.today;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const cols = days.map((d) => {
    const m = modeOf(s, d);
    const lots = (s.plan[d]?.lots || []).map((id) => s.lots.get(id)).filter(Boolean)
      .sort((a, b) => (urgency(a.date, today) ?? 99) - (urgency(b.date, today) ?? 99));
    return `<div class="dcol${d === today ? ' today' : ''}${m !== 'cook' ? ' off' : ''}">
      <div class="dhead"><span><small>${weekday(d)}</small> <b>${esc(dayMonth(d))}</b></span>${d === today ? '<span class="tag tag-today">Today</span>' : ''}<span class="dmode m-${m}">${ICON[MODE_ICON[m]]({ size: 16 })}</span></div>
      <select class="dsel m-${m}" data-change="plan-mode" data-arg="${d}" aria-label="${esc(fmtDay(d))}">${Object.entries(MODES).map(([k, t]) => `<option value="${k}"${m === k ? ' selected' : ''}>${t}</option>`).join('')}</select>
      ${lots.length ? lots.map((l) => { const t = dateTag(l.date, today); return `<button class="fpill" data-act="lot" data-arg="${esc(l.id)}">${pic(l.food, { bag: l.bag, size: 24, lot: l })}<span><b>${esc(foodName(l.food, 2, l))}</b><small class="d-${t.kind}">${esc(t.text)}</small></span></button>`; }).join('') : `<p class="dempty">${m === 'cook' ? 'Nothing planned' : 'No cooking'}</p>`}
    </div>`;
  }).join('');
  const cookDays = days.filter((d) => modeOf(s, d) === 'cook');
  const loose = [...s.lots.values()].filter((l) => l.date?.kind !== 'frozen' && l.date?.kind !== 'none' && (urgency(l.date, today) ?? 99) <= 3 && !plannedDay(s, l.id, today))
    .sort((a, b) => (urgency(a.date, today) ?? 99) - (urgency(b.date, today) ?? 99));
  return `<div class="page plan">
    ${phoneTitle(app, 'Week plan')}
    <div class="desk-only">${pageHead(`Week of ${esc(fmtDay(today))}`, 'Week plan', "Mark the days you won't cook. Food planned for those days moves to the next day you will, soonest first.")}</div>
    <p class="phone-only psub pad">Mark the days you won't cook. Planned food moves to the next day you will.</p>
    ${moveBanner(app)}
    <div class="weekwrap"><div class="weekgrid">${cols}</div></div>
    ${loose.length ? `<section>${secHead('Use soon, not planned yet')}<ul class="rows">${loose.map((l) => { const t = dateTag(l.date, today); return `<li class="loose">${pic(l.food, { size: 32, lot: l })}<span class="r-main"><b>${esc(foodName(l.food, 2, l))}</b><small class="d-${t.kind}">${esc(t.text)}</small></span>${cookDays.length ? `<select data-change="plan-loose" data-arg="${esc(l.id)}" aria-label="Add ${esc(foodName(l.food, 2, l))} to a day"><option value="">Add to a day…</option>${cookDays.map((d) => `<option value="${d}">${esc(fmtDay(d))}</option>`).join('')}</select>` : ''}</li>`; }).join('')}</ul></section>` : ''}
    <p class="small muted pad">Planning is optional. Leave it, and Eat It! still shows what to eat first.</p>
  </div>`;
}
