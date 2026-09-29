// Run: node site/js/filters.test.mjs   (no framework; exits non-zero on failure)
import * as F from './filters.js';

const mk = (o) => ({ name: 'x', search: 'x', group: 'internship', category: 'tech', stage: ['ug'], field: ['cs'], region: 'india', format: 'in-person',
  funding: 'stipend', gates: [], unverified: false, kind: 'exact', days: 10, date: new Date(2026, 9, 10), ...o });
const items = [
  mk({ name: 'A google step', search: 'a google step', stage: ['ug'], field: ['cs'], days: 5, date: new Date(2026, 9, 5) }),
  mk({ name: 'B phys', search: 'b phys', stage: ['pg', 'phd'], field: ['physics'], region: 'europe', kind: 'approx', days: 90, date: new Date(2026, 11, 20) }),
  mk({ name: 'C any', search: 'c any', stage: ['hs', 'ug'], field: ['any'], kind: 'rolling', days: null, date: null, gates: ['women-only'] }),
  mk({ name: 'D closed', search: 'd closed', kind: 'closed', days: -3, date: new Date(2026, 8, 26), unverified: true }),
  mk({ name: 'E remote', search: 'e remote', region: 'global', format: 'remote', kind: 'next', days: null, date: null, gates: ['nomination'] }),
];
let fails = 0;
const eq = (label, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) { fails++; console.log(`FAIL ${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); } else console.log(`ok   ${label}`); };
const names = (f) => F.apply(items, { ...F.DEFAULT, ...f }).map((o) => o.name[0]);

eq('default hides closed, sorts exact→approx→rolling→next', names({}), ['A', 'B', 'C', 'E']);
eq('closed included when asked', names({ closed: true }), ['A', 'B', 'C', 'E', 'D']);
eq('stage OR', names({ stage: ['hs', 'phd'] }), ['B', 'C']);
eq('field any matches everything; physics matches B', names({ field: ['physics'] }), ['B', 'C']);
eq('region remote matches format remote', names({ region: ['remote'] }), ['E']);
eq('when 30 = exact within 30 days', names({ when: '30' }), ['A']);
eq('when rolling', names({ when: 'rolling' }), ['C']);
eq('when next', names({ when: 'next' }), ['E']);
eq('women only', names({ women: true }), ['C']);
eq('hide nomination', names({ nogate: ['nomination'] }), ['A', 'B', 'C']);
eq('verified only (D is unverified and closed)', names({ verified: true, closed: true }), ['A', 'B', 'C', 'E']);
eq('search tokens', names({ q: 'google step' }), ['A']);
eq('sort name', names({ sort: 'name' }), ['A', 'B', 'C', 'E']);
const counts = F.facetCounts(items, { ...F.DEFAULT, stage: ['phd'] }, [['tech', 'Tech']]);
eq('facet counts ignore own facet (stage)', counts.stage, { hs: 1, ug: 3, pg: 1, phd: 1, grad: 0 });
eq('facet counts respect other facets (region given stage=phd)', counts.region.europe, 1);
const counts0 = F.facetCounts(items, { ...F.DEFAULT }, [['tech', 'Tech']]);
eq('field counts: any adds to every field', [counts0.field.law, counts0.field.physics], [1, 2]);
const p = F.toParams({ ...F.DEFAULT, q: 'x', stage: ['ug', 'pg'], when: '30', women: true, sort: 'name', view: 'ledger' });
eq('params round trip', F.fromParams(p), { ...F.DEFAULT, q: 'x', stage: ['ug', 'pg'], when: '30', women: true, sort: 'name', view: 'ledger' });
eq('activeCount counts each selected value', F.activeCount(F.fromParams(p)), 5);
// A program kept in one file and cross-referenced from another shows once, under both categories.
const withAlso = [...items, mk({ name: 'F thiel', search: 'f thiel', category: 'study-abroad', alsoIn: ['startup'], kind: 'rolling', days: null, date: null })];
const catNames = (cat) => F.apply(withAlso, { ...F.DEFAULT, cat }).map((o) => o.name[0]);
eq('cross-referenced entry matches its second category', catNames(['startup']), ['F']);
eq('and still matches its own category', catNames(['study-abroad']), ['F']);
eq('and appears once when both are picked', catNames(['startup', 'study-abroad']), ['F']);
const catCounts = F.facetCounts(withAlso, { ...F.DEFAULT }, [['tech', 'Tech'], ['study-abroad', 'Study abroad'], ['startup', 'Startups']]).cat;
eq('category counts include cross-referenced entries', [catCounts['study-abroad'], catCounts.startup, catCounts.tech], [1, 1, 4]);
if (fails) { console.log(`${fails} failing`); process.exit(1); } else console.log('all filter tests passed');
