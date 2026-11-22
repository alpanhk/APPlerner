// WINDOWS-20261118-08 / P8 regresi: keputusan pemulihan pada runner.
// Dua kasus review yang dibuktikan:
//  (a) salin gagal / sourceRemoved=false & sourceChanged=false -> blokir soal;
//  (b) raw === null dibedakan dari string kosong (payload invalid kosong tetap
//      diproses, tidak dilewati sehingga bisa ditimpa save_attempt_with_draft).
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const load = (file) => {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id === "react") return {};
    return {};
  }, mod, mod.exports);
  return mod.exports;
};

const { decideAttemptRecovery, decideSessionRecovery } = load("src/lessons/checkpointRecovery.ts");
const runner = fs.readFileSync(path.join(root, "src/ui/lessons/CheckpointRunner.tsx"), "utf8");

const ok = (extra = {}) => ({ recoveryKey: "checkpoint_attempt:4:recovery:x", sourceRemoved: true, sourceChanged: false, error: null, ...extra });

(async () => {
  // (b) string kosong adalah payload invalid yang harus dipertahankan.
  const emptyCopyFailed = decideAttemptRecovery("", ok({ recoveryKey: null, error: "INSERT gagal" }));
  assert.equal(emptyCopyFailed.action, "block", "raw kosong + salin gagal harus memblokir");
  assert.match(emptyCopyFailed.blockReason, /Muat ulang/);

  const emptyNotRemoved = decideAttemptRecovery("", ok({ sourceRemoved: false, sourceChanged: false }));
  assert.equal(emptyNotRemoved.action, "block", "salin sukses tetapi sumber tidak bersih harus memblokir");
  assert.match(emptyNotRemoved.blockReason, /kembali ke unit/);

  const normal = decideAttemptRecovery("{", ok());
  assert.equal(normal.action, "continue");
  assert.match(normal.notice, /Salinan pemulihan/);

  // null = memang tidak ada payload, boleh lanjut.
  const noPayload = decideAttemptRecovery(null, null);
  assert.equal(noPayload.action, "continue");
  assert.equal(noPayload.notice, "");

  const changed = decideAttemptRecovery("{", ok({ sourceChanged: true, sourceRemoved: false }));
  assert.equal(changed.action, "reload");

  // Sesi memakai aturan yang sama dengan pesan khusus sesi.
  assert.equal(decideSessionRecovery("", ok({ recoveryKey: null }), "alasan").action, "block");
  assert.equal(decideSessionRecovery("", ok({ sourceRemoved: false }), "alasan").action, "block");
  assert.equal(decideSessionRecovery(null, null, "alasan").action, "continue");
  assert.equal(decideSessionRecovery("{", ok(), "alasan").action, "continue");
  assert.equal(decideSessionRecovery("{", ok({ sourceChanged: true }), "alasan").action, "reload");

  // Runner benar-benar memakai keputusan ini dan mengunci interaksi.
  assert.match(runner, /decideAttemptRecovery\(raw, outcome\)/);
  assert.match(runner, /decideSessionRecovery\(raw, outcome, reason\)/);
  assert.match(runner, /if \(storageBlocked\)/);
  assert.match(runner, /blockStorage\(decision\.blockReason\)/);
  assert.match(runner, /setStorageBlocked\(pendingBlockReason\)/);
  assert.match(runner, /pendingBlockReason = reason \?\? pendingBlockReason/);
  assert.doesNotMatch(runner, /if \(attemptRaw\)/);
  assert.match(runner, /const outcome = raw === null \? null : await quarantineDraftChecked/);

  console.log("CheckpointRecoveryDecision: raw kosong + gagal/tidak bersih memblokir soal; null aman; runner memakai keputusan dan mengunci interaksi.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
