// F3-ENQUEUE: bukti [P] eksekusi nyata — menyelesaikan pelajaran memasukkan
// 8-10 kata ke SRS dengan item_key/objectiveId benar pada DB uji terisolasi.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}
function load(file, mocks) {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => {
      assert.ok(Object.hasOwn(mocks, id), `dependency tak terduga ${id} di ${file}`);
      return mocks[id];
    }, mod, mod.exports,
  );
  return mod.exports;
}

(async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE decks(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, level TEXT, topic TEXT, kind TEXT, UNIQUE(name,level,topic));
    CREATE TABLE entries(id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, de TEXT NOT NULL UNIQUE,
      article TEXT, plural TEXT, forms_json TEXT, meaning_id TEXT NOT NULL, example_de TEXT, example_id TEXT,
      tags TEXT, audio_ok INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE cards(id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id INTEGER NOT NULL REFERENCES entries(id),
      type TEXT NOT NULL, deck_id INTEGER REFERENCES decks(id), UNIQUE(entry_id,type,deck_id));
    CREATE TABLE srs_state(card_id INTEGER PRIMARY KEY REFERENCES cards(id), due TEXT NOT NULL);
    CREATE TABLE config(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE lesson_drafts(key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE lesson_progress(id INTEGER PRIMARY KEY AUTOINCREMENT, unit_no INTEGER, lesson_no INTEGER,
      state TEXT, score REAL, finished_at TEXT, UNIQUE(unit_no,lesson_no));
  `);
  const bind = (query, params) => {
    const values = [];
    const text = query.replace(/\$(\d+)/g, (_, n) => { values.push(params[+n - 1]); return "?"; });
    return { text, values };
  };
  const db = {
    async select(query, params = []) { const b = bind(query, params); return sqlite.prepare(b.text).all(...b.values); },
    async execute(query, params = []) { const b = bind(query, params); return sqlite.prepare(b.text).run(...b.values); },
  };
  const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-19T17:30:00Z" };
  const persistence = load("src/lessons/persistence.ts", { "../stores/db": dbModule });
  const cards = load("src/srs/cards.ts", { "../stores/db": dbModule });

  // Data nyata dari JSON pelajaran dan seed (bukan fixture hasil migrasi).
  const units = JSON.parse(fs.readFileSync("src/data/lessons/units_a1.json", "utf8"));
  const lesson = units.units.find((u) => u.unit === 5).lessons.find((l) => l.no === 1);
  const seedWords = new Map();
  for (const file of fs.readdirSync("src/data/seed").filter((name) => /^words_.*\.json$/.test(name))) {
    for (const word of JSON.parse(fs.readFileSync(`src/data/seed/${file}`, "utf8")).words) {
      seedWords.set(word.de, word.meaning_id);
    }
  }
  const insertEntry = sqlite.prepare(
    "INSERT INTO entries(kind,de,article,plural,meaning_id,example_de,example_id,tags) VALUES('noun',?,'die','-',?,?,?,'a1,unit5')",
  );
  for (const de of lesson.vocab) {
    const meaning = seedWords.get(de);
    assert.ok(meaning, `kata ${de} harus ada di seed nyata`);
    insertEntry.run(de, meaning, `Ich habe einen ${de}.`, `Saya punya ${meaning}.`);
  }
  const entriesBefore = sqlite.prepare("SELECT COUNT(*) n FROM entries").get().n;
  const cardsBefore = sqlite.prepare("SELECT COUNT(*) n FROM cards").get().n;

  const deps = {
    "../stores/db": dbModule,
    "../lessons/persistence": persistence,
    "../lessons/units": {
      CHECKPOINT_LESSON_NO: 99,
      getUnit: (unitNo) => units.units.find((unit) => unit.unit === unitNo),
    },
    "../lessons/objectives": {
      objectivesOfUnit: () => [{ id: "a1-u5-o1", lessonNos: [1] }],
    },
    "../srs/cards": cards,
    "../lessons/checkpointStore": { saveCheckpointResult: async () => ({}) },
  };
  const flow = load("src/app/flowPersistence.ts", deps);

  const finish = () => flow.saveLessonFlowProgress({
    unitNo: 5, lessonNo: 1, page: 4,
    answers: [{ id: "q1", picked: "der", correct: true }],
  }, true);
  await finish();
  await finish(); // Selesai berulang harus idempoten

  const metaRow = sqlite.prepare("SELECT value FROM config WHERE key=?").get("klab_lesson_enqueue:5:1");
  assert.ok(metaRow, "metadata enqueue ditulis");
  const meta = JSON.parse(metaRow.value);
  assert.equal(meta.words.length, 8, "8 kata pelajaran masuk SRS (bukan asersi teks)");
  assert.ok(meta.words.length >= 8 && meta.words.length <= 10);
  for (const word of meta.words) {
    assert.ok(lesson.vocab.includes(word.itemKey.split(":").pop()), `itemKey ${word.itemKey} berasal dari vocab pelajaran`);
    assert.equal(word.objectiveId, "a1-u5-o1");
    assert.ok(word.cardTypes.includes("recog") && word.cardTypes.includes("produce"));
  }
  const cardCount = sqlite.prepare("SELECT COUNT(*) n FROM cards").get().n;
  assert.equal(cardCount, 8 * 4, "8 kata × 4 arah kartu, tidak digandakan saat retry");
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM entries").get().n, entriesBefore, "tidak ada entri fiktif baru");
  assert.equal(cardsBefore, 0, "kartu dibuat oleh enqueue pada eksekusi ini");
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) n FROM lesson_progress WHERE unit_no=5 AND lesson_no=1").get().n, 1,
    "progres pelajaran tetap satu baris",
  );

  const evidence = {
    task: "F3-ENQUEUE",
    scenario: "selesaikan U5 L1 (8 kata) dua kali pada DB uji terisolasi",
    actual: {
      words: meta.words.map((word) => word.itemKey),
      objectiveId: meta.objectiveId,
      card_count: cardCount,
      entries_before: entriesBefore,
      entries_after: sqlite.prepare("SELECT COUNT(*) n FROM entries").get().n,
    },
    expected: "8-10 kata dari pelajaran dengan item_key/objectiveId benar, kartu dibuat, retry idempoten",
    pass: true,
  };
  fs.mkdirSync("outputs/penyelesaian-windows", { recursive: true });
  fs.writeFileSync("outputs/penyelesaian-windows/agent-1a-f3-enqueue.json", JSON.stringify(evidence, null, 2) + "\n", "utf8");
  console.log("F3-ENQUEUE: 8 kata U5 L1 masuk SRS dengan objectiveId a1-u5-o1 dan 32 kartu; retry idempoten.");
  sqlite.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
