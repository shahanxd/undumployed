// Render repo markdown inside the site and rewrite relative links to site routes.
import { REPO_URL, BRANCH } from './config.js';
import { db } from './data.js';
import { tildeSafe } from './ui.js';

const GUIDE_SLUGS = {
  'timeline-by-year.md': 'timeline-by-year', 'application-kit.md': 'application-kit', 'how-to-cold-email.md': 'how-to-cold-email',
  'interviews-and-tests.md': 'interviews-and-tests', 'visas-for-indian-passport.md': 'visas-for-indian-passport', 'CONTRIBUTING.md': 'contributing',
};

export function slugify(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().replace(/ /g, '-');
}

/** Map a repo-relative markdown link (from a guide) to a site hash or GitHub URL. */
export function rewriteLink(href, fromFile = 'guides/x.md') {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return href;
  // resolve relative to the guide's folder
  const base = fromFile.includes('/') ? fromFile.replace(/[^/]+$/, '') : '';
  const parts = (base + href).split('/');
  const stack = [];
  for (const p of parts) { if (p === '..') stack.pop(); else if (p && p !== '.') stack.push(p); }
  const full = stack.join('/');
  const [file, anchor] = full.split('#');
  const name = file.split('/').pop();
  if (file.startsWith('guides/') || file === 'CONTRIBUTING.md') {
    const slug = GUIDE_SLUGS[name];
    return slug ? `#/guide/${slug}${anchor ? '?h=' + encodeURIComponent(anchor) : ''}` : `${REPO_URL}/blob/${BRANCH}/${full}`;
  }
  if (file === 'deadlines.md') return '#/deadlines';
  if (file === 'README.md' || file === '') return '#/';
  if (file.startsWith('student-perks/')) return '#/perks';
  if (file.startsWith('events/')) {
    const kind = { 'tech-global.md': 'tech', 'research-conferences.md': 'research', 'india.md': 'india', 'arts-culture.md': 'arts' }[name];
    if (anchor && db.evById.has(`${file}#${anchor}`)) return `#/e/${encodeURIComponent(`${file}#${anchor}`)}`;
    return kind ? `#/events?kind=${kind}` : '#/events';
  }
  const cat = db.meta && db.meta.categories.find((c) => c.file === file);
  if (cat) {
    if (anchor && db.byId.has(`${file}#${anchor}`)) return `#/o/${encodeURIComponent(`${file}#${anchor}`)}`;
    return `#/browse?cat=${cat.id}`;
  }
  return `${REPO_URL}/blob/${BRANCH}/${full}`;
}

export function renderMarkdown(container, md, fromFile) {
  container.innerHTML = window.marked.parse(tildeSafe(md));
  container.querySelectorAll('p').forEach((p) => { if (/^\s*Jump to:/i.test(p.textContent)) p.remove(); });
  const seen = {};
  container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
    let id = slugify(h.textContent);
    if (seen[id] !== undefined) { seen[id]++; id = `${id}-${seen[id]}`; } else seen[id] = 0;
    h.id = id;
  });
  container.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; return; }
    if (href.startsWith('#')) { a.setAttribute('href', href); a.dataset.inpage = href.slice(1); return; }
    a.setAttribute('href', rewriteLink(href, fromFile));
  });
  container.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-inpage]');
    if (!a) return;
    const t = container.querySelector(`#${CSS.escape(a.dataset.inpage)}`);
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
}

export async function fetchGuide(slug) {
  const file = Object.entries(GUIDE_SLUGS).find(([, s]) => s === slug);
  if (!file) throw new Error('unknown guide');
  const r = await fetch(`data/guides/${file[0]}`, { cache: 'no-cache' });
  if (!r.ok) throw new Error('guide missing');
  return { md: await r.text(), file: file[0] === 'CONTRIBUTING.md' ? 'CONTRIBUTING.md' : `guides/${file[0]}` };
}
