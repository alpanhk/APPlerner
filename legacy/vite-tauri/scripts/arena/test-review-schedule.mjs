import assert from 'node:assert/strict';
import {reviewDueAt,reviewAvailable,REVIEW_INTERVALS} from '../../src/arena/engine/reviewSchedule.ts';
const start=new Date(2026,0,1,12,30).getTime();
for (const days of REVIEW_INTERVALS) {const due=reviewDueAt(start,days);assert.equal(reviewAvailable(start,days,due-1),false);assert.equal(reviewAvailable(start,days,due),true);assert.equal(reviewAvailable(start,days,due+86400000),true);}
assert.equal(reviewAvailable(start,3,NaN),false);
console.log('Jadwal 3/7/21: batas sebelum/tepat/terlambat lulus (jam simulasi)');
