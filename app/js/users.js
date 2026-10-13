// Users on this device: John and May come with the app, anyone else is added here. There are no
// passwords (prototype); picking a user signs in as them, and each user's data is kept separately.

import { BUILTIN, SEED_DAY, blankUser } from './seed.js?v=1d4b465';
import { prefs } from './store.js?v=1d4b465';
import { todayLocal, addDays, daysBetween } from './dates.js?v=1d4b465';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Move every date in the starting data by n days, so John's and May's fridges start "today".
export function shiftDates(x, n) {
  if (!n) return x;
  if (typeof x === 'string') return ISO.test(x) ? addDays(x, n) : x;
  if (Array.isArray(x)) return x.map((v) => shiftDates(v, n));
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, shiftDates(v, n)]));
  return x;
}

const added = () => prefs.get('users', []);

export function listUsers() {
  return [
    ...Object.values(BUILTIN).map((u) => ({ id: u.id, name: u.name, initial: u.initial, builtin: true })),
    ...added(),
  ];
}

export const userExists = (id) => listUsers().some((u) => u.id === id);

// The day a built-in user was first opened on this device; their starting data is moved to it.
function startDay(id, now) {
  let d = prefs.get(`start:${id}`, null);
  if (!d) { d = todayLocal(now); prefs.set(`start:${id}`, d); }
  return d;
}

export function restartUser(id, now = new Date()) {
  prefs.set(`start:${id}`, todayLocal(now));
}

export function userProfile(id, now = new Date()) {
  const base = BUILTIN[id];
  if (base) {
    const { seed, photo, receipt, email, barcode } = shiftDates({ seed: base.seed, photo: base.photo, receipt: base.receipt, email: base.email, barcode: base.barcode }, daysBetween(SEED_DAY, startDay(id, now)));
    return { ...base, seed, photo, receipt, email, barcode, today: null, clock: null };
  }
  const u = added().find((x) => x.id === id);
  return u ? { ...blankUser(u.id, u.name), today: null, clock: null } : null;
}

export function addUser(name) {
  const id = `u-${Date.now().toString(36)}`;
  const n = (name || '').trim() || 'New user';
  prefs.set('users', [...added(), { id, name: n, initial: n.charAt(0).toUpperCase() }]);
  return id;
}

export function renameUser(id, name) {
  prefs.set('users', added().map((u) => (u.id === id ? { ...u, name, initial: name.charAt(0).toUpperCase() } : u)));
}

export function removeUser(id) {
  prefs.set('users', added().filter((u) => u.id !== id));
}

export const currentUser = () => {
  const id = prefs.get('user', 'may');
  return id && userExists(id) ? id : null;
};
export const signIn = (id) => prefs.set('user', id);
export const signOut = () => prefs.set('user', null);
