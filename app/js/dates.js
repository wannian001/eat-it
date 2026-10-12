// Dates are plain 'YYYY-MM-DD' strings in the user's local calendar; no time zones involved.
//
// Date kinds (VISUAL-SPEC §7, FSANZ):
//   use_by       safety date -> red solid tag, goes to "Eat first"
//   best_before  quality date -> amber outline tag, never "throw it out"
//   est          no date on the pack, the app guesses -> grey dashed tag with "~"
//   frozen       day it went into the freezer -> light blue tag, weeks in the freezer
//   none         dry food with no useful date ("Keeps for months")

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function utc(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function todayLocal(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function clockLocal(now = new Date()) {
  return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function addDays(day, n) {
  return new Date(utc(day) + n * 86400000).toISOString().slice(0, 10);
}

// Days from a to b (b - a).
export function daysBetween(a, b) {
  return Math.round((utc(b) - utc(a)) / 86400000);
}

const parts = (day) => {
  const d = new Date(utc(day));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), w: d.getUTCDay() };
};

export const weekday = (day) => WD[parts(day).w];
export const dayMonth = (day) => `${parts(day).d} ${MON[parts(day).m]}`;
export const fmtDay = (day) => `${weekday(day)} ${dayMonth(day)}`;
export const receiptDay = (day) => fmtDay(day).toUpperCase();
export const longDay = (day) => `${WD_LONG[parts(day).w]} ${parts(day).d} ${MON_LONG[parts(day).m]}`;
export const relDay = (day, today) => (day === today ? 'today' : day === addDays(today, 1) ? 'tomorrow' : fmtDay(day));

export function greeting(clock) {
  const h = parseInt(clock, 10);
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// "Sun" for the next two days, "17 Oct" within a month, then "Nov", then "Mar 2027".
function when(on, today) {
  const d = daysBetween(today, on);
  if (d === 0) return 'today';
  if (d === 1 || d === 2) return weekday(on);
  if (d > 0 && d <= 31) return dayMonth(on);
  const a = parts(on), t = parts(today);
  if (d < 0) return dayMonth(on);
  return a.y === t.y ? MON[a.m] : `${MON[a.m]} ${a.y}`;
}

function span(days) {
  if (days <= 0) return 'today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  const w = Math.round(days / 7);
  return w === 1 ? '1 week' : `${w} weeks`;
}

// Weeks (or days) a bag has been in the freezer.
export function frozenFor(on, today) {
  const days = Math.max(0, daysBetween(on, today));
  if (days < 7) return days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`;
  const w = Math.floor(days / 7);
  return w === 1 ? '1 week' : `${w} weeks`;
}

export function frozenWeeks(on, today) {
  return Math.floor(Math.max(0, daysBetween(on, today)) / 7);
}

// Tag for a date. ctx: 'tile' (default) | 'card' (Eat first) | 'receipt' | 'sheet'.
// Returns { text, kind } where kind picks the tag style.
export function dateTag(date, today, ctx = 'tile') {
  if (!date) return { text: '', kind: 'none' };
  if (date.kind === 'none') return { text: date.note || 'Keeps for months', kind: 'none' };
  const d = daysBetween(today, date.on);
  switch (date.kind) {
    case 'use_by':
      return d < 0 ? { text: 'Past use by', kind: 'use_by' } : { text: `Use by ${when(date.on, today)}`, kind: 'use_by' };
    case 'best_before':
      return d < 0 ? { text: 'Past best before', kind: 'best_before' } : { text: `Best before ${when(date.on, today)}`, kind: 'best_before' };
    case 'est': {
      let text = `~${span(d)}`;
      if ((ctx === 'card' || ctx === 'sheet') && d > 0) text += ' left';
      if (ctx === 'receipt') text += ' (our guess)';
      return { text, kind: 'est' };
    }
    case 'frozen': {
      const f = frozenFor(date.on, today);
      return { text: ctx === 'sheet' || ctx === 'card' ? (f === 'Today' ? 'Frozen today' : `Frozen ${f}`) : f, kind: 'frozen' };
    }
    default:
      return { text: '', kind: 'none' };
  }
}

// The last day it's good, for planning: a use by / best before day, or the end of an estimate.
export const lastGood = (date) => (date && date.on && date.kind !== 'frozen' ? date.on : null);

// How soon something should be eaten, in days. Best before is a quality date, so it ranks
// 1.5 days later than a use-by or an estimate on the same day. Frozen and dry food have no
// urgency here; the oldest frozen bag gets its own nudge instead.
export function urgency(date, today) {
  if (!date || date.kind === 'frozen' || date.kind === 'none' || !date.on) return null;
  const d = daysBetween(today, date.on);
  return date.kind === 'best_before' ? d + 1.5 : d;
}

const KIND_ORDER = { use_by: 0, est: 1, best_before: 2 };
export const kindOrder = (date) => KIND_ORDER[date?.kind] ?? 3;

// Small coloured dot on fridge tiles: red = use by within 2 days, amber = best before today or past.
export function dot(date, today) {
  if (!date || !date.on || date.kind === 'frozen') return null;
  const d = daysBetween(today, date.on);
  if (date.kind === 'use_by' && d <= 2) return 'red';
  if (date.kind === 'best_before' && d <= 0) return 'amber';
  return null;
}
