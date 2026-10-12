// Where events live. The app only talks to an adapter with three calls, so the same screens can
// run on this device's localStorage (default) or on the owner's own server later:
//
//   load(person)          -> Promise<Event[]>   events after the seed, oldest first
//   append(person, event) -> Promise<void>
//   clear(person)         -> Promise<void>
//
// httpAdapter is that contract over HTTP (GET {base}/events?person=, POST {base}/events).
// Nothing in this repo runs a server; see app/README.md for the shape a server must answer.

import { replay } from './state.js';
import { todayLocal, clockLocal } from './dates.js';

const KEY = (person) => `eatit:v2:events:${person}`;

export const localAdapter = {
  async load(person) {
    try { return JSON.parse(localStorage.getItem(KEY(person)) || '[]'); } catch { return []; }
  },
  async append(person, event) {
    const all = await this.load(person);
    all.push(event);
    try { localStorage.setItem(KEY(person), JSON.stringify(all)); } catch { /* private mode: keep in memory only */ }
  },
  async clear(person) {
    try { localStorage.removeItem(KEY(person)); } catch { /* nothing stored */ }
  },
};

// Demo scenes run in memory so jumping between them never touches saved data.
export function memoryAdapter(initial = []) {
  const log = [...initial];
  return {
    async load() { return [...log]; },
    async append(_p, event) { log.push(event); },
    async clear() { log.length = 0; },
  };
}

export function httpAdapter(base, fetchImpl = globalThis.fetch) {
  const ok = async (r) => { if (!r.ok) throw new Error(`${r.status} ${r.statusText}`); return r; };
  return {
    async load(person) {
      const r = await ok(await fetchImpl(`${base}/events?person=${encodeURIComponent(person)}`));
      return (await r.json()).events || [];
    },
    async append(person, event) {
      await ok(await fetchImpl(`${base}/events`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ person, event }),
      }));
    },
    async clear() { throw new Error('Clearing is not available for a server store'); },
  };
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export async function openStore(persona, adapter = localAdapter, { now = () => new Date() } = {}) {
  let log = [];
  try { log = await adapter.load(persona.id); } catch (err) { console.warn('[eatit] load failed', err); }
  const listeners = new Set();
  const store = {
    persona,
    adapter,
    get today() { return persona.today || todayLocal(now()); },
    get clock() { return persona.clock || clockLocal(now()); },
    get events() { return [...persona.seed, ...log]; },
    get log() { return [...log]; },
    state: null,
    error: null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // Build the event without saving it, e.g. to show "Got it" before the user says Done.
    make(partial) { return { id: newId(), at: now().toISOString(), day: store.today, ...partial }; },
    preview(...events) { return replay([...store.events, ...events], persona); },
    async dispatch(partial) {
      const event = partial.id ? partial : store.make(partial);
      log.push(event);
      store.state = replay(store.events, persona);
      listeners.forEach((fn) => fn(store, event));
      try { await adapter.append(persona.id, event); store.error = null; }
      catch (err) { store.error = err; console.warn('[eatit] save failed', err); }
      return event;
    },
    async reset() {
      await adapter.clear(persona.id);
      log = [];
      store.state = replay(store.events, persona);
      listeners.forEach((fn) => fn(store));
    },
    exportJson() {
      return JSON.stringify({ app: 'eat-it', version: 2, person: persona.id, exportedAt: now().toISOString(), events: log }, null, 2);
    },
  };
  store.state = replay(store.events, persona);
  return store;
}

// Small per-device preferences (who is showing, fridge or list view). Never the food itself.
export const prefs = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`eatit:pref:${key}`); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`eatit:pref:${key}`, JSON.stringify(value)); } catch { /* ignore */ }
  },
};
