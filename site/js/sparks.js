// The loving corner of the footer: hearts rise from "love", coffee beans hop out of "coffee".
// Decorative only, so the particles are hidden from assistive tech and skipped for reduced motion.
import { reducedMotion } from './state.js';

const SHAPES = {
  heart: {
    svg: '<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21.2s-7.6-4.6-10.1-9.4C.1 8.2 2 3.9 5.9 3.1c2.4-.5 4.6.7 6.1 2.8 1.5-2.1 3.7-3.3 6.1-2.8 3.9.8 5.8 5.1 4 8.7-2.5 4.8-10.1 9.4-10.1 9.4z"/></svg>',
    colors: ['#e0607a', '#f08ca0', '#cc4a66', '#f4a7b6'],
    count: 7,
  },
  bean: {
    svg: '<svg viewBox="0 0 20 26" aria-hidden="true"><ellipse cx="10" cy="13" rx="8.2" ry="11.6"/><path d="M10.4 2.6c-3.2 3.8-3.1 7.1.1 10.4 3.2 3.4 3.3 6.8.1 10.4" fill="none" stroke="rgba(255,236,214,.5)" stroke-width="1.5" stroke-linecap="round"/></svg>',
    colors: ['#6b4226', '#7d4f2e', '#56341d', '#8a5a36'],
    count: 6,
  },
};

function burst(el, kind) {
  const shape = SHAPES[kind];
  if (!shape || reducedMotion()) return;
  const now = performance.now();
  if (now - (el._lastBurst || 0) < 700) return;
  el._lastBurst = now;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < shape.count; i++) {
    const p = document.createElement('span');
    p.className = `spark-bit spark-${kind}`;
    p.innerHTML = shape.svg;
    p.style.left = `${r.left + r.width * (0.15 + Math.random() * 0.7)}px`;
    p.style.top = `${r.top + r.height * 0.3}px`;
    p.style.color = shape.colors[i % shape.colors.length];
    p.style.setProperty('--dx', `${Math.round((Math.random() * 2 - 1) * (kind === 'bean' ? 34 : 22))}px`);
    p.style.setProperty('--dy', `${Math.round(-(kind === 'bean' ? 26 + Math.random() * 22 : 44 + Math.random() * 36))}px`);
    p.style.setProperty('--rot', `${Math.round((Math.random() * 2 - 1) * (kind === 'bean' ? 220 : 24))}deg`);
    p.style.setProperty('--size', `${(kind === 'bean' ? 7 : 8) + Math.random() * 5}px`);
    p.style.animationDelay = `${i * 45}ms`;
    p.addEventListener('animationend', () => p.remove(), { once: true });
    document.body.appendChild(p);
  }
}

export function wireSparks(root = document) {
  root.querySelectorAll('[data-spark]').forEach((el) => {
    const kind = el.dataset.spark;
    el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') burst(el, kind); });
    el.addEventListener('click', () => burst(el, kind)); // phones have no hover, so a tap does it
  });
}
