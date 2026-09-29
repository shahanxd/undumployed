import { REPO, BRANCH, DATA_BASE } from './config.js';

export const DAY = 864e5;
export const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

export const db = { opps: [], events: [], perks: [], meta: null, byId: new Map(), evById: new Map(), loaded: false };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function fmtDate(d) { return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }
export function fmtDay(d) { return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
export function fmtMonth(d) { return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`; }
export function monthShort(d) { return MONTHS[d.getMonth()]; }
export function weekday(d) { return WEEKDAYS[d.getDay()]; }
export function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

/** "today", "tomorrow", "in 6 days", "in 3 weeks", "in 4 months", "3 days ago". */
export function fmtDays(days) {
  if (days === null || days === undefined) return '';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days < 0) return `${-days} days ago`;
  if (days < 14) return `in ${days} days`;
  if (days < 56) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30.4)} months`;
}

function prepOpp(o) {
  o.date = o.deadlineDate ? parseISO(o.deadlineDate) : null;
  o.days = o.date ? Math.round((o.date - TODAY) / DAY) : null;
  o.kind = o.deadlineKind;
  // A confirmed date that has passed is closed. Computed at runtime, so the site never needs a rebuild to notice.
  if (o.kind === 'exact' && o.days < 0) o.kind = 'closed';
  if (o.kind === 'approx' && o.days !== null && o.days < -45) o.kind = 'next';
  o.sourceUrl = (o.sourceUrl || '').replace('{repo}', REPO).replace('/blob/master/', `/blob/${BRANCH}/`);
  o.search = [o.name, o.type, o.location, o.who, o.what, o.section, o.categoryLabel, o.stipend, o.stageText]
    .join(' ').toLowerCase();
  return o;
}

function prepEvent(e) {
  e.date = e.startDate ? parseISO(e.startDate) : null;
  e.days = e.date ? Math.round((e.date - TODAY) / DAY) : null;
  e.past = e.date ? e.days < -10 : false;
  e.sourceUrl = (e.sourceUrl || '').replace('{repo}', REPO).replace('/blob/master/', `/blob/${BRANCH}/`);
  e.search = [e.name, e.location, e.what, e.studentAngle, e.kindLabel, e.section, e.cost].join(' ').toLowerCase();
  return e;
}

let loading = null;
/** Loads the four JSON files once. Every caller shares the same promise. */
export function loadAll() {
  if (loading) return loading;
  loading = (async () => {
    const names = ['opportunities', 'events', 'perks', 'meta'];
    const [opps, events, perks, meta] = await Promise.all(names.map(async (n) => {
      const r = await fetch(`${DATA_BASE}${n}.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${n}.json returned ${r.status}`);
      return r.json();
    }));
    db.meta = meta;
    db.opps = opps.filter((o) => !o.isNote).map(prepOpp);
    db.events = events.map(prepEvent);
    db.perks = perks;
    db.byId = new Map(db.opps.map((o) => [o.id, o]));
    db.evById = new Map(db.events.map((e) => [e.id, e]));
    // A cross-reference that was folded into its full entry still opens that entry.
    for (const [from, to] of Object.entries(meta.aliases || {})) {
      if (db.byId.has(to) && !db.byId.has(from)) db.byId.set(from, db.byId.get(to));
      if (db.evById.has(to) && !db.evById.has(from)) db.evById.set(from, db.evById.get(to));
    }
    db.loaded = true;
    return db;
  })();
  loading.catch(() => { loading = null; }); // allow a retry after a failure
  return loading;
}
