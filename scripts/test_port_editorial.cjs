// PORT-EDITORIAL-20261120/1a: bukti [P] satu CTA Hari Ini memakai posisi nyata
// dari SQLite, tetap kompatibel setelah restart, dengan fallback pelajaran baru.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    assert.ok(Object.hasOwn(mocks, id), `dependency tak terduga ${id} di ${file}`);
    return mocks[id];
  }, mod, mod.exports);
  return mod.exports;
}

(async () => {
  // Draft nyata seperti yang ditulis KLAB saat peserta berhenti di soal 2.
  const drafts = [{
    key: "lernen_lesson_4_2",
    payload: JSON.stringify({
      step: 2, stage: "payment", exerciseIndex: 1, klab: true,
      answers: [{ id: "q1", picked: "ein", correct: false }], updatedAt: "2026-11-20T02:00:00Z",
    }),
    updated_at: "2026-11-20T02:00:00Z",
  }];
  const db = {
    select: async (query) => {
      if (query.includes("lesson_drafts")) return drafts;
      if (query.includes("lesson_progress")) return [];
      return [];
    },
  };
  const dbModule = { __esModule: true, default: async () => db };
  const registry = load("src/app/sessionRegistry.ts", { "../stores/db": dbModule });
  const adapters = load("src/app/viewAdapters.ts", {
    "../stores/db": dbModule,
    "../lessons/units": {
      UNITS_ALL: [{ unit: 4, title: "Makanan & minuman", lessons: [{ no: 2, title: "Memesan minuman" }] }],
    },
    "../klab/learning/logic": { allReadings: () => [] },
  });

  const targets = await registry.loadContinueTargets();
  assert.equal(targets.length, 1);
  assert.match(targets[0].detail, /Lanjutkan latihan · Soal 2/, "posisi soal terbaca dari draft");

  const agenda = adapters.agendaFromTargets(targets);
  assert.equal(agenda.actionLabel, "Lanjutkan", "satu CTA berubah jadi Lanjutkan bila ada posisi");
  assert.equal(agenda.subtitle, targets[0].detail);
  const route = adapters.agendaRoute(targets);
  assert.deepEqual(route, {
    name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "resume:lernen_lesson_4_2",
  }, "CTA menuju posisi SQLite nyata");

  // Restart: modul dimuat ulang, hanya SQLite/drafts yang bertahan.
  const afterRestart = load("src/app/sessionRegistry.ts", { "../stores/db": dbModule });
  const again = await afterRestart.loadContinueTargets();
  assert.deepEqual(again, targets, "posisi identik setelah restart");

  // Profil kosong: satu CTA Mulai ke pelajaran pembuka yang sudah diuji.
  drafts.length = 0;
  const fresh = await afterRestart.loadContinueTargets();
  assert.equal(fresh.length, 0);
  const emptyAgenda = adapters.agendaFromTargets(fresh);
  assert.equal(emptyAgenda.actionLabel, "Mulai pelajaran");
  assert.equal(emptyAgenda.title, "Memesan minuman di kafe");
  assert.deepEqual(adapters.agendaRoute(fresh), {
    name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2",
  });

  console.log("PORT-EDITORIAL: satu CTA Hari Ini memakai posisi SQLite nyata dan pulih setelah restart.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
