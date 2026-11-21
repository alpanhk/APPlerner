import assert from 'node:assert/strict';
import {assessFamilyPossessive as p,assessCount as c} from '../../src/arena/engine/chapterThree.ts';
for(const s of ['Mein Bruder, meine Schwester und meine Eltern.','Meine Eltern, mein Bruder und meine Schwester.'])assert(p(s,'task'),s);
for(const s of ['Mein Kind, meine Kinder und meine Tante.','Meine Tante, mein Kind, meine Kinder.'])assert(p(s,'new-task'),s);
for(const s of ['Mein Bruder, mein Schwester und meine Eltern.','Nicht mein Bruder, meine Schwester, meine Eltern.','Mein Bruder, meine Schwester oder meine Eltern.'])assert(!p(s,'task'),s);
for(const s of ['Mein Kind, mein Kinder und meine Tante.','Nicht mein Kind, meine Kinder und meine Tante.'])assert(!p(s,'new-task'),s);
for(const s of ['Sie hat zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder hat sie?','Zwei Geschwister, eine Schwester und einen Bruder. Wie viele Kinder sind da?'])assert(c(s,'task'),s);
for(const s of ['Zwei Geschwister, einen Bruder und eine Schwester.','Nicht zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder?','Drei Geschwister, zwei Geschwister, einen Bruder und eine Schwester. Wie viele Kinder?'])assert(!c(s,'task'),s);
assert(c('Es sind drei Kinder.','new-task'));assert(!c('Drei oder zwei Kinder.','new-task'));assert(!c('Nicht drei Kinder.','new-task'));console.log('Bab 03: 17 pemeriksaan pola dan kontradiksi lulus');
