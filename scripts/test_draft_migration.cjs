// DB-03: migrasi draft localStorage -> SQLite (tanpa Tauri, DB tiruan).
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const source = fs.readFileSync("src/lessons/persistence.ts", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

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
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-17T09:00:00Z" };
const mod = { exports: {} };
new Function("require", "module", "exports", code)(
  (id) => id === "../stores/db" ? dbModule : {},
  mod,
  mod.exports,
);

(async () => {
  const key = "lernen_lesson_1_1";
  const legacy = { step: 2, slide: 1 };
  storage.set(key, JSON.stringify(legacy));
  const loaded = await mod.exports.loadDraftWithLegacy(key, (raw) => JSON.parse(raw));
  assert.deepEqual(loaded, legacy);
  assert.equal(JSON.parse(rows.get(key)).step, 2, "draft harus pindah ke SQLite");
  assert.equal(storage.has(key), false, "localStorage dibersihkan setelah migrasi");

  // Draft SQLite yang sudah ada menang; legacy tidak menimpa.
  rows.set(key, JSON.stringify({ step: 3, slide: 2 }));
  storage.set(key, JSON.stringify({ step: 0, slide: 0 }));
  assert.deepEqual(await mod.exports.loadDraftWithLegacy(key, (raw) => JSON.parse(raw)), { step: 3, slide: 2 });
  assert.deepEqual(JSON.parse(rows.get(key)), { step: 3, slide: 2 });

  // Data rusak tidak dimigrasikan.
  storage.set("rusak", "{");
  assert.equal(await mod.exports.loadDraftWithLegacy("rusak", (raw) => { try { return JSON.parse(raw); } catch { return null; } }), null);
  assert.equal(rows.has("rusak"), false);

  await mod.exports.deleteDraft(key);
  assert.equal(rows.has(key), false);
  console.log("DB-03 draft: migrasi localStorage -> SQLite, SQLite menang, data rusak ditolak, delete bersih.");
})().catch((e) => { console.error(e); process.exitCode = 1; });
