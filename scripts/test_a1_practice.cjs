// Validasi data P4: dialog mendengar A1 + pertanyaan pemahaman, dan tugas
// menulis terpandu. Tidak menilai mutu bahasa; hanya struktur dan kelengkapan.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));

const listening = readJson("src/data/practice/a1_listening.json");
const writing = readJson("src/data/practice/a1_writing.json");
const audioManifest = readJson("src/assets/tts_core/manifest.json");
const normalize = (value) =>
  String(value).normalize("NFC").toLowerCase().replace(/ß/g, "ss").replace(/[.,!?.;:]/g, "").replace(/\s+/g, " ").trim();

assert.equal(listening.level, "A1");
assert.equal(writing.level, "A1");
assert.ok(Array.isArray(listening.items) && listening.items.length >= 5, "minimal 5 dialog");
assert.ok(Array.isArray(writing.tasks) && writing.tasks.length >= 5, "minimal 5 tugas menulis");

const listenIds = new Set();
const questionPrompts = new Set();
for (const item of listening.items) {
  assert.ok(item.id && !listenIds.has(item.id), `id dialog unik: ${item.id}`);
  listenIds.add(item.id);
  assert.ok(item.title.trim(), `${item.id} title`);
  assert.ok(item.context.trim(), `${item.id} context`);
  assert.ok(Array.isArray(item.lines) && item.lines.length >= 4, `${item.id} minimal 4 baris`);
  for (const line of item.lines) {
    assert.ok(line.speaker.trim(), `${item.id} speaker`);
    assert.ok(line.de.trim(), `${item.id} teks dialog`);
    const key = normalize(line.de);
    const file = audioManifest.phrases[key];
    assert.ok(file, `${item.id} audio offline untuk: ${line.de}`);
    assert.ok(
      fs.existsSync(path.join(root, "src/assets/tts_core", file)),
      `${item.id} file audio ada: ${file}`,
    );
  }
  assert.ok(Array.isArray(item.questions) && item.questions.length >= 2, `${item.id} minimal 2 pertanyaan`);
  for (const question of item.questions) {
    const promptKey = question.prompt.trim().toLowerCase();
    assert.ok(question.prompt.trim(), `${item.id} prompt pertanyaan`);
    assert.ok(!questionPrompts.has(promptKey), `${item.id} prompt pertanyaan duplikat: ${question.prompt}`);
    questionPrompts.add(promptKey);
    assert.ok(Array.isArray(question.options) && question.options.length >= 2, `${item.id} options`);
    assert.equal(new Set(question.options).size, question.options.length, `${item.id} options unik`);
    assert.ok(question.options.includes(question.answer), `${item.id} answer ada di options`);
    assert.ok(question.explanation.trim(), `${item.id} explanation`);
  }
}

const writingIds = new Set();
const writingTitles = new Set();
for (const task of writing.tasks) {
  assert.ok(task.id && !writingIds.has(task.id), `id tugas unik: ${task.id}`);
  writingIds.add(task.id);
  assert.ok(task.title.trim() && !writingTitles.has(task.title.trim()), `${task.id} title unik`);
  writingTitles.add(task.title.trim());
  assert.ok(task.situation.trim(), `${task.id} situation`);
  assert.ok(Array.isArray(task.mustInclude) && task.mustInclude.length >= 3, `${task.id} unsur wajib`);
  assert.ok(task.model.trim(), `${task.id} model`);
  assert.ok(task.model.trim().split(/\s+/).length >= 10, `${task.id} model minimal 10 kata`);
  assert.ok(Array.isArray(task.checklist) && task.checklist.length >= 3, `${task.id} checklist`);
  for (const item of task.mustInclude) assert.ok(item.trim(), `${task.id} unsur wajib kosong`);
  for (const item of task.checklist) assert.ok(item.trim(), `${task.id} checklist kosong`);
}

console.log(
  `P4 A1 practice OK: ${listening.items.length} dialog mendengar ` +
    `(${listening.items.reduce((n, item) => n + item.questions.length, 0)} pertanyaan) dan ` +
    `${writing.tasks.length} tugas menulis terpandu.`,
);
