// Events: conferences, expos, fests and festivals, month by month.
import { db, fmtMonth, monthKey } from './data.js';
import { esc, icon, eventRow, stateHtml } from './ui.js';
import { hashFor, replaceHash } from './state.js';
import { REGIONS } from './filters.js';

let root = null;
let s = { kind: '', region: '', free: false, past: false, q: '' };

function read(params) {
  s = { kind: params.get('kind') || '', region: params.get('region') || '', free: params.get('free') === '1', past: params.get('past') === '1', q: params.get('q') || '' };
}
function params() {
  const p = new URLSearchParams();
  if (s.kind) p.set('kind', s.kind);
  if (s.region) p.set('region', s.region);
  if (s.free) p.set('free', '1');
  if (s.past) p.set('past', '1');
  if (s.q) p.set('q', s.q);
  return p;
}
const sync = () => replaceHash(hashFor('events', params()));

function refresh() {
  const words = s.q.toLowerCase().split(/\s+/).filter(Boolean);
  const items = db.events.filter((e) => (s.past || !e.past)
    && (!s.kind || e.kind === s.kind || (e.alsoKinds || []).includes(s.kind))
    && (!s.region || e.region === s.region)
    && (!s.free || e.freeOrVirtual)
    && words.every((w) => e.search.includes(w)))
    .sort((a, b) => (a.date && b.date ? a.date - b.date : a.date ? -1 : b.date ? 1 : a.name.localeCompare(b.name)));

  root.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === s.kind)));
  root.querySelector('#ev-region').value = s.region;
  root.querySelector('#ev-free').checked = s.free;
  root.querySelector('#ev-past').checked = s.past;
  root.querySelector('#ev-count').innerHTML = `<strong>${items.length}</strong> ${items.length === 1 ? 'event' : 'events'}`;

  const out = root.querySelector('#ev-list');
  if (!items.length) { out.innerHTML = stateHtml('Nothing here yet.', 'Try another kind of event, or another place.'); return; }
  const p = params(); p.set('from', 'events');
  const groups = new Map();
  for (const e of items) {
    const k = e.date ? monthKey(e.date) : 'tba';
    if (!groups.has(k)) groups.set(k, { title: e.date ? fmtMonth(e.date) : 'Dates not announced', items: [] });
    groups.get(k).items.push(e);
  }
  out.innerHTML = [...groups.values()].map((g) => `
<section aria-label="${esc(g.title)}">
  <div class="list-head"><h2>${esc(g.title)}</h2><span class="n">${g.items.length}</span></div>
  <ul class="list">${g.items.map((e) => eventRow(e, p)).join('')}</ul>
</section>`).join('');
}

export const eventsPage = {
  route: 'events',
  mount(main, prm) {
    root = main; read(prm);
    const kinds = db.meta.eventKinds;
    main.innerHTML = `
<section class="page container">
  <div class="page-head"><h1>Events</h1><p>Conferences, expos, college fests and festivals through 2027. Where there’s a free ticket, a volunteer pass, a travel grant or a free online option, it’s mentioned. Travelling abroad? Read the <a href="#/guide/visas-for-indian-passport">visa guide</a> first.</p></div>
  <div class="ev-bar">
    <div class="tabs" role="group" aria-label="Kind of event">
      <button class="tab" type="button" data-kind="">All</button>
      ${kinds.map((k) => `<button class="tab" type="button" data-kind="${esc(k.id)}">${esc(k.label)}</button>`).join('')}
    </div>
    <label class="select-wrap"><span class="sr-only">Where</span><select id="ev-region"><option value="">Anywhere</option>${REGIONS.filter(([v]) => v !== 'remote' && v !== 'global').map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select>${icon('i-down')}</label>
    <label class="check"><input type="checkbox" id="ev-free"> Free or online option</label>
    <label class="check"><input type="checkbox" id="ev-past"> Include past</label>
    <div class="search-field">${icon('i-search')}<input id="ev-q" type="search" placeholder="Search events" aria-label="Search events" autocomplete="off" value="${esc(s.q)}"></div>
  </div>
  <div class="result-bar"><p id="ev-count" aria-live="polite"></p></div>
  <div id="ev-list"></div>
</section>`;
    refresh();
    main.addEventListener('click', (e) => { const k = e.target.closest('[data-kind]'); if (k) { s.kind = k.dataset.kind; sync(); } });
    main.querySelector('#ev-region').addEventListener('change', (e) => { s.region = e.target.value; sync(); });
    main.querySelector('#ev-free').addEventListener('change', (e) => { s.free = e.target.checked; sync(); });
    main.querySelector('#ev-past').addEventListener('change', (e) => { s.past = e.target.checked; sync(); });
    let t = 0;
    main.querySelector('#ev-q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { s.q = e.target.value.trim(); sync(); }, 160); });
  },
  update(prm) { read(prm); refresh(); },
  unmount() { root = null; },
};
