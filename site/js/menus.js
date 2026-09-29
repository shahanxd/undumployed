// A dropdown panel attached to a button. Uses the native Popover API (top layer, Esc and
// click-outside for free) and falls back to a small manual version where it's missing.
// Below 720px the panel becomes a bottom sheet.

const HAS_POPOVER = typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');
const narrow = () => window.matchMedia('(max-width: 720px)').matches;

export function bindMenu(button, panel) {
  const place = () => {
    if (narrow()) {
      panel.classList.add('as-sheet');
      panel.style.left = ''; panel.style.top = '';
      return;
    }
    panel.classList.remove('as-sheet');
    const r = button.getBoundingClientRect();
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 12 && r.top - h - 6 > 12) top = r.top - h - 6;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  };
  let raf = 0;
  const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
  const opened = () => {
    button.setAttribute('aria-expanded', 'true');
    place();
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
  };
  const closed = () => {
    button.setAttribute('aria-expanded', 'false');
    window.removeEventListener('scroll', onMove);
    window.removeEventListener('resize', onMove);
  };
  button.setAttribute('aria-expanded', 'false');
  panel.querySelectorAll('.menu-done').forEach((b) => b.addEventListener('click', () => close(), { once: false }));

  let close;
  if (HAS_POPOVER) {
    panel.setAttribute('popover', 'auto');
    button.popoverTargetElement = panel;
    button.popoverTargetAction = 'toggle';
    panel.addEventListener('toggle', (e) => (e.newState === 'open' ? opened() : closed()));
    close = () => { try { panel.hidePopover(); } catch { /* already closed */ } };
  } else {
    panel.classList.add('is-fallback');
    panel.hidden = true;
    const outside = (e) => { if (!panel.contains(e.target) && !button.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === 'Escape') { close(); button.focus(); } };
    close = () => {
      if (panel.hidden) return;
      panel.hidden = true; closed();
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', esc);
    };
    button.addEventListener('click', () => {
      if (!panel.hidden) { close(); return; }
      document.querySelectorAll('.menu.is-fallback:not([hidden])').forEach((m) => { m.hidden = true; });
      panel.hidden = false; opened();
      document.addEventListener('pointerdown', outside, true);
      document.addEventListener('keydown', esc);
    });
  }
  return { close };
}
