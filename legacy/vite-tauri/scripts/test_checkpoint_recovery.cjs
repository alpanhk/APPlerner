// HARDENING-07: batas baca draft/sesi. Payload rusak disalin ke key pemulihan,
// key asli dibersihkan, lalu sesi baru dapat ditulis tanpa konflik.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

const rows = new Map();
const db = {
  async select(query, params = []) {
    if (query.includes("FROM lesson_drafts")) {
      return rows.has(params[0]) ? [{ payload: rows.get(params[0]) }] : [];
    }
    throw new Error(`select tak terduga: ${query}`);
  },
  async execute(query, params = []) {
    if (query.includes("INSERT INTO lesson_drafts")) rows.set(params[0], params[1]);
    else if (query.includes("DELETE FROM lesson_drafts")) rows.delete(params[0]);
    else throw new Error(`execute tak terduga: ${query}`);
    return {};
  },
};
const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-18T03:30:00Z" };
const load = (file, deps) => {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => id === "../stores/db" ? dbModule : (deps?.[id] ?? {}),
    mod,
    mod.exports,
  );
  return mod.exports;
};
const persistence = load("src/lessons/persistence.ts");
const sessions = load("src/lessons/sessionRepository.ts");

(async () => {
  const sessionKey = "checkpoint_session:4";
  const draftKey = "checkpoint_attempt:4";

  // Valid session/draft tetap dibaca apa adanya.
  const sessionData = { unitNo: 4, items: [{ key: "a" }] };
  assert.equal((await sessions.writeSession(sessionKey, "sid-valid", 0, sessionData)).ok, true);
  const valid = await sessions.loadSessionChecked(sessionKey, (data) => data?.unitNo === 4 ? data : null);
  assert.equal(valid.invalid, false);
  assert.equal(valid.envelope.data.unitNo, 4);
  assert.equal(valid.raw, rows.get(sessionKey));

  rows.set(draftKey, JSON.stringify({ items: [{ key: "a" }], index: 0, correct: null, correctCount: 0 }));
  assert.equal((await persistence.loadDraft(draftKey)).index, 0);
  assert.equal(await persistence.loadDraftRaw(draftKey), rows.get(draftKey));

  // Payload sesi dengan data yang tidak lengkap: invalid, raw tersedia.
  const brokenSession = JSON.stringify({
    version: 1, key: sessionKey, sessionId: "sid-rusak", revision: 2,
    updatedAt: "2026-11-18T00:00:00Z",
    data: { unitNo: 4, answers: [], index: 0 },
  });
  rows.set(sessionKey, brokenSession);
  const broken = await sessions.loadSessionChecked(
    sessionKey,
    (data) => data && Array.isArray(data.items) && data.items.length > 0 ? data : null,
  );
  assert.equal(broken.invalid, true);
  assert.equal(broken.envelope, null);
  assert.equal(broken.raw, brokenSession);

  const recoverySession = await persistence.quarantineDraft(sessionKey, broken.raw);
  assert.ok(recoverySession && recoverySession.startsWith(`${sessionKey}:recovery:`));
  assert.equal(rows.has(sessionKey), false, "key asli dibersihkan setelah disalin");
  assert.equal(rows.get(recoverySession), brokenSession, "payload lama disalin byte-identik");
  assert.equal((await sessions.writeSession(sessionKey, "sid-baru", 0, sessionData)).ok, true, "sesi baru dapat ditulis");
  assert.equal((await sessions.loadSessionChecked(sessionKey, (data) => data)).invalid, false);

  // Draft berbingkai envelope: raw dipertahankan, key asli dibersihkan.
  const envelope = JSON.stringify({
    version: 1, key: draftKey, sessionId: "sid-draft", revision: 1,
    data: { items: [{ key: "a" }], index: 0, correct: null, correctCount: 0 },
  });
  rows.set(draftKey, envelope);
  assert.equal(await persistence.loadDraftRaw(draftKey), envelope);
  const recoveryDraft = await persistence.quarantineDraft(draftKey, envelope);
  assert.equal(rows.has(draftKey), false);
  assert.equal(rows.get(recoveryDraft), envelope);

  // Penulisan draft baru setelah pemulihan tidak menyentuh salinan.
  await persistence.saveDraft(draftKey, { items: [{ key: "b" }], index: 0, correct: null, correctCount: 0 });
  assert.equal(JSON.parse(rows.get(draftKey)).items[0].key, "b");
  assert.equal(rows.get(recoveryDraft), envelope);

  // JSON rusak: loadDraft null, raw tetap tersedia untuk karantina.
  rows.set("rusak", "{");
  assert.equal(await persistence.loadDraft("rusak"), null);
  assert.equal(await persistence.loadDraftRaw("rusak"), "{");
  const recoveryBroken = await persistence.quarantineDraft("rusak", await persistence.loadDraftRaw("rusak"));
  assert.equal(rows.has("rusak"), false);
  assert.equal(rows.get(recoveryBroken), "{");

  console.log("CheckpointRecovery: payload invalid disalin ke key recovery, key asli bersih, sesi baru/valid tetap dapat ditulis; draft baru tidak menimpa salinan.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
