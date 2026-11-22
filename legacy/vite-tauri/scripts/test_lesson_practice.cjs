// Verify that every lesson and checkpoint can use its own examples.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const path = require("node:path");
const compile = (rel) => {
  const file = path.resolve(__dirname, "..", rel);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  return { file, output };
};
const optionOrder = compile("src/lessons/optionOrder.ts");
const optionOrderMod = { exports: {} };
new Function("require", "module", "exports", optionOrder.output)(require, optionOrderMod, optionOrderMod.exports);

const practice = compile("src/lessons/practice.ts");
const { createRequire } = require("node:module");
const practiceRequire = createRequire(practice.file);
const mod = { exports: {} };
new Function("require", "module", "exports", practice.output)(
  (id) => (id === "./optionOrder" ? optionOrderMod.exports : practiceRequire(id)),
  mod,
  mod.exports,
);

let count = 0;
for (const level of ["a1", "a2", "b1", "b2"]) {
  const { units } = JSON.parse(fs.readFileSync(`src/data/lessons/units_${level}.json`, "utf8"));
  for (const unit of units) {
    let questionsInUnit = 0;
    for (const lesson of unit.lessons) {
      const questions = mod.exports.lessonExamples(lesson);
      assert.ok(questions.length > 0, `${level} ${unit.unit}/${lesson.no} has no practice`);
      questionsInUnit += questions.length;
      for (const q of questions) {
        assert.ok(lesson.slides.some(s => s.example_de === q.prompt && s.example_id === q.answer));
        assert.ok(q.options.includes(q.answer));
        assert.equal(new Set(q.options).size, q.options.length);
        assert.ok(q.options.length >= 2);
        assert.equal(q.lessonExample, true);
      }
      count++;
    }
    assert.ok(questionsInUnit >= 2, `${level} ${unit.unit} has too few checkpoint questions`);
  }
}

// NILAI-02: 17 pelajaran A1 dengan drill D4-D10 wajib punya latihan
// penerapan baru, terhubung tujuan, dan tidak menyalin contoh slide.
const { mulberry32, answerPosition } = optionOrderMod.exports;
const normalize = (value) => String(value).trim().toLowerCase().replace(/\s+/g, " ");
const unitsA1 = JSON.parse(fs.readFileSync("src/data/lessons/units_a1.json", "utf8")).units;
const objectivesA1 = JSON.parse(fs.readFileSync("src/data/lessons/a1_objectives.json", "utf8")).objectives;
const practiceData = JSON.parse(fs.readFileSync("src/data/lessons/a1_lesson_practice.json", "utf8"));

// Keselarasan struktur 12 unit / 36 pelajaran A1.
assert.equal(unitsA1.length, 12, "A1 must have 12 units");
let a1LessonCount = 0;
for (const unit of unitsA1) {
  assert.equal(unit.lessons.length, 3, `unit ${unit.unit} must have 3 lessons`);
  assert.ok(Array.isArray(unit.goals) && unit.goals.length >= 2, `unit ${unit.unit} goals`);
  assert.equal(unit.checkpoint.count, 15, `unit ${unit.unit} checkpoint count`);
  assert.equal(unit.checkpoint.pass, 70, `unit ${unit.unit} checkpoint pass`);
  const bank = JSON.parse(fs.readFileSync(`src/data/lessons/a1_unit${unit.unit}_bank.json`, "utf8"));
  const bankCodes = [...new Set(bank.items.map((item) => item.code))].sort();
  assert.deepEqual([...unit.checkpoint.codes].sort(), bankCodes, `unit ${unit.unit} checkpoint codes match bank`);
  for (const lesson of unit.lessons) {
    a1LessonCount += 1;
    assert.ok(lesson.recap.length >= 2, `${unit.unit}/${lesson.no} recap`);
    assert.ok(lesson.slides.length >= 3, `${unit.unit}/${lesson.no} slides`);
    assert.ok(lesson.vocab.length >= 3, `${unit.unit}/${lesson.no} vocab`);
    assert.ok(lesson.drill.count >= 2, `${unit.unit}/${lesson.no} drill count`);
    for (const slide of lesson.slides) {
      assert.ok(slide.title.trim(), `${unit.unit}/${lesson.no} slide title`);
      assert.ok(Array.isArray(slide.body) && slide.body.length >= 2, `${unit.unit}/${lesson.no} slide body`);
      assert.ok(slide.example_de && slide.example_id, `${unit.unit}/${lesson.no} slide example`);
    }
  }
}
assert.equal(a1LessonCount, 36, "A1 must have 36 lessons");

let applicationLessons = 0;
let applicationItemCount = 0;
for (const unit of unitsA1) {
  for (const lesson of unit.lessons) {
    const isVocabularyDrill = ["D1", "D2", "D3"].includes(lesson.drill.code);
    const items = mod.exports.lessonApplicationItems(unit.unit, lesson.no, mulberry32(42));
    if (isVocabularyDrill) {
      assert.equal(items.length, 0, `${unit.unit}/${lesson.no} vocabulary drill uses its own bank`);
      continue;
    }
    applicationLessons += 1;
    applicationItemCount += items.length;
    assert.ok(items.length >= 2, `${unit.unit}/${lesson.no} needs at least 2 application items`);

    const exampleSentences = new Set(
      lesson.slides.filter((slide) => slide.example_de).map((slide) => normalize(slide.example_de)),
    );
    for (const item of items) {
      assert.ok(item.key.startsWith(`A1LP:${unit.unit}:${lesson.no}:`), `${item.key} key`);
      assert.equal(item.lessonApplication, true, `${item.key} marker`);
      assert.ok(item.prompt.trim() && item.sub.trim() && item.explanation.trim(), `${item.key} text`);
      assert.ok(
        objectivesA1.some(
          (objective) =>
            objective.id === item.objectiveId &&
            objective.unit === unit.unit &&
            objective.lessonNos.includes(lesson.no),
        ),
        `${item.key} objective ${item.objectiveId} belongs to ${unit.unit}/${lesson.no}`,
      );
      assert.ok(!exampleSentences.has(normalize(item.prompt)), `${item.key} prompt must not copy an example`);
      if (item.mode === "choice") {
        assert.ok(Array.isArray(item.options) && item.options.length >= 3, `${item.key} options`);
        assert.equal(new Set(item.options).size, item.options.length, `${item.key} unique options`);
        assert.ok(item.options.includes(item.answer), `${item.key} answer in options`);
        assert.ok(item.wrongFeedback, `${item.key} wrongFeedback`);
        for (const option of item.options) {
          if (option === item.answer) continue;
          assert.ok(item.wrongFeedback[option], `${item.key} feedback for ${option}`);
        }
      } else {
        assert.ok(!exampleSentences.has(normalize(item.answer)), `${item.key} production answer must be new`);
        assert.ok(item.hintOnWrong, `${item.key} hintOnWrong`);
        if (item.mode === "order") {
          assert.deepEqual(
            [...item.tokens].sort(),
            [...item.answer.split(/\s+/)].sort(),
            `${item.key} tokens build answer`,
          );
          assert.notEqual(item.tokens.join(" "), item.answer, `${item.key} tokens must be shuffled`);
        }
      }
    }

    const again = mod.exports.lessonApplicationItems(unit.unit, lesson.no, mulberry32(42));
    assert.deepEqual(again, items, `${unit.unit}/${lesson.no} stable with same seed`);

    const positions = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      for (const item of mod.exports.lessonApplicationItems(unit.unit, lesson.no, mulberry32(seed))) {
        if (item.mode === "choice") positions.add(answerPosition(item.options, item.answer));
      }
    }
    if (items.some((item) => item.mode === "choice")) {
      assert.ok(positions.size >= 2, `${unit.unit}/${lesson.no} option position must vary`);
    }
  }
}
assert.equal(applicationLessons, 17, "17 A1 lessons need application practice");
assert.equal(applicationItemCount, practiceData.items.length, "all application items are reachable");

// Fallback: pelajaran D1-D3 tetap memakai pemahaman contoh.
const vocabLesson = unitsA1[0].lessons[0];
const fallback = mod.exports.lessonPracticeItems(unitsA1[0].unit, vocabLesson, mulberry32(1));
assert.ok(fallback.length > 0 && fallback.every((item) => item.lessonExample === true));
const applicationLesson = unitsA1[1].lessons[2];
const applied = mod.exports.lessonPracticeItems(unitsA1[1].unit, applicationLesson, mulberry32(1));
assert.ok(applied.length > 0 && applied.every((item) => item.lessonApplication === true));

console.log(
  `${count} A1–B2 lessons have valid practice from their own examples.\n` +
    `${applicationLessons} A1 lessons use ${applicationItemCount} application items ` +
    "(new prompts, objective-linked, shuffled options, specific feedback).",
);
