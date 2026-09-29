// Perks: free tools, credits and discounts for students.
import { db } from './data.js';
import { esc, icon, stateHtml } from './ui.js';

const INDIA = { '✅': ['yes', 'Works in India'], '❌': ['no', 'Not available in India'], '⚠️': ['maybe', 'Not sure about India'] };
let root = null;
let st = { q: '', india: false };

function refresh() {
  const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = db.perks.filter((p) => !/ended|not for india/i.test(p.section)
    && (!st.india || p.india === '✅')
    && words.every((w) => `${p.name} ${p.what} ${p.requirement} ${p.section}`.toLowerCase().includes(w)));
  const sections = [...new Set(visible.map((p) => p.section))];
  root.querySelector('#pk-count').innerHTML = `<strong>${visible.length}</strong> ${visible.length === 1 ? 'perk' : 'perks'}`;
  root.querySelector('#pk-index').innerHTML = sections.length > 1 ? sections.map((s, i) => `<a href="#pk-${i}" data-jump="pk-${i}">${esc(s)}</a>`).join('') : '';
  root.querySelector('#pk-list').innerHTML = visible.length ? sections.map((s, i) => `
<section class="perk-section" id="pk-${i}" aria-labelledby="pkh-${i}">
  <div class="list-head"><h2 id="pkh-${i}">${esc(s)}</h2></div>
  <ul class="perks">${visible.filter((p) => p.section === s).map((p) => {
    const [cls, label] = INDIA[p.india] || INDIA['⚠️'];
    const name = p.url ? `<a class="perk-name" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}${icon('i-out')}</a>` : `<span class="perk-name">${esc(p.name)}</span>`;
    return `<li class="perk"><div>${name}<p class="perk-what">${esc(p.what)}</p></div>
      <div class="perk-side"><span class="perk-india ${cls}">${label}</span><span>${esc(p.requirement)}</span>${p.duration ? `<span>${esc(p.duration)}</span>` : ''}${p.unverified ? '<span>Value not confirmed this round</span>' : ''}</div></li>`;
  }).join('')}</ul>
</section>`).join('') : stateHtml('No perks match that.', 'Try a different word, or turn off the India filter.');
}

export const perksPage = {
  route: 'perks',
  mount(main, params) {
    root = main;
    st = { q: params.get('q') || '', india: params.get('india') === '1' };
    main.innerHTML = `
<section class="page container">
  <div class="page-head"><h1>Perks</h1><p>Being a student is expensive. These help a little: free software, cloud credits, AI tools, courses and discounts. Most just need a college email or the GitHub Student Pack. Checked in ${esc(db.meta.lastVerified)}.</p></div>
  <div class="toolbar">
    <div class="search-field" style="width:min(100%,24rem)">${icon('i-search')}<input id="pk-q" type="search" placeholder="Search perks" aria-label="Search perks" autocomplete="off" value="${esc(st.q)}"></div>
    <label class="check"><input type="checkbox" id="pk-india" ${st.india ? 'checked' : ''}> Only ones that work in India</label>
  </div>
  <div class="result-bar"><p id="pk-count" aria-live="polite"></p></div>
  <nav class="perk-index" id="pk-index" aria-label="Sections"></nav>
  <div id="pk-list"></div>
</section>`;
    refresh();
    let t = 0;
    main.querySelector('#pk-q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); refresh(); }, 140); });
    main.querySelector('#pk-india').addEventListener('change', (e) => { st.india = e.target.checked; refresh(); });
    main.querySelector('#pk-index').addEventListener('click', (e) => {
      const a = e.target.closest('[data-jump]');
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  },
  update() {},
  unmount() { root = null; },
};
