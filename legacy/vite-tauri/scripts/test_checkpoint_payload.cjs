// HARDENING-07: parser payload checkpoint. Bentuk lama/rusak tidak boleh
// melempar saat CheckpointRunner membaca items/index/result/remedial.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}
const drillMod = { exports: {} };
new Function("require", "module", "exports", transpile("src/lessons/drillDraft.ts"))(
  () => ({}), drillMod, drillMod.exports,
);
const payloadMod = { exports: {} };
new Function("require", "module", "exports", transpile("src/lessons/checkpointPayload.ts"))(
  (id) => id.includes("drillDraft") ? drillMod.exports : {}, payloadMod, payloadMod.exports,
);
const { parseCheckpointSessionValue, parseStoredAttemptDraft } = payloadMod.exports;
const { parseDrillDraft } = drillMod.exports;

const item = (n, mode = "choice") => ({
  key: `A1:4:u4-o1-${String(n).padStart(2, "0")}`,
  prompt: `Soal ${n}?`,
  sub: "Pilih.",
  mode,
  options: mode === "choice" ? ["a", "b"] : undefined,
  tokens: mode === "order" ? ["ich", "bin"] : undefined,
  answer: mode === "order" ? "ich bin" : "a",
  explanation: "Karena aturan.",
  objectiveId: "a1-u4-o1",
  code: "D1",
});
const items = [item(1), item(2, "type")];
const draft = (over = {}) => ({ items, index: 0, correct: null, correctCount: 0, ...over });
const session = (over = {}) => ({
  unitNo: 4,
  items,
  answers: [],
  index: 0,
  correct: null,
  correctCount: 0,
  result: null,
  saved: false,
  remedial: null,
  remedialDone: null,
  remedialDraft: null,
  remedialSessionId: null,
  ...over,
});

const valid = parseCheckpointSessionValue(session());
assert.equal(valid.invalid, false);
assert.equal(valid.recovered, false);
assert.equal(valid.value.items.length, 2);

const missingItems = parseCheckpointSessionValue(session({ items: undefined }));
assert.equal(missingItems.invalid, true, "items hilang harus invalid");
assert.equal(missingItems.value, null);

assert.equal(parseCheckpointSessionValue(session({ items: [] })).invalid, true, "items kosong invalid");
const brokenItem = { ...item(3), prompt: 42 };
assert.equal(parseCheckpointSessionValue(session({ items: [brokenItem] })).invalid, true, "item rusak invalid");
assert.equal(parseCheckpointSessionValue(session({ items: [item(1), item(1)] })).invalid, true, "key duplikat invalid");

const badIndex = parseCheckpointSessionValue(session({ index: 99 }));
assert.equal(badIndex.invalid, false, "index di luar batas dipulihkan");
assert.equal(badIndex.recovered, true);
assert.equal(badIndex.value.index, 1);

const answers = parseCheckpointSessionValue(session({
  answers: [
    { key: items[0].key, correct: true },
    { key: items[0].key, correct: false },
    { key: "A1:4:tidak-ada", correct: true },
    { key: items[1].key, correct: "ya" },
  ],
}));
assert.equal(answers.invalid, false);
assert.equal(answers.recovered, true);
assert.deepEqual(answers.value.answers, [{ key: items[0].key, correct: true }]);

const badResult = parseCheckpointSessionValue(session({
  result: { correct: 1, total: 2, score: 50, pass: false, objectiveResults: "rusak" },
}));
assert.equal(badResult.invalid, false, "result rusak dinormalisasi");
assert.equal(badResult.recovered, true);
assert.equal(badResult.value.result, null);

const goodResult = parseCheckpointSessionValue(session({
  result: {
    correct: 1, total: 2, score: 50, pass: false,
    objectiveResults: [{
      objective: { id: "a1-u4-o1", title: "Tujuan", remedy: "Ulangi" },
      correct: 1, total: 2, pass: false, missed: [items[1]],
    }],
  },
}));
assert.equal(goodResult.value.result.objectiveResults.length, 1, "hasil sah dipertahankan");

const badRemedialDraft = parseCheckpointSessionValue(session({
  remedial: items,
  remedialDraft: draft({ index: 99 }),
}));
assert.equal(badRemedialDraft.invalid, false);
assert.equal(badRemedialDraft.recovered, true);
assert.equal(badRemedialDraft.value.remedialDraft, null);

const validDraft = parseDrillDraft(JSON.stringify(draft()));
assert.equal(validDraft.index, 0);
const envelope = {
  version: 1,
  key: "checkpoint_attempt:4",
  sessionId: "sid-lama",
  revision: 3,
  updatedAt: "2026-11-18T00:00:00Z",
  data: draft(),
};
const recovered = parseStoredAttemptDraft(JSON.stringify(envelope));
assert.equal(recovered.invalid, false);
assert.equal(recovered.recovered, true);
assert.equal(recovered.value.sessionId, "sid-lama");
assert.equal(recovered.value.items.length, 2);

const badPosition = parseStoredAttemptDraft(JSON.stringify(draft({ index: 99 })));
assert.equal(badPosition.invalid, true);
assert.equal(badPosition.value, null);

const noItems = parseStoredAttemptDraft(JSON.stringify({ items: null, index: 0 }));
assert.equal(noItems.invalid, true);
assert.equal(parseStoredAttemptDraft("{").invalid, true, "JSON rusak invalid");
assert.equal(parseStoredAttemptDraft(null).invalid, false, "tidak ada draft bukan invalid");

console.log("CheckpointPayload: sesi/draft valid dipakai; items hilang/posisi rusak ditolak; envelope lama dipulihkan; result/answers/remedial dinormalisasi.");
