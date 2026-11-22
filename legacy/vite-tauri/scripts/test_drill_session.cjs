// DB-03/UI-01: start sesi drill tidak boleh tertahan idle setelah await.
// Store diuji dengan modul DB/attempt/build tiruan (tanpa Tauri).
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const source = fs.readFileSync("src/drills/session.ts", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

const item = {
  code: "D1", key: "D1:1", prompt: "___ Haus", sub: "", mode: "choice",
  options: ["der", "die", "das"], answer: "das", explanation: "das Haus", entryId: 1,
};
const create = (init) => {
  let state;
  const get = () => state;
  const set = (patch) => {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  };
  state = init(set, get);
  return { getState: () => state };
};
// [P] Riwayat attempt dan penjadwalan SRS tiruan yang dapat diamati tes.
const attemptHistory = [];
const scheduledCards = [];
const modules = {
  zustand: { create },
  "./items": {
    buildDrillSession: async () => [item],
    DRILL_META: { D1: { nama: "Artikel", level: "A1", mekanik: "", teori: [] } },
  },
  "../stores/db": {
    __esModule: true,
    default: async () => ({
      select: async (sql, params) => {
        if (sql.includes("FROM attempts")) {
          return attemptHistory.filter((row) => row.key === params[0]).slice(-3).reverse();
        }
        if (sql.includes("FROM cards")) return [{ id: 7 }];
        return [];
      },
      execute: async () => ({}) ,
    }),
    nowIso: () => "2026-11-17T09:00:00Z",
  },
  "../srs/review": { scheduleAgain: async (cardId) => { scheduledCards.push(cardId); } },
  "../srs/answers": { checkWord: (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase() },
  "../lessons/answerMatch": { choiceMatches: (opt, it) => opt === it.answer },
  "./attempts": {
    recordAttempt: async (it, correct) => {
      attemptHistory.push({ key: it.key, correct: correct ? 1 : 0 });
      return { correct };
    },
  },
};
const mod = { exports: {} };
new Function("require", "module", "exports", code)((id) => modules[id] ?? {}, mod, mod.exports);
const store = mod.exports.useDrillSession;

(async () => {
  assert.equal(store.getState().phase, "idle");
  await store.getState().start("D1");
  const after = store.getState();
  assert.equal(after.phase, "question", "start harus masuk question, bukan tertahan idle");
  assert.equal(after.items.length, 1);
  assert.equal(after.code, "D1");
  assert.ok(after.sessionId && after.sessionId.length > 0, "sessionId harus diisi");
  assert.ok(after.generation >= 1, "generation harus naik");

  // Sesi baru membatalkan hasil start lama.
  await store.getState().start("D1");
  assert.equal(store.getState().phase, "question");
  assert.ok(store.getState().generation > after.generation);

  // [P] PERILAKU: 3x salah pada item yang sama (lintas sesi) -> 1 kartu SRS.
  // Dua salah belum menjadwalkan; jawaban benar mereset hitungan.
  async function jawabSalah() {
    await store.getState().start("D1");
    store.getState().setInput("falsch");
    await store.getState().submitTyped();
  }
  attemptHistory.length = 0;
  scheduledCards.length = 0;

  await jawabSalah();
  assert.equal(store.getState().consecutiveWrong[item.key], 1, "[P] salah ke-1 -> 1");
  assert.equal(scheduledCards.length, 0, "[P] salah ke-1 belum menjadwalkan");

  await jawabSalah();
  assert.equal(store.getState().consecutiveWrong[item.key], 2, "[P] salah ke-2 -> 2");
  assert.equal(scheduledCards.length, 0, "[P] salah ke-2 belum menjadwalkan");

  await jawabSalah();
  assert.equal(store.getState().consecutiveWrong[item.key], 3, "[P] salah ke-3 -> 3");
  assert.deepEqual(scheduledCards, [7], "[P] salah ke-3 menjadwalkan tepat satu kartu");
  assert.deepEqual(store.getState().srsScheduledKeys, [item.key], "[P] item ditandai terjadwal");

  // [P] Salah ke-4 tidak menjadwalkan ulang.
  await jawabSalah();
  assert.equal(store.getState().consecutiveWrong[item.key], 3, "[P] LIMIT 3: hitungan tidak melebihi 3");
  assert.equal(scheduledCards.length, 1, "[P] tidak ada duplikat penjadwalan");

  // [P] Jawaban benar meng Reset consecutiveWrong untuk item itu.
  await store.getState().start("D1");
  store.getState().setInput(item.answer);
  await store.getState().submitTyped();
  assert.equal(store.getState().consecutiveWrong[item.key], 0, "[P] benar -> reset ke 0");
  assert.equal(scheduledCards.length, 1, "[P] reset tidak menghapus jadwal yang sudah dibuat");

  console.log("Drill store [P]: start phase/generation OK; 2 salah -> 0 SRS, 3 salah -> 1 kartu (id 7), salah ke-4 tidak duplikat, benar -> reset 0.");
  console.log("Klasifikasi bukti: [P] perilaku = seluruh asersi di atas; [T] teks = tidak ada asersi pencarian string pada tes ini.");
})().catch((e) => { console.error(e); process.exitCode = 1; });

