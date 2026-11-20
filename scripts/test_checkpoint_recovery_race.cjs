// WINDOWS-20261118-08 / P8: reproduksi deterministik race pemulihan draft.
// Urutan yang diuji: validator membaca payload lama, operasi salin ke
// :recovery: ditahan, writer lain menulis draft/sesi baru pada key yang sama,
// lalu penahan dilepas. Payload baru WAJIB bertahan; payload lama yang
// disalin tidak boleh menimpa atau menghapus penulisan baru.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function transpile(file) {
  return ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

const rows = new Map();
let armCopyGate = false;
let releaseCopy = null;
let enteredResolve = null;
const copyEntered = new Promise((resolve) => { enteredResolve = resolve; });

const isRecovery = (query, params) =>
  query.includes("INSERT INTO lesson_drafts") && String(params[0]).includes(":recovery:");

const db = {
  async select(query, params = []) {
    if (!query.includes("FROM lesson_drafts")) throw new Error(`select tak terduga: ${query}`);
    const value = rows.get(params[0]);
    // Dukung SELECT dengan syarat payload untuk implementasi compare-and-move.
    if (value === undefined) return [];
    if (query.includes("AND payload = $2") && params[1] !== value) return [];
    return [{ payload: value }];
  },
  async execute(query, params = []) {
    if (isRecovery(query, params) && armCopyGate) {
      armCopyGate = false;
      const gate = new Promise((resolve) => { releaseCopy = resolve; });
      enteredResolve();
      await gate;
    }
    if (query.includes("INSERT INTO lesson_drafts")) {
      rows.set(params[0], params[1]);
    } else if (query.includes("DELETE FROM lesson_drafts")) {
      const matches = query.includes("AND payload = $2") ? params[1] === rows.get(params[0]) : true;
      if (matches) rows.delete(params[0]);
    } else {
      throw new Error(`execute tak terduga: ${query}`);
    }
    return {};
  },
};
const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-18T15:00:00Z" };
const load = (file) => {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => id === "../stores/db" ? dbModule : {},
    mod,
    mod.exports,
  );
  return mod.exports;
};
const persistence = load("src/lessons/persistence.ts");
const sessions = load("src/lessons/sessionRepository.ts");

const key = "checkpoint_attempt:4";
const staleRaw = "{"; // payload invalid hasil baca lama
const fresh = { sessionId: "valid-new", items: [{ key: "x" }], index: 0 };

(async () => {
  // 1) Skenario utama: salin ditahan, saveDraft(module yang sama) menulis data
  // baru, lalu penahan dilepas. Data baru tidak boleh hilang.
  rows.clear();
  rows.set(key, staleRaw);
  armCopyGate = true;
  const pending = persistence.quarantineDraft(key, staleRaw);
  await copyEntered;
  const write = persistence.saveDraft(key, fresh); // sengaja tidak di-await dulu
  releaseCopy();
  await pending;
  await write;
  assert.equal(rows.get(key), JSON.stringify(fresh), "draft baru dari writer lain terhapus oleh pemulihan");
  assert.ok([...rows.keys()].some((k) => k.startsWith(`${key}:recovery:`)), "salinan pemulihan tetap ada");

  // 2) Writer lintas modul (writeSession memakai antrean sendiri): payload baru
  // juga harus bertahan dan terdeteksi sebagai sourceChanged.
  rows.clear();
  rows.set(key, staleRaw);
  armCopyGate = true;
  const pending2 = persistence.quarantineDraftChecked(key, staleRaw);
  await copyEntered;
  const sessionWrite = sessions.writeSession(key, "sid-baru", 0, { unitNo: 4, items: [{ key: "x" }] });
  await sessionWrite;
  releaseCopy();
  const outcome = await pending2;
  assert.equal(outcome.sourceChanged, true, "perubahan sumber oleh writer lain tidak terdeteksi");
  const after = JSON.parse(rows.get(key));
  assert.equal(after.sessionId, "sid-baru", "sesi baru dari writer lain terhapus oleh pemulihan");

  // 3) Retry setelah sourceChanged: baca ulang lalu karantina versi terbaru.
  const reread = await persistence.loadDraftRaw(key);
  const retried = await persistence.quarantineDraftChecked(key, reread);
  assert.equal(retried.sourceChanged, false);
  assert.equal(retried.sourceRemoved, true);
  assert.equal(rows.get(retried.recoveryKey), reread);
  assert.equal(rows.has(key), false);

  // 4) Salin gagal: payload sumber tetap utuh, tidak ada penghapusan.
  rows.clear();
  rows.set(key, staleRaw);
  const originalExecute = db.execute.bind(db);
  db.execute = async (query, params = []) => {
    if (isRecovery(query, params)) throw new Error("INSERT gagal");
    return originalExecute(query, params);
  };
  const failed = await persistence.quarantineDraftChecked(key, staleRaw);
  db.execute = originalExecute;
  assert.equal(failed.recoveryKey, null);
  assert.equal(failed.error !== null, true);
  assert.equal(rows.get(key), staleRaw, "sumber ikut terhapus saat salin gagal");

  // 5) Jalur lama tetap valid: payload cocok -> dipindahkan, key dibersihkan.
  rows.clear();
  rows.set(key, staleRaw);
  const moved = await persistence.quarantineDraft(key, staleRaw);
  assert.ok(moved && moved.startsWith(`${key}:recovery:`));
  assert.equal(rows.has(key), false);
  assert.equal(rows.get(moved), staleRaw);

  // 6) deleteSessionIfUnchanged menolak menghapus payload yang sudah berubah.
  rows.clear();
  rows.set(key, staleRaw);
  const staleDelete = await sessions.deleteSessionIfUnchanged(key, "payload-lain");
  assert.equal(staleDelete.deleted, false);
  assert.equal(staleDelete.sourceChanged, true);
  assert.equal(rows.get(key), staleRaw);
  const freshDelete = await sessions.deleteSessionIfUnchanged(key, staleRaw);
  assert.equal(freshDelete.deleted, true);
  assert.equal(rows.has(key), false);

  // 7) String kosong adalah payload invalid yang nyata, bukan "tidak ada raw".
  rows.clear();
  rows.set(key, "");
  const emptyOutcome = await persistence.quarantineDraftChecked(key, "");
  assert.equal(emptyOutcome.sourceChanged, false);
  assert.equal(emptyOutcome.sourceRemoved, true);
  assert.equal(rows.has(key), false);
  assert.equal(rows.get(emptyOutcome.recoveryKey), "");

  console.log("CheckpointRecoveryRace: penulisan baru bertahan, sourceChanged terdeteksi, retry aman, salin gagal menjaga sumber, hapus terhartasi, jalur lama utuh.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
