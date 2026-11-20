// CONTENT-PARITY seed/database: identitas file baseline, field seed, teks,
// unit global, kartu, dan link progres. Bukan sekadar jumlah.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");
const root = process.cwd();

function loadModule(file, mapping = {}) {
  let source = fs.readFileSync(file, "utf8");
  source = source.replace(/const wordModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const wordModules = {};")
    .replace(/const textModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const textModules = {};");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => mapping[id] ?? {}, mod, mod.exports);
  return mod.exports;
}

const baseline = JSON.parse(fs.readFileSync(path.join(root, "docs/architecture/evidence-2026-11-17/legacy-content-baseline.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "src/data/seed/seed_v11_manifest.json"), "utf8"));
const seedLoader = loadModule(path.join(root, "src/data/seedLoader.ts"), {
  "./seed/seed_v11_manifest.json": manifest,
});
const seeds = fs.readdirSync(path.join(root, "src/data/seed"))
  .filter((name) => /^words_.*\.json$/.test(name))
  .map((name) => JSON.parse(fs.readFileSync(path.join(root, "src/data/seed", name), "utf8")));
const texts = fs.readdirSync(path.join(root, "src/data/reading"))
  .filter((name) => /^texts_.*\.json$/.test(name))
  .flatMap((name) => JSON.parse(fs.readFileSync(path.join(root, "src/data/reading", name), "utf8")).texts);

function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`
    CREATE TABLE config(key TEXT PRIMARY KEY,value TEXT);
    CREATE TABLE decks(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,level TEXT,topic TEXT,kind TEXT NOT NULL DEFAULT 'vocab',UNIQUE(name,level,topic));
    CREATE TABLE entries(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,de TEXT NOT NULL UNIQUE,article TEXT,plural TEXT,forms_json TEXT,meaning_id TEXT NOT NULL,example_de TEXT,example_id TEXT,tags TEXT,audio_ok INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE cards(id INTEGER PRIMARY KEY AUTOINCREMENT,entry_id INTEGER NOT NULL REFERENCES entries(id),type TEXT NOT NULL,deck_id INTEGER REFERENCES decks(id),UNIQUE(entry_id,type,deck_id));
    CREATE TABLE srs_state(card_id INTEGER PRIMARY KEY REFERENCES cards(id),due TEXT NOT NULL,stability REAL NOT NULL DEFAULT 0,difficulty REAL NOT NULL DEFAULT 0,reps INTEGER NOT NULL DEFAULT 0,lapses INTEGER NOT NULL DEFAULT 0,last_grade TEXT,state TEXT NOT NULL DEFAULT 'new',last_review TEXT);
    CREATE TABLE texts(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,level TEXT NOT NULL,body_json TEXT NOT NULL,tags TEXT);
    CREATE TABLE reading_log(id INTEGER PRIMARY KEY AUTOINCREMENT,text_id INTEGER NOT NULL,ts TEXT NOT NULL DEFAULT '',words_saved INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE lesson_progress(id INTEGER PRIMARY KEY AUTOINCREMENT,unit_no INTEGER NOT NULL,lesson_no INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'locked',score REAL,finished_at TEXT,UNIQUE(unit_no,lesson_no));
  `);
  function bind(query, params) {
    const values = [];
    const sqlText = query.replace(/\$(\d+)/g, (_, n) => { values.push(params[+n - 1]); return "?"; });
    return { sqlText, values };
  }
  return {
    sql,
    async select(query, params = []) { const b = bind(query, params); return sql.prepare(b.sqlText).all(...b.values); },
    async execute(query, params = []) { const b = bind(query, params); return sql.prepare(b.sqlText).run(...b.values); },
  };
}

(async () => {
  // 1. Identitas file seed/bacaan: hash baseline yang tidak boleh berubah.
  // Koreksi A1 objectives/bank diawasi gate konten Agent 2 dengan delta resmi.
  const seedBaselineFiles = Object.entries(baseline.files).filter(
    ([rel]) => rel.startsWith("src/data/seed/") || rel.startsWith("src/data/reading/"),
  );
  let same = 0;
  for (const [rel, record] of seedBaselineFiles) {
    const file = path.join(root, rel);
    assert.ok(fs.existsSync(file), `baseline file hilang: ${rel}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    assert.equal(hash, record.sha256, `hash seed/bacaan berubah tanpa delta: ${rel}`);
    same += 1;
  }
  assert.equal(same, seedBaselineFiles.length);

  // 2. Seed install: field, bukan hanya jumlah.
  const byDe = new Map();
  for (const seed of seeds) for (const word of seed.words) if (!byDe.has(word.de)) byDe.set(word.de, word);
  assert.equal(byDe.size, baseline.summary.seed_unique_de, "jumlah kata unik berubah");
  const db = database();
  await seedLoader.syncSeedWords(db, 0, seeds, manifest);
  await seedLoader.ensureTexts(db, texts, manifest);
  const rows = db.sql.prepare("SELECT kind,de,article,plural,meaning_id,example_de,example_id,tags FROM entries").all();
  assert.equal(rows.length, baseline.summary.seed_word_rows);
  for (const row of rows) {
    const source = byDe.get(row.de);
    assert.ok(source, `kata DB tanpa sumber seed: ${row.de}`);
    for (const field of ["kind", "article", "plural", "meaning_id", "example_de", "example_id", "tags"]) {
      assert.equal(row[field], source[field], `${row.de}.${field}`);
    }
  }

  const textRows = db.sql.prepare("SELECT title,level,body_json,tags FROM texts").all();
  assert.equal(textRows.length, baseline.summary.seed_text_rows);
  const textByKey = new Map(texts.map((t) => [JSON.stringify([t.title, t.level, t.tags]), JSON.stringify(t.sentences)]));
  for (const row of textRows) {
    const key = JSON.stringify([row.title, row.level, row.tags]);
    assert.equal(row.body_json, textByKey.get(key), `body teks berubah: ${row.title}`);
  }

  // 3. Unit global/lesson identity vs baseline.
  const currentUnits = new Map();
  for (const level of ["a1", "a2", "b1", "b2"]) {
    const parsed = JSON.parse(fs.readFileSync(path.join(root, `src/data/lessons/units_${level}.json`), "utf8"));
    for (const unit of parsed.units) {
      assert.ok(!currentUnits.has(unit.unit), `unit_no duplikat: ${unit.unit}`);
      currentUnits.set(unit.unit, { title: unit.title, goals: unit.goals ?? [], lessons: unit.lessons });
    }
  }
  assert.equal(currentUnits.size, 42);
  let lessonCount = 0;
  for (const level of Object.keys(baseline.levels)) {
    for (const baseUnit of baseline.levels[level].units) {
      const unit = currentUnits.get(baseUnit.unit);
      assert.ok(unit, `unit baseline hilang: ${level} ${baseUnit.unit}`);
      assert.equal(unit.title, baseUnit.title, `judul unit berubah: ${baseUnit.unit}`);
      assert.equal(unit.goals.length, baseUnit.goals.length, `jumlah goals berubah: ${baseUnit.unit}`);
      for (const baseLesson of baseUnit.lessons) {
        const lesson = unit.lessons.find((candidate) => candidate.no === baseLesson.no);
        assert.ok(lesson, `pelajaran hilang: ${baseUnit.unit}/${baseLesson.no}`);
        assert.equal(lesson.title, baseLesson.title, `judul pelajaran berubah: ${baseUnit.unit}/${baseLesson.no}`);
        assert.equal(lesson.slides.length, baseLesson.slides, `jumlah slide berubah: ${baseUnit.unit}/${baseLesson.no}`);
        lessonCount += 1;
      }
    }
  }
  assert.equal(lessonCount, 96);

  // 4. Kartu default dan link progres global.
  db.sql.exec("INSERT OR IGNORE INTO decks(name,level,topic,kind) VALUES('A1 Unit 1','A1','','vocab')");
  const deckId = db.sql.prepare("SELECT id FROM decks LIMIT 1").get().id;
  for (const type of ["recog", "produce", "listen"]) {
    db.sql.prepare("INSERT OR IGNORE INTO cards(entry_id,type,deck_id) SELECT id,?,? FROM entries").run(type, deckId);
  }
  db.sql.prepare("INSERT OR IGNORE INTO cards(entry_id,type,deck_id) SELECT id,'cloze',? FROM entries WHERE example_de IS NOT NULL AND example_de <> ''").run(deckId);
  const orphan = db.sql.prepare("SELECT COUNT(*) n FROM cards c LEFT JOIN entries e ON e.id=c.entry_id WHERE e.id IS NULL").get().n;
  assert.equal(orphan, 0);
  const missingCards = db.sql.prepare("SELECT COUNT(*) n FROM entries e WHERE (SELECT COUNT(*) FROM cards c WHERE c.entry_id=e.id) < 3").get().n;
  assert.equal(missingCards, 0);
  const prog = db.sql.prepare("INSERT INTO lesson_progress(unit_no,lesson_no,state,score) VALUES(?,?,'done',100)");
  for (const [unitNo, unit] of currentUnits) for (const lesson of unit.lessons) prog.run(unitNo, lesson.no);
  assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM lesson_progress").get().n, 96);
  const duplicateProgress = db.sql.prepare("SELECT COUNT(*) n FROM (SELECT unit_no,lesson_no,COUNT(*) c FROM lesson_progress GROUP BY unit_no,lesson_no HAVING c>1)").get().n;
  assert.equal(duplicateProgress, 0);

  console.log("CONTENT-PARITY seed: hash seed/bacaan baseline, 2134 kata field-exact, 67 teks, 42 unit/96 lesson global, kartu/progres terhubung.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
