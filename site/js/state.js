// URL (hash) routing state, saved items, theme.

const SAVED_KEY = 'undumployed:saved';
const THEME_KEY = 'undumployed:theme';

export function parseHash(hash = location.hash) {
  let h = hash.replace(/^#\/?/, '');
  const qi = h.indexOf('?');
  const rawQuery = qi >= 0 ? h.slice(qi + 1) : '';
  if (qi >= 0) h = h.slice(0, qi);
  const parts = h.split('/').filter(Boolean);
  const route = parts[0] || 'home';
  const id = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : '';
  return { route, id, params: new URLSearchParams(rawQuery), rawQuery };
}

export function hashFor(route, params, id) {
  const q = params ? (params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString()) : '';
  const base = route === 'home' ? '#/' : `#/${route}${id ? '/' + encodeURIComponent(id) : ''}`;
  return q ? `${base}?${q}` : base;
}

export function go(hash) { if (location.hash !== hash) location.hash = hash; }
export function replaceHash(hash) {
  if (location.hash === hash) return;
  history.replaceState(history.state, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ------------------------------------------------------------------ saved
// There are no accounts. Saved items live in this browser's localStorage, so they survive reloads
// and restarts. If storage is blocked (some private windows), we keep them in memory for the visit
// and say so on the Saved page.
export const storageOk = (() => {
  try { localStorage.setItem('undumployed:probe', '1'); localStorage.removeItem('undumployed:probe'); return true; } catch { return false; }
})();
let memory = [];
const listeners = new Set();
export function onSavedChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { const ids = getSaved(); for (const fn of listeners) fn(ids); }

export function getSaved() {
  if (!storageOk) return [...memory];
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}
function setSaved(ids) {
  const clean = [...new Set(ids)];
  if (!storageOk) { memory = clean; return; }
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(clean)); } catch { memory = clean; }
}
export function isSaved(id) { return getSaved().includes(id); }
export function toggleSaved(id) {
  const s = getSaved();
  const i = s.indexOf(id);
  if (i >= 0) s.splice(i, 1); else s.push(id);
  setSaved(s);
  emit();
  return i < 0;
}
/** Add several at once (used when opening a shared list). Returns how many were new. */
export function addSaved(ids) {
  const s = getSaved();
  const fresh = ids.filter((id) => !s.includes(id));
  if (fresh.length) { setSaved([...s, ...fresh]); emit(); }
  return fresh.length;
}
export function clearSaved() { setSaved([]); emit(); }

// Saving in one tab shows up in the others.
window.addEventListener('storage', (e) => { if (e.key === SAVED_KEY) emit(); });

// ------------------------------------------------------------------ theme
export function getTheme() { return document.documentElement.getAttribute('data-theme') || 'golden'; }
export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* the choice just won't be remembered */ }
}
export function toggleTheme() { const t = getTheme() === 'storm' ? 'golden' : 'storm'; setTheme(t); return t; }
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
