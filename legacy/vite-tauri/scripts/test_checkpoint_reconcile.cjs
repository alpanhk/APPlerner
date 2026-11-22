// Regresi WINDOWS-REVIEW-20261117-03: draft tampilan harus mengikuti attempt
// yang sudah COMMIT, bukan state sesi yang tertinggal.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/lessons/checkpointReconcile.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", code)(() => ({}), mod, mod.exports);
const { reconcileDraft, chooseDraftIndex, canUseAttemptDraft } = mod.exports;

const items = [
  { key: "A1:1:o1-1", prompt: "", answer: "", explanation: "", mode: "choice", code: "D1", sub: "" },
  { key: "A1:1:o1-2", prompt: "", answer: "", explanation: "", mode: "choice", code: "D1", sub: "" },
  { key: "A1:1:o2-1", prompt: "", answer: "", explanation: "", mode: "choice", code: "D1", sub: "" },
];

// Simulasi: attempt item 1 sudah commit salah, snapshot sesi masih correct=null.
const stale = { items, index: 0, correct: null, correctCount: 0 };
const reconciled = reconcileDraft(stale, new Map([["A1:1:o1-1", false]]), items);
assert.equal(reconciled.correct, false, "verdict committed harus dipulihkan");
assert.equal(reconciled.correctCount, 0);
assert.equal(reconciled.index, 0, "posisi item tetap");

// Attempt benar.
const trueDraft = reconcileDraft(stale, new Map([["A1:1:o1-1", true]]), items);
assert.equal(trueDraft.correct, true);
assert.equal(trueDraft.correctCount, 1);

// Draft mengaku benar tetapi tidak ada attempt committed: jangan tampilkan verdict palsu.
const fake = { items, index: 0, correct: true, correctCount: 1 };
const cleared = reconcileDraft(fake, new Map(), items);
assert.equal(cleared.correct, null, "verdict tanpa attempt harus dibuang");
assert.equal(cleared.correctCount, 0);

// Item berikutnya tidak terpengaruh attempt item lain.
const next = { items, index: 2, correct: null, correctCount: 0 };
const nextDraft = reconcileDraft(next, new Map([["A1:1:o1-1", true]]), items);
assert.equal(nextDraft.correct, null);
assert.equal(nextDraft.correctCount, 1);

assert.equal(chooseDraftIndex(1, 0, 3), 1, "snapshot yang sudah maju tidak boleh mundur ke draft attempt");
assert.equal(chooseDraftIndex(0, 1, 3), 1);
assert.equal(chooseDraftIndex(2, 2, 3), 2);
assert.equal(canUseAttemptDraft("sid", "sid"), true);
assert.equal(canUseAttemptDraft(undefined, "sid"), false, "draft lama tanpa sessionId tidak boleh menggeser posisi");
assert.equal(canUseAttemptDraft("old", "sid"), false);

console.log("Checkpoint reconcile: committed attempt menang, stale/verdict palsu dibuang, posisi snapshot tidak mundur.");

// Ledger SQLite: retry jawaban benar setelah attempt salah tidak mengubah verdict
// dan tidak menggandakan baris.
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE attempts(id INTEGER PRIMARY KEY, session_id TEXT, item_key TEXT, correct INTEGER, UNIQUE(session_id,item_key))");
const insert = db.prepare("INSERT OR IGNORE INTO attempts(session_id,item_key,correct) VALUES(?,?,?)");
insert.run("sid-1", "A1:1:o1-1", 0);
insert.run("sid-1", "A1:1:o1-1", 1);
const rows = db.prepare("SELECT correct FROM attempts WHERE session_id='sid-1' AND item_key='A1:1:o1-1'").all();
assert.equal(rows.length, 1, "retry tidak boleh menggandakan attempt");
assert.equal(rows[0].correct, 0, "verdict committed salah tidak boleh ditimpa");
const ledgerDraft = reconcileDraft(stale, new Map([["A1:1:o1-1", rows[0].correct === 1]]), items);
assert.equal(ledgerDraft.correct, false, "UI harus menampilkan verdict committed, bukan retry");

// Remedial baru memakai sessionId baru: item yang sama boleh dinilai lagi.
insert.run("sid-remedial-1", "A1:1:o2-1", 0);
insert.run("sid-remedial-2", "A1:1:o2-1", 1);
const remedialRows = db.prepare("SELECT session_id,correct FROM attempts WHERE item_key='A1:1:o2-1' ORDER BY id").all();
assert.equal(remedialRows.length, 2, "remedial baru dengan sessionId baru boleh menilai item yang sama");
assert.deepEqual(remedialRows.map((row) => row.correct), [0, 1]);

