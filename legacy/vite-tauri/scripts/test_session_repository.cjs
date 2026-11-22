// DB-05: kontrak repository sesi (revision, sessionId, stale writer).
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const source = fs.readFileSync("src/lessons/sessionRepository.ts", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const rows = new Map();
const db = {
  async select(query, params = []) {
    if (query.includes("FROM lesson_drafts")) return rows.has(params[0]) ? [{ payload: rows.get(params[0]) }] : [];
    throw new Error(`select tak terduga: ${query}`);
  },
  async execute(query, params = []) {
    if (query.includes("INSERT INTO lesson_drafts")) rows.set(params[0], params[1]);
    else if (query.includes("DELETE FROM lesson_drafts")) rows.delete(params[0]);
    else throw new Error(`execute tak terduga: ${query}`);
    return {};
  },
};
const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-17T09:00:00Z" };
const mod = { exports: {} };
new Function("require", "module", "exports", code)((id) => id === "../stores/db" ? dbModule : {}, mod, mod.exports);
const { loadSession, writeSession, deleteSession } = mod.exports;

(async () => {
  const key = "checkpoint_session:1";
  const first = await writeSession(key, "sid-a", 0, { n: 1 });
  assert.equal(first.ok, true);
  assert.equal(first.envelope.revision, 1);
  const staleExpected = await writeSession(key, "sid-a", 0, { n: 2 });
  assert.equal(staleExpected.ok, false);
  assert.equal(staleExpected.error.code, "conflict");
  const second = await writeSession(key, "sid-a", 1, { n: 2 });
  assert.equal(second.ok, true);
  assert.equal(second.envelope.revision, 2);
  const loaded = await loadSession(key);
  assert.equal(loaded.data.n, 2);
  assert.equal(loaded.revision, 2);

  const otherSession = await writeSession(key, "sid-b", 2, { n: 3 });
  assert.equal(otherSession.ok, false, "sessionId lama tidak boleh menimpa sesi baru");
  await deleteSession(key);
  assert.equal(await loadSession(key), null);
  const fresh = await writeSession(key, "sid-b", 0, { n: 3 });
  assert.equal(fresh.ok, true, "sesi baru mulai dari revisi 0 setelah draft dihapus");
  const oldWriter = await writeSession(key, "sid-a", 1, { n: 4 });
  assert.equal(oldWriter.ok, false, "writer sesi lama tetap ditolak");

  console.log("SessionRepository: revision conflict, sessionId stale writer ditolak, delete/new session benar.");
})().catch((e) => { console.error(e); process.exitCode = 1; });
