// DB-01: upgrade seed v11 -> v12 tanpa snapshot.
// Kasus: hapus pengguna dipertahankan, konten baru 120 kata/17 teks terpasang,
// kegagalan sebagian + retry, snapshot v12 kosong, dan idempotensi.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const ts = require("typescript");

const manifest = JSON.parse(fs.readFileSync("src/data/seed/seed_v11_manifest.json", "utf8"));
const provenance = JSON.parse(fs.readFileSync("src/data/provenance/seed_v11_fields.json", "utf8"));
let source = fs.readFileSync("src/data/seedLoader.ts", "utf8");
source = source.replace(/const wordModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const wordModules = {};")
  .replace(/const textModules = import\.meta\.glob[\s\S]*?\n\}\);/, "const textModules = {};");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", code)(
  (request) => request.includes("seed_v11_manifest") ? manifest : request.includes("seed_v11_fields") ? provenance : {},
  mod,
  mod.exports,
);

function loadSeeds() {
  return fs.readdirSync("src/data/seed")
    .filter((name) => /^words_.*\.json$/.test(name))
    .map((name) => JSON.parse(fs.readFileSync(`src/data/seed/${name}`, "utf8")));
}
function loadTexts() {
  return fs.readdirSync("src/data/reading")
    .filter((name) => /^texts_.*\.json$/.test(name))
    .flatMap((name) => JSON.parse(fs.readFileSync(`src/data/reading/${name}`, "utf8")).texts);
}
function database(options = {}) {
  const sql = new DatabaseSync(":memory:");
  sql.exec("CREATE TABLE config(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE entries(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,de TEXT UNIQUE,article TEXT,plural TEXT,meaning_id TEXT NOT NULL,example_de TEXT,example_id TEXT,tags TEXT,audio_ok INTEGER); CREATE TABLE texts(id INTEGER PRIMARY KEY,title TEXT,level TEXT,tags TEXT,body_json TEXT); CREATE TABLE reading_log(id INTEGER PRIMARY KEY,text_id INTEGER,ts TEXT,words_saved INTEGER); CREATE TABLE decks(id INTEGER PRIMARY KEY,name TEXT); CREATE TABLE cards(id INTEGER PRIMARY KEY,entry_id INTEGER,type TEXT,deck_id INTEGER); CREATE TABLE srs_state(card_id INTEGER PRIMARY KEY,due_at TEXT,reps INTEGER,lapses INTEGER); CREATE TABLE attempts(id INTEGER PRIMARY KEY,item_key TEXT,objective_id TEXT,correct INTEGER); CREATE TABLE lesson_progress(unit_no INTEGER,lesson_no INTEGER,state TEXT,score INTEGER)");
  let writes = 0;
  function bind(query, params) {
    const values = [];
    const text = query.replace(/\$(\d+)/g, (_, n) => { values.push(params[+n - 1]); return "?"; });
    return { text, values };
  }
  return {
    sql,
    async select(query, params = []) { const b = bind(query, params); return sql.prepare(b.text).all(...b.values); },
    async execute(query, params = []) {
      writes += 1;
      if (options.failAt && writes === options.failAt) throw new Error("injected seed failure");
      const b = bind(query, params);
      return sql.prepare(b.text).run(...b.values);
    },
  };
}
const word = (de, tags = "a1,seed") => ({ kind: "noun", de, article: null, plural: null, meaning_id: `arti ${de}`, example_de: null, example_id: null, tags });
const text = (title) => ({ title, level: "A1", tags: "seed,a1", sentences: [{ de: `Hallo ${title}.`, id: "Halo." }] });

function seedLegacy(db) {
  for (const de of manifest.words) {
    const w = word(de);
    db.sql.prepare("INSERT OR IGNORE INTO entries(kind,de,article,plural,meaning_id,example_de,example_id,tags,audio_ok) VALUES(?,?,?,?,?,?,?,?,0)")
      .run(w.kind, w.de, w.article, w.plural, w.meaning_id, w.example_de, w.example_id, w.tags);
  }
  for (const [title, level, tags] of manifest.texts) {
    db.sql.prepare("INSERT INTO texts(title,level,tags,body_json) VALUES(?,?,?,?)")
      .run(title, level, tags, JSON.stringify([{ de: `Hallo ${title}.`, id: "Halo." }]));
  }
  db.sql.prepare("INSERT INTO config(key,value) VALUES('seed_version','11')").run();
}

function counts(db) {
  return {
    words: db.sql.prepare("SELECT COUNT(*) n FROM entries").get().n,
    texts: db.sql.prepare("SELECT COUNT(*) n FROM texts").get().n,
  };
}

(async () => {
  const seeds = loadSeeds();
  const texts = loadTexts();
  const baselineWords = manifest.words.length;
  const baselineTexts = manifest.texts.length;
  assert.equal(baselineWords, 2014);
  assert.equal(baselineTexts, 50);

  // Profil v11 tanpa snapshot juga menerima pengayaan field yang belum
  // disunting. Hitung ekspektasinya dari data saat ini agar tes tetap sah
  // ketika Agent 2 menambah contoh/plural.
  const seedFirst = new Map();
  for (const seed of seeds) for (const w of seed.words) if (!seedFirst.has(w.de)) seedFirst.set(w.de, w);
  const provenanceFields = ["article", "plural", "example_de", "example_id"];
  const enrichmentWords = (deleted) => {
    let n = 0;
    for (const [de, w] of seedFirst) {
      if (deleted.has(de)) continue;
      const base = provenance.words[de];
      if (!base) continue;
      const shipped = word(de);
      if (provenanceFields.some((field, index) => (base[index] ?? null) === null && (w[field] ?? null) !== null)) n += 1;
    }
    return n;
  };

  // 1) Upgrade v11 tanpa snapshot: 120 kata + 17 teks baru, hapus/edit pengguna aman.
  const db = database();
  seedLegacy(db);
  assert.deepEqual(counts(db), { words: baselineWords, texts: baselineTexts });
  db.sql.exec("UPDATE entries SET meaning_id='edit pengguna' WHERE de='Haus'; DELETE FROM entries WHERE de='Buch';");
  db.sql.exec("UPDATE texts SET body_json='[\"edit pengguna\"]' WHERE title=(SELECT MIN(title) FROM texts); DELETE FROM texts WHERE title=(SELECT MAX(title) FROM texts);");
  const editedWord = db.sql.prepare("SELECT meaning_id FROM entries WHERE de='Haus'").get().meaning_id;
  const editedText = db.sql.prepare("SELECT body_json FROM texts WHERE title=(SELECT MIN(title) FROM texts)").get().body_json;
  const changed = await mod.exports.syncSeedWords(db, 11, seeds, manifest, provenance);
  const addedTexts = await mod.exports.ensureTexts(db, texts, manifest, provenance);
  const enrich1 = enrichmentWords(new Set(["Buch"]));
  assert.equal(changed, 120 + enrich1, `kata baru 120 + pengayaan ${enrich1}, dapat ${changed}`);
  assert.equal(addedTexts, 17, `teks baru harus 17, dapat ${addedTexts}`);
  assert.equal(counts(db).words, baselineWords - 1 + 120);
  assert.equal(counts(db).texts, baselineTexts - 1 + 17);
  assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Buch'").get().n, 0, "hapusan lama tidak boleh hidup lagi");
  assert.equal(db.sql.prepare("SELECT meaning_id FROM entries WHERE de='Haus'").get().meaning_id, editedWord, "edit pengguna tidak boleh ditimpa");
  assert.equal(db.sql.prepare("SELECT body_json FROM texts WHERE title=(SELECT MIN(title) FROM texts)").get().body_json, editedText, "edit teks tidak boleh ditimpa");

  // 2) Idempoten: putaran kedua tidak menambah apa pun.
  assert.equal(await mod.exports.syncSeedWords(db, 12, seeds, manifest), 0);
  assert.equal(await mod.exports.ensureTexts(db, texts, manifest), 0);

  // 3) Kegagalan sebagian lalu retry: tidak ada duplikat, snapshot baru ditulis setelah sukses.
  const flaky = database({ failAt: 60 });
  seedLegacy(flaky);
  flaky.sql.exec("DELETE FROM entries WHERE de='Buch';");
  await assert.rejects(mod.exports.syncSeedWords(flaky, 11, seeds, manifest));
  assert.equal(flaky.sql.prepare("SELECT COUNT(*) n FROM config WHERE key='seed_word_snapshot_v1'").get().n, 0);
  const partial = flaky.sql.prepare("SELECT COUNT(*) n FROM entries").get().n;
  assert.ok(partial > baselineWords - 1 && partial < baselineWords - 1 + 120, "kegagalan harus di tengah proses");
  await mod.exports.syncSeedWords(flaky, 11, seeds, manifest);
  assert.equal(flaky.sql.prepare("SELECT COUNT(*) n FROM entries").get().n, baselineWords - 1 + 120);
  assert.equal(flaky.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Buch'").get().n, 0);

  // 4) Profil sudah v12 dengan snapshot kosong: konten baru dipasang, hapusan lama tetap hilang.
  const broken = database();
  seedLegacy(broken);
  broken.sql.exec("DELETE FROM entries WHERE de='Buch'; INSERT OR REPLACE INTO config(key,value) VALUES('seed_version','12'),('seed_word_snapshot_v1','{}'),('seed_text_snapshot_v1','{}');");
  const brokenEnrich = enrichmentWords(new Set(["Buch"]));
  assert.equal(await mod.exports.syncSeedWords(broken, 12, seeds, manifest, provenance), 120 + brokenEnrich);
  assert.equal(await mod.exports.ensureTexts(broken, texts, manifest, provenance), 17);
  assert.equal(broken.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Buch'").get().n, 0);

  // 5) Profil v12 yang sudah menulis snapshot lengkap tetapi kontennya belum masuk:
  // marker verifikasi belum ada -> 120/17 dipasang sekali, lalu hapusan baru dijaga.
  const half = database();
  seedLegacy(half);
  const seedMap = {};
  for (const seed of seeds) for (const w of seed.words) if (!seedMap[w.de]) seedMap[w.de] = w;
  const textMap = {};
  for (const t of texts) textMap[JSON.stringify([t.title, t.level, t.tags])] = JSON.stringify(t.sentences);
  half.sql.prepare("INSERT OR REPLACE INTO config(key,value) VALUES('seed_version','12'),('seed_word_snapshot_v1',?),('seed_text_snapshot_v1',?)")
    .run(JSON.stringify(seedMap), JSON.stringify(textMap));
  half.sql.exec("DELETE FROM entries WHERE de='Buch'; DELETE FROM texts WHERE title=(SELECT MAX(title) FROM texts);");
  assert.equal(await mod.exports.syncSeedWords(half, 12, seeds, manifest), 120);
  assert.equal(await mod.exports.ensureTexts(half, texts, manifest), 17);
  assert.equal(half.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Buch'").get().n, 0);
  // Setelah verifikasi, hapusan konten baru tidak dihidupkan lagi.
  half.sql.prepare("INSERT INTO config(key,value) VALUES('seed_v12_content_v1','1')").run();
  const addedWord = Object.keys(seedMap).find((de) => !manifest.words.includes(de));
  half.sql.prepare("DELETE FROM entries WHERE de=?").run(addedWord);
  assert.equal(await mod.exports.syncSeedWords(half, 12, seeds, manifest), 0);
  assert.equal(half.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de=?").get(addedWord).n, 0);

  // 6) Profil v11 tanpa snapshot: pengayaan contoh/plural hanya untuk field
  // yang belum disunting. Kartu, jadwal SRS, attempt, progres, dan reading_log
  // tidak berubah; suntingan/hapusan pengguna dipertahankan.
  const prov = {
    words: {
      Haus: ["das", "die Häuser", null, null],
      Buch: ["das", "die Bücher", "Das Buch ist neu.", "Buku itu baru."],
      Baum: ["der", "die Bäume", null, null],
    },
    texts: {
      [JSON.stringify(["Haus", "A1", "seed,a1"])]: JSON.stringify([{ de: "Das Haus ist alt.", id: "Rumah itu tua." }]),
      [JSON.stringify(["Buch", "A1", "seed,a1"])]: JSON.stringify([{ de: "Das Buch ist neu.", id: "Buku itu baru." }]),
    },
  };
  const mini = {
    words: ["Haus", "Buch", "Baum"],
    texts: [["Haus", "A1", "seed,a1"], ["Buch", "A1", "seed,a1"], ["Baum", "A1", "seed,a1"]],
  };
  const enriched = [{
    unit: 1, level: "A1", theme: "uji", source: "uji", seed_version: 13,
    words: [
      { kind: "noun", de: "Haus", article: "das", plural: "die Häuser", meaning_id: "rumah", example_de: "Das Haus ist groß.", example_id: "Rumah itu besar.", tags: "unit1" },
      { kind: "noun", de: "Buch", article: "das", plural: "die Bücher", meaning_id: "buku", example_de: "Das neue Buch.", example_id: "Buku baru itu.", tags: "unit1" },
      { kind: "noun", de: "Baum", article: "der", plural: "die Bäume", meaning_id: "pohon", example_de: "Der Baum ist hoch.", example_id: "Pohon itu tinggi.", tags: "unit1" },
      { kind: "noun", de: "Tisch", article: "der", plural: "die Tische", meaning_id: "meja", example_de: "Der Tisch ist neu.", example_id: "Meja itu baru.", tags: "unit1" },
    ],
  }];
  const textsUpgrade = [
    { title: "Haus", level: "A1", tags: "seed,a1", sentences: [{ de: "Das Haus ist groß.", id: "Rumah itu besar." }] },
    { title: "Buch", level: "A1", tags: "seed,a1", sentences: [{ de: "Das neue Buch.", id: "Buku baru itu." }] },
    { title: "Baum", level: "A1", tags: "seed,a1", sentences: [{ de: "Der Baum ist hoch.", id: "Pohon itu tinggi." }] },
  ];
  const legacy = database();
  legacy.sql.exec(`
    INSERT INTO entries(kind,de,article,plural,meaning_id,example_de,example_id,tags,audio_ok) VALUES
      ('noun','Haus','das','die Häuser','rumah saya',NULL,NULL,'unit1',1),
      ('noun','Buch','das','die Bücher','buku','Mein Buch.','Buku saya','unit1',1);
    INSERT INTO decks(id,name) VALUES(1,'dek');
    INSERT INTO cards(id,entry_id,type,deck_id) VALUES(1,1,'recog',1),(2,2,'cloze',1);
    INSERT INTO srs_state(card_id,due_at,reps,lapses) VALUES(1,'2026-12-01',4,1);
    INSERT INTO attempts(id,item_key,objective_id,correct) VALUES(1,'A1:1:u1-o1-01','a1-u1-o1',1);
    INSERT INTO lesson_progress(unit_no,lesson_no,state,score) VALUES(1,1,'done',100);
    INSERT INTO config(key,value) VALUES('seed_version','11');
    INSERT INTO reading_log(id,text_id,ts,words_saved) VALUES(1,1,'2026-11-01',12);
  `);
  legacy.sql.prepare("INSERT INTO texts(id,title,level,tags,body_json) VALUES(1,'Haus','A1','seed,a1',?)").run(prov.texts[JSON.stringify(["Haus", "A1", "seed,a1"])]);
  legacy.sql.prepare("INSERT INTO texts(id,title,level,tags,body_json) VALUES(2,'Buch','A1','seed,a1',?)").run(JSON.stringify([{ de: "Mein Buch ist neu.", id: "Buku saya baru." }]));
  const legacyChanged = await mod.exports.syncSeedWords(legacy, 11, enriched, mini, prov);
  const legacyTexts = await mod.exports.ensureTexts(legacy, textsUpgrade, mini, prov);
  assert.equal(legacyChanged, 2, "Haus diperkaya + Tisch baru");
  assert.equal(legacyTexts, 0, "tidak ada teks baru; Haus diperbarui di place");
  assert.equal(legacy.sql.prepare("SELECT meaning_id FROM entries WHERE de='Haus'").get().meaning_id, "rumah saya", "suntingan makna dipertahankan");
  assert.equal(legacy.sql.prepare("SELECT example_de FROM entries WHERE de='Haus'").get().example_de, "Das Haus ist groß.", "contoh kosong diperkaya");
  assert.equal(legacy.sql.prepare("SELECT example_de FROM entries WHERE de='Buch'").get().example_de, "Mein Buch.", "contoh suntingan pengguna dipertahankan");
  assert.equal(legacy.sql.prepare("SELECT example_id FROM entries WHERE de='Buch'").get().example_id, "Buku saya", "terjemahan suntingan dipertahankan");
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Baum'").get().n, 0, "hapusan lama tidak hidup lagi");
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) n FROM entries WHERE de='Tisch'").get().n, 1, "kata baru terpasang");
  assert.equal(legacy.sql.prepare("SELECT body_json FROM texts WHERE title='Haus'").get().body_json, JSON.stringify([{ de: "Das Haus ist groß.", id: "Rumah itu besar." }]), "teks tak tersunting diperbarui");
  assert.equal(legacy.sql.prepare("SELECT body_json FROM texts WHERE title='Buch'").get().body_json, JSON.stringify([{ de: "Mein Buch ist neu.", id: "Buku saya baru." }]), "teks suntingan dipertahankan");
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) n FROM texts WHERE title='Baum'").get().n, 0, "hapusan teks tidak hidup lagi");
  assert.equal(legacy.sql.prepare("SELECT reps FROM srs_state WHERE card_id=1").get().reps, 4, "jadwal SRS utuh");
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) n FROM cards").get().n, 2, "kartu utuh");
  assert.equal(legacy.sql.prepare("SELECT COUNT(*) n FROM attempts").get().n, 1, "attempt utuh");
  assert.equal(legacy.sql.prepare("SELECT score FROM lesson_progress WHERE unit_no=1 AND lesson_no=1").get().score, 100, "progres utuh");
  assert.equal(legacy.sql.prepare("SELECT text_id FROM reading_log WHERE id=1").get().text_id, 1, "reading_log tetap menunjuk teks yang sama");

  console.log("DB-01 seed upgrade: 120 kata + 17 teks, edit/hapus aman, partial+retry, snapshot kosong/lengkap, pengayaan v11 tanpa snapshot, SRS/kartu/attempt/progres utuh.");
})().catch((error) => { console.error(error); process.exitCode = 1; });


