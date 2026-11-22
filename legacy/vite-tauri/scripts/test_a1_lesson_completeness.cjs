// P1 kelengkapan 36 pelajaran A1 + audit contoh/plural kosakata A1.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
const units = readJson("src/data/lessons/units_a1.json").units;
const objectives = readJson("src/data/lessons/a1_objectives.json").objectives;
const seedFiles = fs.readdirSync(path.join(root, "src/data/seed")).filter((f) => /^words_.*\.json$/.test(f));
const words = [];
for (const file of seedFiles) {
  const data = readJson(`src/data/seed/${file}`);
  for (const word of data.words) words.push({ ...word, _file: file, _level: data.level });
}

assert.equal(units.length, 12, "12 unit A1");
let lessonCount = 0;
for (const unit of units) {
  for (const lesson of unit.lessons) {
    lessonCount += 1;
    assert.ok(lesson.recap.length >= 2, `${unit.unit}/${lesson.no} recap`);
    assert.ok(lesson.slides.length >= 3, `${unit.unit}/${lesson.no} slides`);
    assert.ok(lesson.vocab.length >= 3, `${unit.unit}/${lesson.no} vocab`);
    for (const slide of lesson.slides) {
      assert.ok(slide.title && slide.body.length >= 2, `${unit.unit}/${lesson.no} slide body`);
      assert.ok(slide.example_de && slide.example_id, `${unit.unit}/${lesson.no} example/translation`);
    }
    const lastBody = lesson.slides[lesson.slides.length - 1].body;
    const note = lastBody.find((line) => String(line).startsWith("Prasyarat:"));
    assert.ok(note, `${unit.unit}/${lesson.no} prasyarat note`);
    assert.ok(note.includes("Kesalahan umum:"), `${unit.unit}/${lesson.no} common error`);
    assert.ok(note.includes("Ringkasan:"), `${unit.unit}/${lesson.no} summary`);
    const prereqPart = note.split("Kesalahan umum:")[0];
    for (const ref of prereqPart.matchAll(/Pelajaran (\d+)(?:\u2013(\d+))?/g)) {
      const highest = Number(ref[2] || ref[1]);
      assert.ok(
        highest < lesson.no,
        `${unit.unit}/${lesson.no} prasyarat must not reference current/future lesson ${ref[0]}`,
      );
    }
    assert.ok(
      objectives.some((o) => o.unit === unit.unit && o.lessonNos.includes(lesson.no)),
      `${unit.unit}/${lesson.no} objective link`,
    );
  }
}
assert.equal(lessonCount, 36, "36 pelajaran A1");

const a1Words = words.filter((w) => w._level === "A1");
const a1Unique = new Set(a1Words.map((w) => w.de));
const missingExample = a1Words.filter((w) => !w.example_de || !w.example_id);
const a1Nouns = a1Words.filter((w) => w.kind === "noun");
const a1NounsNoPlural = a1Nouns.filter((w) => !w.plural);
const massNouns = new Set(["Milch", "Wasser", "Obst", "Fleisch", "Reis"]);
assert.equal(a1Words.length, 221, "A1 seed rows");
assert.equal(a1Unique.size, 221, "A1 unique words");
assert.equal(a1Nouns.length, 193, "A1 noun rows");
assert.equal(missingExample.length, 0, "A1 example coverage 221/221");
assert.deepEqual(
  a1NounsNoPlural.map((w) => w.de).sort(),
  [...massNouns].sort(),
  "A1 nouns without plural are documented mass nouns",
);

let lessonVocab = 0;
for (const unit of units) {
  for (const lesson of unit.lessons) {
    for (const de of lesson.vocab) {
      lessonVocab += 1;
      const word = words.find((w) => w.de === de);
      assert.ok(word, `lesson vocab ${de} exists in seed`);
      assert.ok(word.example_de && word.example_id, `lesson vocab ${de} has example`);
    }
  }
}

console.log(
  `A1 lesson completeness OK: ${lessonCount} pelajaran memiliki prasyarat/kesalahan umum/ringkasan; ` +
    `A1 seed ${a1Words.length} kata, contoh ${a1Words.length - missingExample.length}/${a1Words.length}, ` +
    `plural ${a1Nouns.length - a1NounsNoPlural.length}/${a1Nouns.length} (5 kata massal tanpa plural dicatat); ` +
    `${lessonVocab} referensi kosakata pelajaran memiliki contoh.`,
);
