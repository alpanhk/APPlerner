// Validasi data F8 uji tiruan A1: empat komponen, referensi dialog Hören,
// item Lesen, tugas Schreiben, dan prompt Sprechen.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));

const mock = readJson("src/data/practice/a1_mock_exam.json");
const listening = readJson("src/data/practice/a1_listening.json");
const dialogues = new Map(listening.items.map((item) => [item.id, item]));

assert.equal(mock.level, "A1");
assert.ok(Array.isArray(mock.sections), "sections");
assert.equal(mock.sections.length, 4, "empat komponen");

const expected = ["hoeren", "lesen", "schreiben", "sprechen"];
assert.deepEqual(mock.sections.map((section) => section.id), expected);

let objectiveItems = 0;
for (const section of mock.sections) {
  assert.ok(section.title.trim(), `${section.id} title`);
  assert.ok(Number.isInteger(section.minutes) && section.minutes > 0, `${section.id} minutes`);

  if (section.kind === "listening") {
    assert.ok(Array.isArray(section.items) && section.items.length >= 5, "Hören minimal 5 item");
    for (const ref of section.items) {
      const dialogue = dialogues.get(ref.dialogueId);
      assert.ok(dialogue, `dialog Hören ada: ${ref.dialogueId}`);
      assert.ok(
        Number.isInteger(ref.questionIndex) && dialogue.questions[ref.questionIndex],
        `pertanyaan Hören ada: ${ref.dialogueId}#${ref.questionIndex}`,
      );
      objectiveItems += 1;
    }
  }

  if (section.kind === "reading") {
    assert.ok(Array.isArray(section.items) && section.items.length >= 5, "Lesen minimal 5 item");
    for (const item of section.items) {
      assert.ok(item.text.trim(), "teks Lesen");
      assert.ok(item.prompt.trim(), "pertanyaan Lesen");
      assert.ok(Array.isArray(item.options) && item.options.length >= 2, "opsi Lesen");
      assert.equal(new Set(item.options).size, item.options.length, "opsi Lesen unik");
      assert.ok(item.options.includes(item.answer), "kunci Lesen ada di opsi");
      assert.ok(item.explanation.trim(), "penjelasan Lesen");
      objectiveItems += 1;
    }
  }

  if (section.kind === "writing") {
    const task = section.task;
    assert.ok(task, "tugas Schreiben ada");
    assert.ok(task.situation.trim(), "situasi Schreiben");
    assert.ok(Array.isArray(task.mustInclude) && task.mustInclude.length >= 3, "unsur wajib Schreiben");
    assert.ok(task.model.trim(), "model Schreiben");
    assert.ok(Array.isArray(task.checklist) && task.checklist.length >= 3, "checklist Schreiben");
  }

  if (section.kind === "speaking") {
    assert.ok(Array.isArray(section.prompts) && section.prompts.length >= 2, "prompt Sprechen");
    for (const prompt of section.prompts) {
      assert.ok(prompt.prompt.trim(), "pertanyaan Sprechen");
      assert.ok(prompt.model.trim(), "model Sprechen");
      assert.ok(Array.isArray(prompt.checklist) && prompt.checklist.length >= 3, "checklist Sprechen");
    }
  }
}

assert.ok(objectiveItems >= 10, "minimal 10 item objektif Hören+Lesen");

console.log(
  `F8 A1 mock exam OK: 4 komponen, ${objectiveItems} item objektif, 1 tugas menulis, ` +
    `${mock.sections.find((section) => section.kind === "speaking").prompts.length} prompt bicara.`,
);
