import assert from 'node:assert/strict';
import {assessPlatformMessage as check} from '../../src/arena/engine/message.ts';
const cases=[
 ['Mia, der Zug fährt von Gleis 5 ab.','correct'],
 ['Von Gleis fünf fährt der Zug, Mia.','correct'],
 ['Mia, nicht von Gleis 2, sondern von Gleis 5!','correct'],
 ['Gleis 2 und Gleis 5, Mia.','ambiguous'],
 ['Mia, von Gleis 2 oder von Gleis 5?','ambiguous'],
 ['Mia, geh zu Gleis 2.','wrong'],
 ['Mia, der Zug fährt von Gleis 4.','wrong'],
 ['Mia, Gleis 5.','ambiguous'],
 ['Nicht von Gleis 5, sondern von Gleis 2.','wrong'],
];
for(const [text,expected] of cases) assert.equal(check(text,5).status,expected,text);
assert.equal(check('Der Zug fährt von Gleis vier ab.',4).status,'correct');
console.log(`Nachrichtenprüfung: ${cases.length+1} Fälle bestanden`);
