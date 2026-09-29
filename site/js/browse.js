// Opportunities: search plus a row of dropdown filters. All state lives in the URL.
import { db } from './data.js';
import * as F from './filters.js';
import { esc, icon, oppRow, stateHtml, CAT_SHORT } from './ui.js';
import { bindMenu } from './menus.js';
import { hashFor, replaceHash } from './state.js';

const PAGE = 50;
let f = { ...F.DEFAULT };
let shown = PAGE;
let root = null;
let menus = [];

const GROUP_ORDER = F.GROUPS.map(([g]) => g);
function catsOf(group) { return db.meta.categories.filter((c) => c.group === group).map((c) => c.id); }

function readFrom(params) {
  f = F.fromParams(params);
  // older links use ?group=…; turn them into the categories they stand for
  if (f.group.length) {
    f.cat = [...new Set([...f.cat, ...f.group.flatMap(catsOf)])];
    f.group = [];
  }
  if (f.sort === 'relevance' && !f.q) f.sort = 'deadline';
  shown = PAGE;
}
const sync = () => replaceHash(hashFor('browse', F.toParams(f)));

// ------------------------------------------------------------------ menus
const opt = (name, value, label, type = 'checkbox') =>
  `<label class="opt"><input type="${type}" name="${name}" value="${esc(value)}"><span>${esc(label)}</span><span class="n"></span></label>`;
const foot = (key) => `<div class="menu-foot"><button type="button" class="link-btn" data-clear="${key}">Clear</button><button type="button" class="btn btn-s menu-done">Done</button></div>`;

function menuHtml(key) {
  switch (key) {
    case 'stage': return `<div class="opts">${F.STAGES.map(([v, l]) => opt('stage', v, l)).join('')}</div>${foot('stage')}`;
    case 'field': return `<div class="opts">${F.FIELDS.map(([v, l]) => opt('field', v, l)).join('')}</div><p class="menu-head">Programs open to any field always show.</p>${foot('field')}`;
    case 'region': return `<div class="opts">${F.REGIONS.map(([v, l]) => opt('region', v, l)).join('')}</div>${foot('region')}`;
    case 'fund': return `<div class="opts">${F.FUNDING.map(([v, l]) => opt('fund', v, l)).join('')}</div>${foot('fund')}`;
    case 'when': return `<div class="opts">${opt('when', '', 'Any time', 'radio')}${F.WHEN.map(([v, l]) => opt('when', v, l, 'radio')).join('')}</div>${foot('when')}`;
    case 'cat': return `<div class="opts">${GROUP_ORDER.map((g) => {
      const label = F.GROUPS.find(([x]) => x === g)[1];
      return `<label class="opt opt-group"><input type="checkbox" data-group="${g}"><span>${esc(label)}</span><span class="n"></span></label>${catsOf(g).map((c) => opt('cat', c, CAT_SHORT[c] || c).replace('class="opt"', 'class="opt opt-sub"')).join('')}`;
    }).join('')}</div>${foot('cat')}`;
    case 'more': return `<p class="menu-head">Only show</p>
      <label class="opt"><input type="checkbox" name="women"><span>Programs for women</span><span class="n" data-n="women"></span></label>
      <label class="opt"><input type="checkbox" name="verified"><span>Dates confirmed on the official site</span><span class="n" data-n="verified"></span></label>
      <label class="opt"><input type="checkbox" name="closed"><span>Include ones that have closed</span><span class="n" data-n="closed"></span></label>
      <p class="menu-head">Hide programs that need</p>
      ${F.GATES.map(([v, l]) => opt('nogate', v, l)).join('')}${foot('more')}`;
    default: return '';
  }
}
const FACETS = [['stage', 'Stage'], ['field', 'Field'], ['cat', 'Type'], ['region', 'Where'], ['fund', 'Money'], ['when', 'Deadline'], ['more', 'More']];

function activeIn(key) {
  if (key === 'when') return f.when ? 1 : 0;
  if (key === 'more') return f.nogate.length + (f.women ? 1 : 0) + (f.verified ? 1 : 0) + (f.closed ? 1 : 0);
  return f[key].length;
}

function updateMenus(counts) {
  for (const [key, label] of FACETS) {
    const btn = root.querySelector(`[data-facet="${key}"]`);
    const n = activeIn(key);
    btn.classList.toggle('is-active', n > 0);
    const text = key === 'when' && f.when ? (F.WHEN.find(([v]) => v === f.when) || [, label])[1] : n ? `${label} · ${n}` : label;
    btn.querySelector('.fbtn-label').textContent = text;
  }
  root.querySelectorAll('.menu input').forEach((input) => {
    const { name, value } = input;
    if (input.dataset.group) {
      const cats = catsOf(input.dataset.group);
      const on = cats.filter((c) => f.cat.includes(c)).length;
      input.checked = on === cats.length;
      input.indeterminate = on > 0 && on < cats.length;
      const n = cats.reduce((s, c) => s + (counts.cat[c] || 0), 0);
      input.closest('.opt').querySelector('.n').textContent = n;
      return;
    }
    if (name === 'when') input.checked = f.when === value;
    else if (['women', 'verified', 'closed'].includes(name)) input.checked = f[name];
    else if (Array.isArray(f[name])) input.checked = f[name].includes(value);
    const nEl = input.closest('.opt').querySelector('.n');
    if (!nEl) return;
    let n;
    if (nEl.dataset.n) n = counts[nEl.dataset.n];
    else if (name === 'when') n = value ? counts.when[value] : '';
    else if (counts[name]) n = counts[name][value];
    nEl.textContent = n === undefined ? '' : n;
    input.closest('.opt').classList.toggle('is-zero', n === 0 && !input.checked);
  });
  root.querySelector('[data-clear-all]').hidden = F.isEmpty(f) && !f.closed;
}

// ------------------------------------------------------------------ results
function refresh() {
  if (!root) return;
  const items = F.apply(db.opps, f);
  const counts = F.facetCounts(db.opps, f, db.meta.categories.map((c) => [c.id, c.label]));
  updateMenus(counts);
  const q = root.querySelector('#bq');
  if (q.value !== f.q && document.activeElement !== q) q.value = f.q;
  root.querySelector('.search-clear').hidden = !q.value;
  q.parentElement.classList.toggle('has-value', !!q.value);
  const sort = root.querySelector('#bsort');
  sort.querySelector('[value="relevance"]').disabled = !f.q;
  sort.value = f.sort;

  root.querySelector('#bcount').innerHTML = items.length === db.opps.length
    ? `<strong>${items.length}</strong> opportunities`
    : `<strong>${items.length}</strong> of ${db.opps.length}`;

  const list = root.querySelector('#blist');
  const more = root.querySelector('#bmore');
  if (!items.length) {
    list.innerHTML = '';
    more.innerHTML = stateHtml('Nothing matches all of that.', 'Try loosening a filter or two.', '<button class="btn" type="button" data-clear-all>Clear filters</button>');
    return;
  }
  const params = F.toParams(f);
  list.innerHTML = items.slice(0, shown).map((o) => oppRow(o, params)).join('');
  const left = items.length - shown;
  more.innerHTML = left > 0 ? `<button class="btn" type="button" data-more>Show ${Math.min(PAGE, left)} more</button>` : '';
}

export const browsePage = {
  route: 'browse',
  mount(main, params) {
    readFrom(params);
    main.innerHTML = `
<section class="page container">
  <div class="page-head"><h1>Opportunities</h1><p>Internships, fellowships, scholarships, competitions and more. Start with your stage and field, then narrow it down if you like.</p></div>
  <form class="browse-search" role="search" onsubmit="return false">
    <label class="sr-only" for="bq">Search opportunities</label>
    <div class="search-field">${icon('i-search')}<input id="bq" type="search" placeholder="Search by name, field, city…" autocomplete="off" spellcheck="false" enterkeyhint="search"><kbd class="kbd-hint" aria-hidden="true" title="Press / to search from anywhere">/</kbd><button class="search-clear" type="button" aria-label="Clear search" hidden>${icon('i-close', 'ico ico-s')}</button></div>
  </form>
  <div class="filterbar browse-bar" role="group" aria-label="Filters">
    ${FACETS.map(([key, label]) => `<button class="fbtn" type="button" data-facet="${key}"><span class="fbtn-label">${label}</span>${icon('i-down')}</button><div class="menu${key === 'field' ? ' cols-2' : ''}" data-menu="${key}" role="group" aria-label="${label}">${menuHtml(key)}</div>`).join('')}
    <button class="link-btn" type="button" data-clear-all hidden>Clear all</button>
  </div>
  <div class="result-bar"><p id="bcount" aria-live="polite"></p>
    <label class="select-wrap"><span class="sr-only">Sort by</span><select id="bsort">${F.SORTS.map(([v, l]) => `<option value="${v}">Sort: ${l}</option>`).join('')}</select>${icon('i-down')}</label>
  </div>
  <ul class="list" id="blist"></ul>
  <div class="more" id="bmore"></div>
</section>`;
    root = main;
    menus = FACETS.map(([key]) => bindMenu(main.querySelector(`[data-facet="${key}"]`), main.querySelector(`[data-menu="${key}"]`)));
    refresh();

    main.addEventListener('change', (e) => {
      const i = e.target;
      if (!(i instanceof HTMLInputElement) || !i.closest('.menu')) return;
      if (i.dataset.group) {
        const cats = catsOf(i.dataset.group);
        f.cat = i.checked ? [...new Set([...f.cat, ...cats])] : f.cat.filter((c) => !cats.includes(c));
      } else if (i.name === 'when') f.when = i.value;
      else if (['women', 'verified', 'closed'].includes(i.name)) f[i.name] = i.checked;
      else {
        const set = new Set(f[i.name]);
        if (i.checked) set.add(i.value); else set.delete(i.value);
        f[i.name] = [...set];
      }
      shown = PAGE; sync();
    });
    main.addEventListener('click', (e) => {
      const t = e.target;
      const clear = t.closest('[data-clear]');
      if (clear) {
        const k = clear.dataset.clear;
        if (k === 'more') { f.nogate = []; f.women = false; f.verified = false; f.closed = false; } else if (k === 'when') f.when = ''; else f[k] = [];
        shown = PAGE; sync(); return;
      }
      if (t.closest('[data-clear-all]')) { f = { ...F.DEFAULT }; shown = PAGE; menus.forEach((m) => m.close()); sync(); return; }
      if (t.closest('[data-more]')) {
        const before = shown; shown += PAGE; refresh();
        root.querySelectorAll('#blist .row-title')[before]?.focus({ preventScroll: true });
        return;
      }
      if (t.closest('.search-clear')) { const q = main.querySelector('#bq'); q.value = ''; f.q = ''; if (f.sort === 'relevance') f.sort = 'deadline'; sync(); q.focus(); }
    });
    const q = main.querySelector('#bq');
    q.value = f.q;
    let timer = 0;
    q.addEventListener('input', () => {
      main.querySelector('.search-clear').hidden = !q.value;
      q.parentElement.classList.toggle('has-value', !!q.value);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const v = q.value.trim();
        if (v && !f.q && f.sort === 'deadline') f.sort = 'relevance';
        if (!v && f.sort === 'relevance') f.sort = 'deadline';
        f.q = v; shown = PAGE; sync();
      }, 160);
    });
    q.addEventListener('keydown', (e) => { if (e.key === 'Escape' && q.value) { e.preventDefault(); q.value = ''; q.dispatchEvent(new Event('input')); } });
    main.querySelector('#bsort').addEventListener('change', (e) => { f.sort = e.target.value; sync(); });
  },
  update(params) { readFrom(params); refresh(); },
  focusSearch() { const q = root && root.querySelector('#bq'); if (q) { q.focus(); q.select(); } },
  unmount() { menus.forEach((m) => m.close()); menus = []; root = null; },
};
