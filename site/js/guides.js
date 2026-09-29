// Guides: a short list, and a comfortable reader with an outline for the long ones.
import { db } from './data.js';
import { esc, icon, stateHtml, loadingHtml, toast, copyText } from './ui.js';
import { renderMarkdown, fetchGuide } from './md.js';
import { REPO_URL, BRANCH } from './config.js';

const ORDER = ['timeline-by-year', 'application-kit', 'how-to-cold-email', 'interviews-and-tests', 'visas-for-indian-passport', 'contributing'];

export const guidesPage = {
  route: 'guides',
  mount(main) {
    const guides = [...db.meta.guides].sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
    main.innerHTML = `
<section class="page container">
  <div class="page-head"><h1>Guides</h1><p>The parts of applying nobody explains: what to apply for each year, how to write to a professor, what interviews actually ask, and how visas work on an Indian passport.</p></div>
  <ul class="guide-list">${guides.map((g) => `<li><a href="#/guide/${esc(g.slug)}"><div class="t">${esc(g.title)}</div>${g.description ? `<div class="d">${esc(g.description)}</div>` : ''}</a></li>`).join('')}</ul>
</section>`;
  },
  update() {},
};

let io = null;
export const guidePage = {
  route: 'guide',
  async mount(main, params, slug) {
    main.innerHTML = `<section class="page container"><a class="back-link" href="#/guides">${icon('i-arrow')} All guides</a><div class="reader"><article class="prose" id="g-body">${loadingHtml('Loading the guide…')}</article><nav class="toc" id="g-toc" aria-label="On this page"></nav></div></section>`;
    let doc;
    try { doc = await fetchGuide(slug); } catch {
      main.querySelector('#g-body').innerHTML = stateHtml('That guide isn’t here.', 'It may have been renamed.', '<a class="btn" href="#/guides">See all guides</a>');
      return;
    }
    const body = main.querySelector('#g-body');
    if (!body) return;
    renderMarkdown(body, doc.md, doc.file);
    const title = body.querySelector('h1');
    if (title) document.title = `${title.textContent} · undumployed`;
    body.insertAdjacentHTML('beforeend', `<hr><p class="guide-note">This guide lives in <a href="${REPO_URL}/blob/${BRANCH}/${esc(doc.file)}" rel="noopener">${esc(doc.file)}</a>. If something’s off or missing, corrections are very welcome.</p>`);

    // a small link beside each section heading, for sending someone straight to the part they need
    body.querySelectorAll('h2[id], h3[id]').forEach((h) => {
      h.insertAdjacentHTML('beforeend', `<a class="h-anchor" href="#/guide/${esc(slug)}?h=${encodeURIComponent(h.id)}" data-anchor="${esc(h.id)}" aria-label="Copy a link to this section">#</a>`);
    });
    body.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-anchor]');
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { await copyText(`${location.origin}${location.pathname}${a.getAttribute('href')}`); toast('Link to this section copied.'); } catch { /* the heading is still in view */ }
    });

    const heads = [...body.querySelectorAll('h2')];
    const toc = main.querySelector('#g-toc');
    const short = (h) => (h.firstChild?.textContent || h.textContent).replace(/\s+[—:–].*$/, '').replace(/:\s.*$/, '').trim();
    if (heads.length >= 4) {
      toc.innerHTML = `<p>On this page</p>${heads.map((h) => `<a href="#${esc(h.id)}" data-to="${esc(h.id)}">${esc(short(h))}</a>`).join('')}`;
      toc.addEventListener('click', (e) => {
        const a = e.target.closest('[data-to]');
        if (!a) return;
        e.preventDefault();
        document.getElementById(a.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      io = new IntersectionObserver((entries) => {
        for (const en of entries) if (en.isIntersecting) toc.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a.dataset.to === en.target.id));
      }, { rootMargin: '-15% 0px -75% 0px' });
      heads.forEach((h) => io.observe(h));
    }
    const target = params.get('h');
    if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }));
  },
  update() {},
  unmount() { if (io) io.disconnect(); io = null; },
};
