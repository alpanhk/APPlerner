import assert from 'node:assert/strict';
import {assessMessage as a, assessTransferQuestion as q} from '../../src/arena/engine/chapterTwo.ts';
for (const t of ['Am Samstag um halb neun.','Um 08:30 am Samstag, Mia.','Um halb neun am Samstag.','Mia, Samstag um 8 Uhr 30.']) assert(a(t).correct,t);
let r=a('Am Samstag um 09:30');assert(r.day&&!r.time&&r.reason.includes('hanya jam'));
assert(!a('Am Freitag um halb neun').correct);assert(!a('Nicht am Samstag um halb neun').correct);assert(!a('Am Samstag um 08:30 oder 09:30').correct);assert(!a('Am Freitag oder Samstag um halb neun').correct);assert(!a('Am Samstag um halb neun oder zehn Uhr').correct);
assert(q('Wie viel kostet das und wann ist die Abholung?'));assert(!q('Wie viel kostet das?'));
console.log('Bab 02: 12 pemeriksaan pesan/transfer lulus');
