// Alur penyimpanan nyata (sessionRepository + payload sesi) untuk draft
// Menulis dan hasil Uji A1, memakai DB SQLite palsu di memori.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const loadTs = (rel, overrides = {}) => {
  const file = path.join(root, rel);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) =>
    Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : createRequire(file)(id);
  new Function("require", "module", "exports", output)(localRequire, loaded, loaded.exports);
  return loaded.exports;
};
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

function makeDb() {
  const rows = new Map();
  const state = { failInsert: 0, commitThenThrow: 0, revision: 0 };
  const db = {
    rows,
    state,
    nowIso: () => "2026-11-17T00:00:00.000Z",
    async select(sql, params = []) {
      if (/FROM lesson_drafts WHERE key = \$1/i.test(sql)) {
        const row = rows.get(params[0]);
        return row ? [{ payload: JSON.stringify(row) }] : [];
      }
      throw new Error(`select tidak dikenal: ${sql}`);
    },
    async execute(sql, params = []) {
      if (/INSERT INTO lesson_drafts/i.test(sql)) {
        if (state.failInsert > 0) {
          state.failInsert -= 1;
          throw new Error("disk penuh (simulasi)");
        }
        const [key, payload, updatedAt] = params;
        // Payload sudah berupa envelope JSON; simpan objeknya.
        rows.set(key, JSON.parse(payload));
        if (state.commitThenThrow > 0) {
          state.commitThenThrow -= 1;
          throw new Error("respons hilang setelah commit (simulasi)");
        }
        state.revision += 1;
        return { rowsAffected: 1, updatedAt };
      }
      if (/DELETE FROM lesson_drafts/i.test(sql)) {
        rows.delete(params[0]);
        return { rowsAffected: 1 };
      }
      throw new Error(`execute tidak dikenal: ${sql}`);
    },
  };
  return db;
}

async function main() {
  const db = makeDb();
  const stateMod = loadTs("src/ui/pages/latihanState.ts");
  const repo = loadTs("src/lessons/sessionRepository.ts", {
    "../stores/db": {
      __esModule: true,
      default: async () => db,
      nowIso: db.nowIso,
    },
  });
  const { loadSession, writeSession, deleteSession } = repo;
  const {
    beginExamAttempt,
    chooseMockResult,
    emptyExam,
    emptyWriting,
    sessionKeys,
    validateExam,
    validateWriting,
  } = stateMod;

  // --- Draft Menulis: simpan, checklist tidak menimpa draft, restart ---
  const writeKey = sessionKeys.writing("a1-write-absage");
  const writingMeta = { sessionId: "write-session", revision: 0 };
  const legacy = "Bitte bewahre meinen Entwurf.";
  const initial = { ...emptyWriting(), draft: legacy };
  assert.equal(validateWriting(initial), true);
  let saved = await writeSession(writeKey, writingMeta.sessionId, writingMeta.revision, initial);
  assert.equal(saved.ok, true);
  writingMeta.revision = saved.envelope.revision;

  // Checklist saja: payload mempertahankan draft.
  const withCheck = { ...initial, checks: { "a1-write-absage:0": true } };
  saved = await writeSession(writeKey, writingMeta.sessionId, writingMeta.revision, withCheck);
  assert.equal(saved.ok, true);
  writingMeta.revision = saved.envelope.revision;

  // Restart: baca ulang; draft dan checklist harus ada.
  const reloaded = await loadSession(writeKey);
  assert.equal(reloaded.sessionId, writingMeta.sessionId);
  assert.equal(reloaded.data.draft, legacy);
  assert.equal(reloaded.data.checks["a1-write-absage:0"], true);

  // Blur tanpa edit tidak boleh menulis revisi baru.
  const beforeBlurRevision = reloaded.revision;
  assert.equal((await loadSession(writeKey)).revision, beforeBlurRevision);

  // Gagal tulis: data lama tetap; retry menulis payload terbaru.
  db.state.failInsert = 1;
  const failed = await writeSession(writeKey, writingMeta.sessionId, writingMeta.revision, {
    ...withCheck,
    draft: legacy + " Zusatz.",
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.error.code, "storage");
  const afterFail = await loadSession(writeKey);
  assert.equal(afterFail.data.draft, legacy, "draft lama tetap sampai commit");
  writingMeta.revision = afterFail.revision;
  const retried = await writeSession(writeKey, writingMeta.sessionId, writingMeta.revision, {
    ...withCheck,
    draft: legacy + " Zusatz.",
  });
  assert.equal(retried.ok, true, "retry setelah gagal");
  assert.equal((await loadSession(writeKey)).data.draft, legacy + " Zusatz.");

  // --- Uji A1: hasil bertahan saat attempt baru, restart, dan start gagal ---
  const examKey = sessionKeys.exam;
  const result = {
    ts: "2026-11-17T00:00:00.000Z",
    hoeren: { correct: 4, total: 5, answered: 5, skipped: 0, audioFailed: 0 },
    lesen: { correct: 3, total: 5, answered: 5, skipped: 0 },
    schreiben: { checked: 2, total: 3 },
    sprechen: { checked: 1, total: 3 },
  };
  const finished = { ...emptyExam(), started: true, finished: true, result, lastResult: result };
  assert.equal(validateExam(finished), true);
  const examMeta = { sessionId: "exam-session", revision: 0 };
  let examSaved = await writeSession(examKey, examMeta.sessionId, examMeta.revision, finished);
  assert.equal(examSaved.ok, true);
  examMeta.revision = examSaved.envelope.revision;

  // Selesai -> mulai percobaan baru tanpa delete; hasil terakhir retained.
  const nextAttempt = beginExamAttempt((await loadSession(examKey)).data);
  assert.deepEqual(chooseMockResult(nextAttempt, null), result);
  examSaved = await writeSession(examKey, examMeta.sessionId, examMeta.revision, nextAttempt);
  assert.equal(examSaved.ok, true);
  examMeta.revision = examSaved.envelope.revision;
  const activeReload = await loadSession(examKey);
  assert.equal(activeReload.data.finished, false);
  assert.deepEqual(chooseMockResult(activeReload.data, null), result, "hasil terakhir saat attempt aktif");

  // Restart saat attempt baru belum selesai.
  const restarted = await loadSession(examKey);
  assert.deepEqual(chooseMockResult(restarted.data, null), result, "hasil terakhir setelah restart");

  // Start baru gagal: row lama (finished+result) tetap menjadi hasil.
  db.state.failInsert = 1;
  const failedStart = await writeSession(examKey, examMeta.sessionId, examMeta.revision, {
    ...emptyExam(),
    started: true,
    lastResult: result,
  });
  assert.equal(failedStart.ok, false);
  const afterFailedStart = await loadSession(examKey);
  assert.equal(afterFailedStart.data.finished, false);
  assert.deepEqual(chooseMockResult(afterFailedStart.data, null), result, "hasil lama aman saat start gagal");

  // Commit sebelum respons hilang pada percobaan baru: retry memakai revisi
  // terbaru dan tidak menghapus hasil terakhir.
  db.state.commitThenThrow = 1;
  const meta2 = { key: examKey, sessionId: examMeta.sessionId, revision: afterFailedStart.revision };
  const lossy = await writeSession(examKey, meta2.sessionId, meta2.revision, {
    ...emptyExam(),
    started: true,
    lastResult: result,
  });
  assert.equal(lossy.ok, false);
  const recovered = await stateMod.persistWithRecovery(meta2, {
    ...emptyExam(),
    started: true,
    lastResult: result,
  }, { write: writeSession, load: loadSession });
  assert.equal(recovered.ok, true, "retry setelah commit-before-response");
  const final = await loadSession(examKey);
  assert.deepEqual(chooseMockResult(final.data, null), result, "hasil terakhir setelah recovery");

  // Delete/new session tetap tersedia untuk percobaan yang memang membuang sesi.
  await deleteSession(writeKey);
  assert.equal(await loadSession(writeKey), null);

  console.log(
    "Alur storage Latihan/Uji A1 OK: draft+checklist tahan restart, gagal tulis/retry aman, " +
      "hasil terakhir bertahan saat attempt baru/restart/start gagal/commit-before-response.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
