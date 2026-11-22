// F5-GAP-01 / P7-GAP-02: readiness per skill harus berasal dari mastery + accuracy,
// atau null disertai konteks sampel jujur. Tidak ada klaim kemampuan tanpa data.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function loadStatsWith(attempts, progress) {
  const db = {
    async select(query) {
      if (query.includes("FROM attempts")) return attempts;
      if (query.includes("FROM entries")) return [];
      if (query.includes("FROM srs_state")) return [];
      if (query.includes("COUNT(*) n FROM cards")) return [{ n: 0 }];
      if (query.includes("FROM lesson_progress")) return progress;
      if (query.includes("FROM reading_log")) {
        if (query.includes("COUNT(DISTINCT")) return [{ texts: 0, reads: 0, words: 0 }];
        return [];
      }
      if (query.includes("daily_goal_min")) return [];
      if (query.includes("study_ms:")) return [];
      throw new Error(`select tak terduga: ${query}`);
    },
  };
  const units = {
    CHECKPOINT_LESSON_NO: 99,
    LEVEL_ORDER: ["A1", "A2", "B1", "B2"],
    LEVELS: {
      A1: { units: [
        { unit: 1, lessons: [{ no: 1 }, { no: 2 }], checkpoint: { pass: 70 } },
        { unit: 2, lessons: [{ no: 1 }], checkpoint: { pass: 70 } },
      ] },
      A2: { units: [] }, B1: { units: [] }, B2: { units: [] },
    },
    totalLessons: (unit) => unit.lessons.length,
    unitHasContent: (unit) => unit.lessons.length > 0,
  };
  const dates = {
    computeStreak: () => ({ current: 0, best: 0 }),
    dayKey: (value) => String(value).slice(0, 10),
    dayLabelId: () => "Hari",
    lastDays: () => ["2026-11-19"],
    shiftDay: () => "2026-11-19",
  };
  const code = ts.transpileModule(fs.readFileSync("src/stats/queries.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id === "../stores/db") return { __esModule: true, default: async () => db };
    if (id === "./dates") return dates;
    if (id === "../lessons/units") return units;
    throw new Error(`dependency tak terduga: ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}

const attempt = (kind, drillCode, correct) => ({
  ts: "2026-11-19T09:00:00Z", kind, correct: correct ? 1 : 0, ms: 500,
  drill_code: drillCode, item_key: null, item_id: 1,
});
const progress = [
  { unit_no: 1, lesson_no: 1, state: "done", score: 90 },
  { unit_no: 1, lesson_no: 2, state: "done", score: 80 },
  { unit_no: 2, lesson_no: 1, state: "done", score: 85 },
  { unit_no: 1, lesson_no: 99, state: "done", score: 85 },
  { unit_no: 2, lesson_no: 99, state: "done", score: 80 },
];

(async () => {
  // A) Sampel cukup + mastery nyata -> skor bukan-null, bukan CEFR claim.
  {
    const { loadStats } = loadStatsWith([
      ...Array.from({ length: 6 }, (_, i) => attempt("drill", "D8", i < 5)),
      ...Array.from({ length: 6 }, (_, i) => attempt("srs", null, i < 4)),
      ...Array.from({ length: 6 }, (_, i) => attempt("drill", "D2", i < 5)),
    ], progress);
    const { skills } = await loadStats();
    assert.equal(skills.length, 4);
    const byId = Object.fromEntries(skills.map((skill) => [skill.id, skill]));
    assert.equal(typeof byId.hoeren.score, "number", "Hören terhitung");
    assert.equal(typeof byId.lesen.score, "number", "Lesen terhitung");
    assert.equal(typeof byId.schreiben.score, "number", "Schreiben terhitung");
    assert.equal(byId.sprechen.score, null, "Sprechen tidak diklaim");
    assert.equal(byId.hoeren.score, 93);
    assert.equal(byId.lesen.score, 87);
    assert.equal(byId.schreiben.score, 93);
    for (const skill of skills) {
      assert.match(skill.detail, /mastery A1|tidak ada klaim kemampuan/);
      assert.match(skill.detail, /bukan penilaian CEFR|tidak ada klaim kemampuan/);
    }
  }

  // B) Sampel kecil tanpa progres -> null + konteks sampel, tanpa klaim.
  {
    const { loadStats } = loadStatsWith([
      attempt("drill", "D8", true), attempt("drill", "D8", false),
    ], []);
    const { skills } = await loadStats();
    for (const skill of skills) assert.equal(skill.score, null, `${skill.id} tetap null`);
    const hoeren = skills.find((skill) => skill.id === "hoeren");
    assert.match(hoeren.detail, /2 sampel \(minimum 5/);
    assert.match(hoeren.detail, /mastery A1 0% \(0\/3/);
    assert.match(hoeren.detail, /bukan penilaian CEFR/);
  }

  // C) Sampel cukup tetapi tidak ada mastery -> tetap null, bukan skor palsu.
  {
    const { loadStats } = loadStatsWith(
      Array.from({ length: 6 }, (_, i) => attempt("drill", "D8", i < 5)),
      [],
    );
    const { skills } = await loadStats();
    assert.equal(skills.find((skill) => skill.id === "hoeren").score, null);
    assert.match(skills.find((skill) => skill.id === "hoeren").detail, /6 sampel, akurasi 83%/);
  }

  console.log("F5-GAP-01: readiness dihitung dari mastery+accuracy bila sampel cukup; null + konteks jujur bila tidak.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
