// DB-02: aturan penilaian checkpoint murni.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file, mapping = {}) {
  const source = fs.readFileSync(file, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => mapping[id] ?? {}, mod, mod.exports);
  return mod.exports;
}
const { gradeCheckpoint } = load("src/lessons/checkpointResult.ts");
const answers = load("src/srs/answers.ts");
const { choiceMatches } = load("src/lessons/answerMatch.ts", { "../srs/answers": answers });

const objectives = [1, 2, 3, 4, 5].map((n) => ({
  id: `o${n}`, unit: 1, title: `Tujuan ${n}`, canDo: "", lessonNos: [], prerequisites: [],
  coverage: "covered", review: "not-reviewed", evidence: [], remedy: "",
}));
const policy = { unit: 1, itemsPerObjective: 3, perObjectiveMin: 2, pass: 70, poolPerObjective: 5 };
const items = [];
for (const objective of objectives) {
  for (let i = 1; i <= 3; i += 1) {
    items.push({ key: `${objective.id}-${i}`, objectiveId: objective.id });
  }
}
function answersFor(counts) {
  const result = [];
  counts.forEach((count, index) => {
    for (let i = 0; i < 3; i += 1) {
      result.push({ key: `${objectives[index].id}-${i + 1}`, correct: i < count });
    }
  });
  return result;
}

// Kasus wajib: 11/15 = 73%, tujuan [3,3,2,2,1] -> tujuan 5 gagal, total gagal.
const required = gradeCheckpoint(items, objectives, policy, answersFor([3, 3, 2, 2, 1]), 70);
assert.equal(required.score, 73);
assert.equal(required.correct, 11);
assert.equal(required.pass, false);
assert.deepEqual(required.objectiveResults.map((entry) => entry.correct), [3, 3, 2, 2, 1]);
assert.equal(required.objectiveResults[4].pass, false);
assert.equal(required.objectiveResults[0].pass, true);

// Jawaban lama/duplikat tidak boleh menambah hitungan (tidak ada 6/3).
const withDuplicates = answersFor([3, 3, 2, 2, 1]);
for (let i = 0; i < 5; i += 1) withDuplicates.push({ key: "o5-1", correct: true });
const duplicateResult = gradeCheckpoint(items, objectives, policy, withDuplicates, 70);
assert.equal(duplicateResult.score, 73);
assert.equal(duplicateResult.objectiveResults[4].correct, 1);
assert.equal(duplicateResult.objectiveResults[4].total, 3);

// Jawaban di luar rencana sesi ini diabaikan.
const withStale = answersFor([3, 3, 3, 3, 3]);
withStale.push({ key: "unit-lama-o5-9", correct: true });
const staleResult = gradeCheckpoint(items.slice(0, 12), objectives.slice(0, 4), policy, withStale, 70);
assert.equal(staleResult.total, 12);
assert.equal(staleResult.correct, 12);
assert.equal(staleResult.pass, true);

// Bank kurang: 2/2 tidak boleh lulus bila kebijakan menuntut 3 soal.
const shortItems = items.filter((item) => item.objectiveId !== "o5");
shortItems.push({ key: "o5-1", objectiveId: "o5" }, { key: "o5-2", objectiveId: "o5" });
const shortResult = gradeCheckpoint(shortItems, objectives, policy, answersFor([3, 3, 3, 3, 2]), 70);
assert.equal(shortResult.objectiveResults[4].total, 2);
assert.equal(shortResult.objectiveResults[4].pass, false);
assert.equal(shortResult.pass, false);

// Opsi: kunci persis, alternatif sah, pengecoh kapitalisasi salah.
assert.equal(choiceMatches("Musik", { answer: "Musik" }), true);
assert.equal(choiceMatches("musik", { answer: "Musik" }), false);
assert.equal(choiceMatches("  Musik  ", { answer: "Musik" }), true);
assert.equal(choiceMatches("die Musik", { answer: "Musik", altAnswers: ["die Musik"] }), true);
assert.equal(choiceMatches("Die Musik", { answer: "Musik", altAnswers: ["die Musik"] }), false);

console.log("DB-02 checkpoint: 73% [3,3,2,2,1] gagal, duplikat/stale diabaikan, bank kurang gagal, opsi exact.");
