import assert from 'node:assert/strict';
import {assessFamilyPossessive as p,assessCount as c,assessNewFamilyQuestion as q,assessNewFamilyDescription as d,assessFollow as f} from '../../src/arena/engine/chapterThree.ts';
for(const s of ['Mein Bruder, meine Schwester und meine Eltern.','Meine Eltern, mein Bruder und meine Schwester.'])assert(p(s,'task'),s);
for(const s of ['Mein Kind, meine Kinder und meine Tante.','Meine Tante, mein Kind, meine Kinder.'])assert(p(s,'new-task'),s);
for(const s of ['Mein Bruder, mein Schwester und meine Eltern.','Nicht mein Bruder, meine Schwester, meine Eltern.','Mein Bruder, meine Schwester oder meine Eltern.'])assert(!p(s,'task'),s);
for(const s of ['Mein Kind, mein Kinder und meine Tante.','Nicht mein Kind, meine Kinder und meine Tante.'])assert(!p(s,'new-task'),s);
for(const s of ['Sie hat zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder hat sie?','Zwei Geschwister, eine Schwester und einen Bruder. Wie viele Kinder sind da?'])assert(c(s,'task'),s);
for(const s of ['Zwei Geschwister, einen Bruder und eine Schwester.','Nicht zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder?','Drei Geschwister, zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder?'])assert(!c(s,'task'),s);
assert(c('Es sind drei Kinder.','new-task'));assert(!c('Drei oder zwei Kinder.','new-task'));assert(!c('Nicht drei Kinder.','new-task'));console.log('Bab 03: 17 pemeriksaan pola dan kontradiksi lulus');

assert(q('Wie viele Geschwister hat Lina?'));assert(!q('Wie viele Kinder hat Lina?'));assert(!q('Hat Lina nicht viele Geschwister?'));
assert.deepEqual(d('Sie hat zwei Geschwister, einen Bruder und eine Schwester.'),{count:true,relations:true});assert.deepEqual(d('Zwei Geschwister und einen Bruder.'),{count:true,relations:false});assert.deepEqual(d('Nicht zwei Geschwister, einen Bruder und eine Schwester.'),{count:false,relations:false});
for(const [kind,yes,no] of [
 ['status','Sie wohnen zusammen und sind verheiratet.','Sie wohnen zusammen.'],
 ['status-new','Sie wohnen zusammen und sind ledig.','Sie wohnen zusammen und sind verheiratet.'],
 ['status-divorced','Nora ist geschieden und wohnt allein.','Nora ist verheiratet und wohnt allein.'],
 ['visit','Ich besuche meinen Onkel.','Ich besuche mein Onkel.'],
 ['visit-question','Besuchst du deinen Onkel?','Besuchst du dein Onkel?'],
 ['owners','Mia ihr Bruder und Leon sein Bruder.','Mia sein Bruder und Leon ihr Bruder.'],
 ['visit-new','Mia besucht ihren Bruder.','Mia besucht ihr Bruder.'],
 ['independent-ask','Wie viele Kinder hat die Familie?','Wie viele Geschwister hat sie?'],
 ['independent-relations','Zwei Kinder, einen Sohn und eine Tochter.','Zwei Kinder, einen Sohn.'],
 ['independent-intro','Mein Bruder und meine Schwester.','Mein Bruder und mein Schwester.'],
 ['independent-status','Sie wohnen zusammen und sind verheiratet.','Sie wohnen zusammen und sind ledig.'],
 ['independent-visit','Mara besucht ihren Onkel.','Mara besucht ihren Bruder.'],
]){assert(f(yes,kind),`${kind}: ${yes}`);assert(!f(no,kind),`${kind}: ${no}`);}
assert(!f('Nicht verheiratet, aber sie wohnen zusammen und sind verheiratet.','status'));console.log('Bab 03 tambahan: 31 pemeriksaan pertanyaan, bukti terpisah dan kelanjutan lulus');
