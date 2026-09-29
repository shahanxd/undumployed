// Small shared pieces: escaping, icons, labels, list rows, toasts, states.
import { fmtDays, fmtDay, monthShort, weekday } from './data.js';
import { isSaved, hashFor } from './state.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const icon = (name, cls = 'ico') => `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${name}"/></svg>`;
export const fly = (cls = 'fly') => `<svg class="${cls}" viewBox="0 0 64 52" aria-hidden="true" focusable="false"><use href="#morpho-fly"/></svg>`;

/** In this list "~" means "about". Markdown would pair two of them into strikethrough, so escape
    single tildes outside code before parsing. */
export function tildeSafe(md) {
  let fence = false;
  return String(md).split('\n').map((line) => {
    if (/^\s*```/.test(line)) { fence = !fence; return line; }
    if (fence) return line;
    return line.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : part.replace(/(?<!~)~(?!~)/g, '&#126;'))).join('');
  }).join('\n');
}
/** Inline and block markdown from the data (links, bold). */
export function inline(md) {
  if (!md) return '';
  try { return window.marked ? window.marked.parseInline(tildeSafe(md)) : esc(md); } catch { return esc(md); }
}
export function block(md) {
  if (!md) return '';
  try { return window.marked ? window.marked.parse(tildeSafe(md)) : `<p>${esc(md)}</p>`; } catch { return `<p>${esc(md)}</p>`; }
}
/** Plain text of a markdown fragment, for places that must not contain links. */
export const plain = (md) => String(md || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

// ------------------------------------------------------------------ labels
export const CAT_SHORT = {
  'research-india': 'Research in India',
  'research-global': 'Research abroad',
  tech: 'Tech internship',
  finance: 'Finance & consulting',
  'govt-nontech': 'Policy & non-tech',
  'open-source': 'Open source',
  'study-abroad': 'Study abroad',
  'fellowship-india': 'Scholarship in India',
  'research-fellowship': 'Research grant',
  startup: 'Startups',
  hackathon: 'Hackathon',
  cp: 'Programming contest',
  'case-research': 'Competition',
  ambassador: 'Ambassador program',
  insider: 'Brand community',
};
export const REGION_SHORT = {
  india: 'India', remote: 'Remote', europe: 'Europe', uk: 'UK', 'north-america': 'USA/Canada', 'east-asia': 'East Asia',
  'southeast-asia': 'Southeast Asia', 'middle-east': 'Middle East', australia: 'Australia/NZ', global: 'Anywhere',
};
const PAID_GROUPS = new Set(['internship', 'open-source', 'community']);
export function moneyShort(o) {
  switch (o.funding) {
    case 'full': return 'Fully funded';
    case 'stipend': return PAID_GROUPS.has(o.group) ? 'Paid' : 'Funded';
    case 'prize': return 'Prizes';
    case 'free': return 'Free';
    case 'unpaid': return 'Unpaid';
    case 'loan': return 'Loan';
    default: return '';
  }
}
/** Where it happens: the actual place when it's short and specific, else the region. */
export function placeFor(o) {
  if (o.format === 'remote') return 'Remote';
  const loc = plain(o.location);
  if (loc && loc.length <= 26 && !/various|multiple|varies|several|any |anywhere|global|worldwide|india-wide|\||;/i.test(loc)) return loc;
  return REGION_SHORT[o.region] || '';
}

// ------------------------------------------------------------------ deadlines
/** The deadline column: main line, small line, and a class for colour. */
export function whenFor(o) {
  let w;
  switch (o.kind) {
    case 'exact':
      w = { main: fmtDay(o.date), sub: o.unverified ? 'not confirmed' : fmtDays(o.days), cls: o.days <= 7 ? 'is-urgent' : o.days <= 30 ? 'is-soon' : '' };
      break;
    case 'closed':
      w = { main: fmtDay(o.date), sub: 'closed', cls: 'is-closed' };
      break;
    case 'approx':
      w = { main: o.date ? `~${monthShort(o.date)} ${o.date.getFullYear()}` : 'Soon', sub: o.unverified ? 'not confirmed' : 'expected', cls: 'is-approx' };
      break;
    case 'rolling':
      w = { main: 'Rolling', sub: 'any time', cls: 'is-rolling' };
      break;
    default:
      w = { main: 'Later', sub: o.date ? `~${monthShort(o.date)} ${o.date.getFullYear()}` : 'next cycle', cls: 'is-later' };
  }
  return w;
}

// ------------------------------------------------------------------ rows
function saveButton(id, name) {
  const on = isSaved(id);
  return `<button class="save" type="button" data-save="${esc(id)}" data-name="${esc(name)}" aria-pressed="${on}" aria-label="${on ? 'Remove from saved' : 'Save'}: ${esc(name)}">${icon(on ? 'i-mark-on' : 'i-mark')}</button>`;
}

/** One opportunity as a list row. `params` carries the page state so closing the detail returns to it. */
export function oppRow(o, params) {
  const w = whenFor(o);
  const cat = CAT_SHORT[o.category] || o.categoryLabel;
  const place = placeFor(o);
  const meta = [cat, place && !cat.toLowerCase().includes(place.toLowerCase()) ? place : '', moneyShort(o)].filter(Boolean).join(' · ');
  return `<li class="row ${w.cls}">
  <div class="row-when"><span class="when-main">${esc(w.main)}</span><span class="when-sub">${esc(w.sub)}</span></div>
  <div class="row-body"><a class="row-title" href="${esc(hashFor('o', params, o.id))}">${esc(o.name)}</a><p class="row-meta">${esc(meta)}</p></div>
  <div class="row-end">${saveButton(o.id, o.name)}</div>
</li>`;
}

/** One event as a list row. */
export function eventRow(e, params) {
  const main = e.date ? fmtDay(e.date) : 'TBA';
  const sub = e.unverified ? 'to be confirmed' : e.date ? (e.past ? 'past' : weekday(e.date)) : '';
  const angle = plain(e.studentAngle).replace(/\.$/, '');
  const meta = [plain(e.location), angle].filter(Boolean).join(' · ');
  return `<li class="row ${e.past ? 'is-past' : ''}">
  <div class="row-when"><span class="when-main">${esc(main)}</span><span class="when-sub">${esc(sub)}</span></div>
  <div class="row-body"><a class="row-title" href="${esc(hashFor('e', params, e.id))}">${esc(e.name)}</a><p class="row-meta">${esc(meta)}</p></div>
  <div class="row-end">${e.freeOrVirtual ? '<span class="row-tag">Free option</span>' : ''}</div>
</li>`;
}

/** Keep every save button for an id in sync, wherever it is on the page. */
export function syncSaveButtons(id, on) {
  document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`).forEach((b) => {
    const name = b.dataset.name || '';
    b.setAttribute('aria-pressed', String(on));
    if (b.classList.contains('save')) {
      b.innerHTML = icon(on ? 'i-mark-on' : 'i-mark');
      b.setAttribute('aria-label', `${on ? 'Remove from saved' : 'Save'}: ${name}`);
    } else {
      b.innerHTML = `${icon(on ? 'i-mark-on' : 'i-mark')}<span>${on ? 'Saved' : 'Save'}</span>`;
    }
  });
}

// ------------------------------------------------------------------ toast
let toastTimer = 0;
export function toast(message, { choice = false, spoken = '' } = {}) {
  const t = document.getElementById('toast');
  clearTimeout(toastTimer);
  t.classList.remove('is-on');
  t.classList.toggle('is-choice', choice);
  const sr = spoken ? `<span class="sr-only">${esc(spoken)} </span>` : '';
  t.innerHTML = choice ? `${fly('toast-fly')}${sr}<span>${esc(message)}</span>` : `${sr}${esc(message)}`;
  requestAnimationFrame(() => t.classList.add('is-on'));
  toastTimer = setTimeout(() => t.classList.remove('is-on'), choice ? 3200 : 2400);
}

// ------------------------------------------------------------------ states
export function stateHtml(title, body, action = '') {
  return `<div class="state"><h2>${esc(title)}</h2><p>${body}</p>${action}</div>`;
}
export function loadingHtml(text = 'Loading the list…') {
  return `<div class="loading" role="status">${fly()}<span>${esc(text)}</span></div>`;
}

export function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } finally { ta.remove(); }
  return Promise.resolve();
}
