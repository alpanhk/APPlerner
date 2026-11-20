// Exercise real seed synchronization against an isolated SQLite database.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
let source = fs.readFileSync("src/data/seedLoader.ts", "utf8");
source = source.replace(/const wordModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const wordModules = {};")
  .replace(/const textModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const textModules = {};");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
const manifest = JSON.parse(fs.readFileSync("src/data/seed/seed_v11_manifest.json", "utf8"));
new Function("require", "module", "exports", code)(
  (request) => request.includes("seed_v11_manifest") ? manifest : {},
  mod,
  mod.exports,
);
function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("CREATE TABLE config(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE entries(kind TEXT NOT NULL,de TEXT UNIQUE,article TEXT,plural TEXT,meaning_id TEXT NOT NULL,example_de TEXT,example_id TEXT,tags TEXT,audio_ok INTEGER); CREATE TABLE texts(id INTEGER PRIMARY KEY,title TEXT,level TEXT,tags TEXT,body_json TEXT); CREATE TABLE reading_log(id INTEGER PRIMARY KEY,text_id INTEGER,ts TEXT,words_saved INTEGER)");
  function bind(query, params) { const values = []; const text = query.replace(/\$(\d+)/g, (_, n) => { values.push(params[+n - 1]); return "?"; }); return { text, values }; }
  return { sql, async select(query, params = []) { const b = bind(query, params); return sql.prepare(b.text).all(...b.values); }, async execute(query, params = []) { const b = bind(query, params); return sql.prepare(b.text).run(...b.values); } };
}
const word = (de, plural, meaning) => ({ kind: "noun", de, article: "das", plural, meaning_id: meaning, example_de: null, example_id: null, tags: "a1,unit1" });
const seed = (words) => [{ unit: 1, level: "A1", words }];
(async () => {
  const db = database();
  await mod.exports.syncSeedWords(db, 0, seed([word("Haus", "die Haus", "rumah"), word("Buch", "die Bücher", "buku")]));
  db.sql.exec("UPDATE entries SET meaning_id='rumah pribadi' WHERE de='Haus'; DELETE FROM entries WHERE de='Buch';");
  await mod.exports.syncSeedWords(db, 12, seed([word("Haus", "die Häuser", "rumah baru"), word("Buch", "die Bücher", "buku"), word("Auto", "die Autos", "mobil")]));
  const house = db.sql.prepare("SELECT meaning_id,plural FROM entries WHERE de='Haus'").get();
  assert.equal(house.meaning_id, "rumah pribadi");
  assert.equal(house.plural, "die Häuser");
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM entries WHERE de='Buch'").get().n, 0);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM entries WHERE de='Auto'").get().n, 1);
  // An existing installation without a snapshot must not recreate words that
  // were part of the shipped baseline (deleted by the user).
  const legacy = database();
  await mod.exports.syncSeedWords(legacy, 12, seed([word("Buch", "die Bücher", "buku")]), { words: ["Buch"], texts: [] });
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) AS n FROM entries").get().n, 0);
  const reading = database();
  const text = (title, id) => ({ title, level: "A1", tags: "seed", sentences: [{ de: "Hallo.", id }] });
  await mod.exports.ensureTexts(reading, [text("Alpha", "Halo"), text("Beta", "Halo"), text("Delta", "Halo")]);
  reading.sql.exec("INSERT INTO config(key,value) VALUES ('seed_version','12'); UPDATE texts SET body_json='user edit' WHERE title='Alpha'; DELETE FROM texts WHERE title='Beta'; INSERT INTO texts(id,title,level,tags,body_json) SELECT 20,title,level,tags,body_json FROM texts WHERE title='Alpha'; INSERT INTO reading_log(text_id,ts,words_saved) VALUES(20,'2026-01-01',0);");
  await mod.exports.ensureTexts(reading, [text("Alpha", "Halo baru"), text("Beta", "Halo"), text("Gamma", "Halo"), text("Delta", "Halo baru")], { words: [], texts: [["Alpha", "A1", "seed"], ["Beta", "A1", "seed"], ["Delta", "A1", "seed"]] });
  assert.equal(reading.sql.prepare("SELECT body_json FROM texts WHERE title='Alpha'").get().body_json, "user edit");
  assert.equal(reading.sql.prepare("SELECT COUNT(*) AS n FROM texts WHERE title='Beta'").get().n, 0);
  assert.equal(reading.sql.prepare("SELECT COUNT(*) AS n FROM texts WHERE title='Gamma'").get().n, 1);
  assert.equal(JSON.parse(reading.sql.prepare("SELECT body_json FROM texts WHERE title='Delta'").get().body_json)[0].id, "Halo baru");
  assert.equal(reading.sql.prepare("SELECT COUNT(*) AS n FROM reading_log WHERE text_id=(SELECT id FROM texts WHERE title='Alpha')").get().n, 1);
  reading.sql.close();
  db.sql.close(); legacy.sql.close();
  console.log("Seed sync preserves user edits/deletions and applies safe corrections.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
