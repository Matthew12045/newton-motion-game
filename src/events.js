/* ---------- tiny event bus + async helpers ---------- */
let waiters = {};
export function resetEvents(){ waiters = {}; }
export function emit(n, d){ const w = waiters[n] || []; waiters[n] = []; w.forEach(f => f(d)); }
export function waitEvent(n){ return new Promise(r => (waiters[n] = waiters[n] || []).push(r)); }
export function waitAny(names){ return Promise.race(names.map(n => waitEvent(n).then(d => ({ name:n, data:d })))); }
export const sleep = ms => new Promise(r => setTimeout(r, ms));
