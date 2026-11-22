// Persistensi Latihan/Uji A1: validasi state, replay percakapan, deadline.
// Bukan tes SQLite; transaksi/revision diuji Agent 1 di sessionRepository.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const file = path.join(root, "src/ui/pages/latihanState.ts");
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)(require, mod, mod.exports);
const {
  beginExamAttempt,
  chooseMockResult,
  emptyExam,
  emptyListening,
  emptyTalk,
  emptyWriting,
  nextDeadline,
  remainingSeconds,
  replayConversation,
  restoredWritingDraft,
  sessionKeys,
  validateExam,
  validateListening,
  validateTalk,
  validateWriting,
} = mod.exports;

assert.equal(sessionKeys.writing("a1-write-absage"), "latihan:write:a1-write-absage", "full writing key identity");
assert.equal(sessionKeys.listening("a1-listen-cafe"), "latihan:listen:a1-listen-cafe");
assert.equal(sessionKeys.talk("a1-talk-cafe"), "latihan:talk:a1-talk-cafe");
assert.equal(sessionKeys.exam, "uji-a1:session:v1");

// Regresi asal review: key sesi penuh dibandingkan dengan ID tugas membuat
// editor kosong. Helper harus mengembalikan teks tersimpan.
const storedWriting = { ...emptyWriting(), draft: "Bitte bewahre meinen Entwurf.", checks: {} };
assert.equal(
  restoredWritingDraft("latihan:write:a1-write-absage", "a1-write-absage", storedWriting),
  "Bitte bewahre meinen Entwurf.",
  "draft restored with full session key",
);
assert.equal(
  restoredWritingDraft("latihan:write:a1-write-absage", "a1-write-kino", storedWriting),
  null,
  "draft not shown for another task",
);

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const listening = readJson("src/data/practice/a1_listening.json");
const writing = readJson("src/data/practice/a1_writing.json");
const conversation = readJson("src/data/practice/a1_conversation.json");
const exam = readJson("src/data/practice/a1_mock_exam.json");

// --- validators ---
assert.equal(validateListening(emptyListening()), true);
assert.equal(validateListening({ version: 1, answers: { a: "x" }, orders: { a: ["x", "y"] }, audioFailed: false }), true);
assert.equal(validateListening({ version: 1, answers: { a: 1 }, orders: {}, audioFailed: false }), false);
assert.equal(validateListening({ version: 1, answers: {}, orders: { a: "x" }, audioFailed: false }), false);
assert.equal(validateListening({ version: 2, answers: {}, orders: {}, audioFailed: false }), false);

assert.equal(validateWriting(emptyWriting()), true);
assert.equal(validateWriting({ version: 1, draft: "Hallo", checks: { "a:0": true } }), true);
assert.equal(validateWriting({ version: 1, draft: 5, checks: {} }), false);
assert.equal(validateWriting({ version: 1, draft: "", checks: { a: "yes" } }), false);

assert.equal(validateTalk(emptyTalk()), true);
assert.equal(validateTalk({ version: 1, choices: [0, 2, 1] }), true);
assert.equal(validateTalk({ version: 1, choices: [0, -1] }), false);
assert.equal(validateTalk({ version: 1, choices: [0.5] }), false);

assert.equal(validateExam(emptyExam()), true);
assert.equal(
  validateExam({ ...emptyExam(), started: true, sectionIndex: 2, deadlineAt: Date.now() + 1000 }),
  true,
);
assert.equal(validateExam({ ...emptyExam(), sectionIndex: -1 }), false);
assert.equal(validateExam({ ...emptyExam(), deadlineAt: "besok" }), false);
assert.equal(validateExam({ ...emptyExam(), answers: { a: 2 } }), false);
const result = {
  ts: "2026-11-17T00:00:00Z",
  hoeren: { correct: 4, total: 5, answered: 5, skipped: 0, audioFailed: 0 },
  lesen: { correct: 3, total: 5, answered: 5, skipped: 0 },
  schreiben: { checked: 2, total: 3 },
  sprechen: { checked: 1, total: 3 },
};
assert.equal(validateExam({ ...emptyExam(), finished: true, result }), true);
assert.equal(validateExam({ ...emptyExam(), finished: true, result: { ...result, hoeren: { correct: 4 } } }), false);
assert.equal(validateExam({ ...emptyExam(), started: true, deadlineAt: Date.now() + 1000, result: null }), true);
assert.equal(validateExam({ ...emptyExam(), lastResult: result }), true);
assert.equal(validateExam({ ...emptyExam(), lastResult: { ts: 1 } }), false);

// Regresi review: hasil terakhir harus bertahan saat percobaan baru dimulai,
// termasuk setelah restart dan ketika penulisan state awal baru gagal.
const finishedExam = { ...emptyExam(), finished: true, result, lastResult: result };
const nextAttempt = beginExamAttempt(finishedExam);
assert.equal(nextAttempt.started, true);
assert.equal(nextAttempt.finished, false);
assert.equal(nextAttempt.result, null);
assert.equal(nextAttempt.lastResult, result, "new attempt retains last result");
assert.deepEqual(chooseMockResult(nextAttempt, { ...result, ts: "legacy" }), result, "Statistik uses retained last result");
const restarted = JSON.parse(JSON.stringify(nextAttempt));
assert.deepEqual(chooseMockResult(restarted, null), result, "retained result survives restart/JSON");
const activeWithLast = { ...emptyExam(), started: true, lastResult: result };
assert.equal(beginExamAttempt(activeWithLast).lastResult, result, "second new attempt retains last result");
assert.deepEqual(chooseMockResult(activeWithLast, null), result);


assert.deepEqual(chooseMockResult({ ...emptyExam(), finished: true, result }, { ...result, ts: "lama" }), result, "session result wins");
assert.deepEqual(chooseMockResult({ ...emptyExam(), finished: true }, result), result, "old finished session falls back to config");
assert.deepEqual(chooseMockResult(emptyExam(), result), result, "unfinished session uses config");
assert.deepEqual(chooseMockResult(emptyExam(), null), null);

// --- replay seluruh skenario nyata ---
let replayedNodes = 0;
let replayedOptions = 0;
for (const scenario of conversation.scenarios) {
  const atStart = replayConversation(scenario, []);
  assert.equal(atStart.valid, true, `${scenario.id} start`);
  assert.equal(atStart.nodeId, scenario.start, `${scenario.id} start node`);
  assert.equal(atStart.log.length, 1, `${scenario.id} initial log`);
  assert.equal(atStart.log[0].kind, "speaker");

  const startNode = scenario.nodes[scenario.start];
  startNode.options.forEach((option, index) => {
    replayedOptions += 1;
    const step = replayConversation(scenario, [index]);
    assert.equal(step.valid, true, `${scenario.id} option ${index}`);
    assert.equal(step.nodeId, option.next, `${scenario.id} option ${index} next`);
    assert.deepEqual(step.log.map((entry) => entry.kind), ["speaker", "user", "feedback", "speaker"]);
    assert.equal(step.log[1].text, option.text);
    assert.equal(step.log[2].text, option.feedback);
  });

  // Jelajahi satu jalur penuh bila ada; hitung node yang dapat dicapai.
  const queue = [[scenario.start, []]];
  const visited = new Set();
  while (queue.length) {
    const [nodeId, choices] = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    const replay = replayConversation(scenario, choices);
    assert.equal(replay.valid, true, `${scenario.id} path ${nodeId}`);
    const node = scenario.nodes[nodeId];
    node.options?.forEach((option, index) => {
      if (!visited.has(option.next)) queue.push([option.next, [...choices, index]]);
    });
  }
  assert.equal(visited.size, Object.keys(scenario.nodes).length, `${scenario.id} all nodes reachable`);
  replayedNodes += visited.size;
}

// Pilihan tidak valid berhenti aman di node terakhir.
const firstScenario = conversation.scenarios[0];
const invalid = replayConversation(firstScenario, [99]);
assert.equal(invalid.valid, false);
assert.equal(invalid.nodeId, firstScenario.start);
assert.equal(invalid.log.length, 1);
const endNodeId = Object.values(firstScenario.nodes).find((node) => node.end)?.id;
if (endNodeId) {
  const endReplay = replayConversation(firstScenario, []);
  assert.equal(endReplay.valid, true);
}

// Round-trip JSON seperti yang disimpan sessionRepository.
const talk = { version: 1, choices: [0, 1, 0] };
assert.deepEqual(JSON.parse(JSON.stringify(talk)), talk);
const examState = { ...emptyExam(), started: true, answers: { "hoeren:0": "Berlin" }, deadlineAt: 1234567890 };
assert.deepEqual(JSON.parse(JSON.stringify(examState)), examState);

// Deadline: sisa waktu tidak negatif dan konsisten.
const now = 1_700_000_000_000;
assert.equal(nextDeadline(now, 5), now + 300_000);
assert.equal(nextDeadline(now, 0), now + 60_000);
assert.equal(remainingSeconds(now + 61_000, now), 61);
assert.equal(remainingSeconds(now + 1, now), 1);
assert.equal(remainingSeconds(now - 10_000, now), 0);
assert.equal(remainingSeconds(null, now), 0);

// --- persistWithRecovery: commit-before-response, storage gagal, retry ---
const { persistWithRecovery } = mod.exports;
function makeIo(initial = new Map(), behavior = {}) {
  const store = initial;
  let calls = 0;
  const io = {
    store,
    async write(key, sessionId, expectedRevision, data) {
      calls += 1;
      const current = store.get(key);
      if (behavior.commitThenConflict && calls === 1) {
        const revision = (current?.revision ?? 0) + 1;
        store.set(key, { sessionId, revision, data: JSON.parse(JSON.stringify(data)) });
        return { ok: false, error: { code: "conflict", message: "respons hilang setelah commit" } };
      }
      if (behavior.storageFail) {
        return { ok: false, error: { code: "storage", message: "disk penuh" } };
      }
      if (current && current.sessionId !== sessionId) {
        return { ok: false, error: { code: "conflict", message: "sesi lama" } };
      }
      if ((current?.revision ?? 0) !== expectedRevision) {
        return { ok: false, error: { code: "conflict", message: "revisi berubah" } };
      }
      const revision = expectedRevision + 1;
      store.set(key, { sessionId, revision, data: JSON.parse(JSON.stringify(data)) });
      return { ok: true, envelope: { revision } };
    },
    async load(key) {
      const current = store.get(key);
      return current ? { sessionId: current.sessionId, revision: current.revision } : null;
    },
  };
  return io;
}

async function recoveryTests() {
  const key = "latihan:write:a1-write-absage";
  const meta = { key, sessionId: "session-a", revision: 0 };
  const committed = makeIo(new Map(), { commitThenConflict: true });
  const recovered = await persistWithRecovery(meta, { version: 1, draft: "Bitte bewahre meinen Entwurf.", checks: {} }, committed);
  assert.equal(recovered.ok, true, "commit-before-response recovered");
  assert.equal(recovered.revision, 2, "recovery uses latest revision then increments");
  assert.equal(committed.store.get(key).data.draft, "Bitte bewahre meinen Entwurf.", "draft preserved after recovery");

  const failing = makeIo(new Map(), { storageFail: true });
  const failedWrite = await persistWithRecovery(meta, { version: 1, draft: "x", checks: {} }, failing);
  assert.equal(failedWrite.ok, false, "storage failure reported");
  assert.equal(failedWrite.message, "disk penuh");

  const otherSession = makeIo(new Map([[key, { sessionId: "session-lain", revision: 3, data: {} }]]));
  const conflict = await persistWithRecovery(meta, { version: 1, draft: "x", checks: {} }, otherSession);
  assert.equal(conflict.ok, false, "different session stays conflict");

  const examKey = sessionKeys.exam;
  const examMeta = { key: examKey, sessionId: "exam-a", revision: 2 };
  const oldStore = new Map([[examKey, { sessionId: "exam-a", revision: 2, data: finishedExam }]]);
  const failingStart = makeIo(oldStore, { storageFail: true });
  const failedStart = await persistWithRecovery(examMeta, nextAttempt, failingStart);
  assert.equal(failedStart.ok, false, "new attempt write failure reported");
  assert.deepEqual(oldStore.get(examKey).data, finishedExam, "old committed result untouched on failure");
  assert.deepEqual(chooseMockResult(oldStore.get(examKey).data, null), result, "Statistik keeps old result after failed start");

  const commitLost = makeIo(new Map([[examKey, { sessionId: "exam-a", revision: 2, data: finishedExam }]]), { commitThenConflict: true });
  const recoveredStart = await persistWithRecovery(examMeta, nextAttempt, commitLost);
  assert.equal(recoveredStart.ok, true, "start new attempt recovered after commit-before-response");
  assert.deepEqual(chooseMockResult(commitLost.store.get(examKey).data, null), result, "retained last result after recovered start");

  assert.equal(listening.items.length, 5);
  assert.equal(writing.tasks.length, 5);
  assert.equal(conversation.scenarios.length, 4);
  assert.equal(exam.sections.length, 4);

  console.log(
    `Persistensi Latihan/Uji A1 OK: 4 skenario percakapan, ${replayedNodes} node, ` +
      `${replayedOptions} opsi awal; validator menolak state rusak; deadline konsisten; ` +
      "commit-before-response dipulihkan, storage gagal dilaporkan, hasil terakhir bertahan saat attempt baru/restart.",
  );
}

recoveryTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
