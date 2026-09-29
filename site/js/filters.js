// Pure filter engine. No DOM.

export const GROUPS = [
  ['internship', 'Internships'],
  ['fellowship', 'Fellowships and scholarships'],
  ['open-source', 'Open source'],
  ['startup', 'Startups'],
  ['competition', 'Hackathons and competitions'],
  ['community', 'Communities'],
];
export const STAGES = [
  ['hs', 'In school (Class 9–12)'],
  ['ug', 'Undergrad'],
  ['pg', 'Master’s'],
  ['phd', 'PhD'],
  ['grad', 'Out of college'],
];
export const FIELDS = [
  ['cs', 'Software'],
  ['ai', 'AI and data'],
  ['ee', 'Electronics'],
  ['mech', 'Mechanical and aero'],
  ['civil', 'Civil and architecture'],
  ['physics', 'Physics'],
  ['math', 'Maths and statistics'],
  ['chem', 'Chemistry and materials'],
  ['bio', 'Biology'],
  ['med', 'Medicine and health'],
  ['design', 'Design'],
  ['business', 'Business and finance'],
  ['econ', 'Economics'],
  ['policy', 'Policy and social science'],
  ['law', 'Law'],
  ['humanities', 'Humanities'],
  ['media', 'Media and film'],
  ['edu', 'Teaching'],
];
export const REGIONS = [
  ['india', 'India'],
  ['remote', 'Remote'],
  ['europe', 'Europe'],
  ['uk', 'UK'],
  ['north-america', 'USA and Canada'],
  ['east-asia', 'East Asia'],
  ['southeast-asia', 'Southeast Asia'],
  ['middle-east', 'Middle East'],
  ['australia', 'Australia and NZ'],
  ['global', 'Anywhere'],
];
export const FUNDING = [
  ['full', 'Fully funded'],
  ['stipend', 'Paid or stipend'],
  ['prize', 'Prize money'],
  ['free', 'Free'],
  ['unpaid', 'Unpaid'],
  ['loan', 'Loan scholarship'],
];
export const WHEN = [
  ['30', 'Closing in 30 days'],
  ['90', 'Closing in 90 days'],
  ['exact', 'Confirmed date'],
  ['approx', 'Expected, not announced'],
  ['rolling', 'Rolling'],
  ['next', 'Next cycle'],
];
export const GATES = [
  ['nomination', 'a nomination'],
  ['faculty-first', 'a professor’s yes first'],
  ['campus-only', 'your college’s placement cell'],
  ['invite-only', 'an invitation'],
  ['work-experience', 'work experience'],
];
export const SORTS = [
  ['deadline', 'Deadline'],
  ['name', 'Name'],
  ['relevance', 'Best match'],
];

export const DEFAULT = Object.freeze({
  q: '', group: [], cat: [], stage: [], field: [], region: [], fund: [], when: '',
  nogate: [], women: false, verified: false, closed: false, sort: 'deadline', view: 'cards',
});
const LISTS = ['group', 'cat', 'stage', 'field', 'region', 'fund', 'nogate'];
const BOOLS = ['women', 'verified', 'closed'];

export function fromParams(p) {
  const f = { ...DEFAULT };
  for (const k of LISTS) f[k] = p.get(k) ? p.get(k).split(',').filter(Boolean) : [];
  for (const k of BOOLS) f[k] = p.get(k) === '1';
  f.q = p.get('q') || '';
  f.when = p.get('when') || '';
  f.sort = p.get('sort') || 'deadline';
  f.view = p.get('view') === 'ledger' ? 'ledger' : 'cards';
  return f;
}
export function toParams(f) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  for (const k of LISTS) if (f[k].length) p.set(k, f[k].join(','));
  if (f.when) p.set('when', f.when);
  for (const k of BOOLS) if (f[k]) p.set(k, '1');
  if (f.sort && f.sort !== 'deadline') p.set('sort', f.sort);
  if (f.view && f.view !== 'cards') p.set('view', f.view);
  return p;
}
export function isEmpty(f) {
  return !f.q && !f.when && !f.women && !f.verified && LISTS.every((k) => !f[k].length);
}
export function activeCount(f) {
  return LISTS.reduce((n, k) => n + f[k].length, 0) + (f.q ? 1 : 0) + (f.when ? 1 : 0) + (f.women ? 1 : 0) + (f.verified ? 1 : 0);
}

function tokens(q) { return q.toLowerCase().split(/\s+/).filter(Boolean); }

function whenMatch(o, w) {
  switch (w) {
    case '30': return o.kind === 'exact' && o.days <= 30;
    case '90': return o.kind === 'exact' && o.days <= 90;
    case 'exact': return o.kind === 'exact';
    case 'approx': return o.kind === 'approx';
    case 'rolling': return o.kind === 'rolling';
    case 'next': return o.kind === 'next' || o.kind === 'watch';
    default: return true;
  }
}

/** Does opportunity `o` pass filter `f`? `skip` ignores one facet (for facet counts). */
export function matches(o, f, skip) {
  if (skip !== 'closed' && !f.closed && o.kind === 'closed') return false;
  if (skip !== 'q' && f.q) {
    const t = tokens(f.q);
    if (!t.every((w) => o.search.includes(w))) return false;
  }
  if (skip !== 'group' && f.group.length && !f.group.includes(o.group)) return false;
  if (skip !== 'cat' && f.cat.length && !f.cat.includes(o.category) && !(o.alsoIn || []).some((c) => f.cat.includes(c))) return false;
  if (skip !== 'stage' && f.stage.length && !f.stage.some((s) => o.stage.includes(s))) return false;
  if (skip !== 'field' && f.field.length && !(o.field.includes('any') || f.field.some((s) => o.field.includes(s)))) return false;
  if (skip !== 'region' && f.region.length && !f.region.some((r) => r === o.region || (r === 'remote' && o.format === 'remote'))) return false;
  if (skip !== 'fund' && f.fund.length && !f.fund.includes(o.funding)) return false;
  if (skip !== 'when' && f.when && !whenMatch(o, f.when)) return false;
  if (skip !== 'nogate' && f.nogate.length && f.nogate.some((g) => o.gates.includes(g))) return false;
  if (skip !== 'women' && f.women && !o.gates.includes('women-only')) return false;
  if (skip !== 'verified' && f.verified && o.unverified) return false;
  return true;
}

const KIND_ORDER = { exact: 0, approx: 1, rolling: 2, next: 3, watch: 4, closed: 5 };

function relevance(o, t) {
  let s = 0;
  const name = o.name.toLowerCase();
  for (const w of t) {
    if (name === w) s += 40;
    else if (name.startsWith(w)) s += 20;
    else if (name.includes(w)) s += 10;
    else s += 1;
  }
  return s;
}

export function sortItems(items, f) {
  if (f.sort === 'name') return items.sort((a, b) => a.name.localeCompare(b.name));
  if (f.sort === 'relevance' && f.q) {
    const t = tokens(f.q);
    return items.sort((a, b) => relevance(b, t) - relevance(a, t) || a.name.localeCompare(b.name));
  }
  return items.sort((a, b) => {
    const k = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (k) return k;
    if (a.date && b.date) return a.date - b.date;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function apply(items, f) {
  return sortItems(items.filter((o) => matches(o, f)), f);
}

/** For each facet value, how many items would match if that facet alone were changed. */
export function facetCounts(items, f, cats) {
  const facets = { group: GROUPS, cat: cats, stage: STAGES, field: FIELDS, region: REGIONS, fund: FUNDING, when: WHEN };
  const out = {};
  for (const key of Object.keys(facets)) {
    const counts = {};
    for (const [v] of facets[key]) counts[v] = 0;
    const pool = items.filter((o) => matches(o, f, key));
    for (const o of pool) {
      switch (key) {
        case 'group': counts[o.group]++; break;
        case 'cat': for (const c of new Set([o.category, ...(o.alsoIn || [])])) if (c in counts) counts[c]++; break;
        case 'stage': for (const s of o.stage) if (s in counts) counts[s]++; break;
        case 'field':
          if (o.field.includes('any')) for (const v of Object.keys(counts)) counts[v]++;
          else for (const s of o.field) if (s in counts) counts[s]++;
          break;
        case 'region': counts[o.region]++; if (o.format === 'remote' && o.region !== 'remote') counts.remote++; break;
        case 'fund': counts[o.funding]++; break;
        case 'when': for (const [w] of WHEN) if (whenMatch(o, w)) counts[w]++; break;
        default: break;
      }
    }
    out[key] = counts;
  }
  out.women = items.filter((o) => matches(o, f, 'women') && o.gates.includes('women-only')).length;
  out.verified = items.filter((o) => matches(o, f, 'verified') && !o.unverified).length;
  out.closed = items.filter((o) => matches(o, f, 'closed') && o.kind === 'closed').length;
  return out;
}
