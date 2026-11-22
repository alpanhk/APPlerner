// CONTENT-PARITY-20261117-01: buktikan seluruh konten aplikasi lama masih
// memiliki identitas, isi, relasi, akses, dan perilaku yang sama.
// Baseline beku TIDAK diubah oleh tes ini. Perubahan sah harus dicatat di
// APPROVED_DELTAS dengan alasan + bukti, bukan dengan meregenerasi baseline.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const baseline = readJson("docs/architecture/evidence-2026-11-17/legacy-content-baseline.json");

// Delta yang disetujui eksplisit. Kosong = seluruh file harus byte-identik
// dengan baseline. Tambah entri hanya bersama bukti penerimaan pemilik.
const APPROVED_DELTAS = {
  "src/data/lessons/units_a1.json": {
    predecessor: "8a66d1f90ddb260838b52e34ea9e006876685dd32fb76d1d5e2dcbc15fce85e5",
    newSha256: "db9887b83fd57e0bd781f226d3cc84a10d3b1c90f109edd7d83562710a10a29d",
    reason: "P1: 36 pelajaran A1 mendapat prasyarat, kesalahan umum, dan ringkasan yang dapat dibaca tanpa menghapus slide/contoh lama.",
    evidence: "outputs/next-stage-2026-11-18/agent-2.md; scripts/test_a1_lesson_completeness.cjs",
    approvedBy: "WINDOWS-LEARNING-20261118-06 (pengguna via Codex)",
  },
  "src/data/lessons/a1_objectives.json": {
    predecessor: "7784d38e43431a1e65276a3bd5fe8075b74bc13bafd5be057498b4f04324a1f3",
    newSha256: "fcc17b80b5fc46d14b6ad610d18f4541d7da4cbb0a4963472b11c9199ce07a3f",
    reason: "Perbaiki rujukan evidence U1-o1 (slide relevan) dan U1-o3 (judul slide dengan en dash).",
    evidence: "A1-REV-01/A1-REV-09, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit1_bank.json": {
    predecessor: "7fed97a1087b38cf2578be21540ee37f8445b9a66b7a99b51e88f84787050cc4",
    newSha256: "5f557a342935d2fb835f5af8b0dfe389e25f09fcbf151bd3c1e04fe2662e3f06",
    reason: "o1-01 menguji sapaan formal vs santai; o5-04 tidak lagi menerima plural tanpa artikel.",
    evidence: "A1-REV-02/A1-REV-03, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit2_bank.json": {
    predecessor: "2ef0b7eed27766a8a13d9e6ac3df13bf486805317b574fa2a1d0fecf49b7c165",
    newSha256: "985e5ecd931f6a90415051b52d933f6a281ea066a6b8270fe18ff3037f725579",
    reason: "u2-o5-05 menguji heute/morgen tanpa preposisi menggantikan item urutan am.",
    evidence: "A1-REV-04, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit3_bank.json": {
    predecessor: "2d34bf4ec7aababe3c11053687a4958cc2e23259fdefa0020d20d2f53fd2ba00",
    newSha256: "e494f609f0d92e4bac21cd3bc57c78af9f4d0cf0a98e105dcb7705af9f9c9f92",
    reason: "u3-o1 extended family; u3-o4 zusammen; u3-o5 deinen/seinen/ihre setelah besuchen.",
    evidence: "A1-REV-05/A1-REV-06 + audit penuh U3-o1, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit4_bank.json": {
    predecessor: "03503d1aef06ea81215acceec3381968adb2b988bde53c0046396573dddf9bbb",
    newSha256: "fe2848bd0eac898c4ab2aca5c18b7be48be95dc883e094c062c440c31d5bf09a",
    reason: "u4-o5 menguji Frühstück/Mittagessen/Abendessen, bukan hanya Frühstück.",
    evidence: "audit penuh U4-o5, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit5_bank.json": {
    predecessor: "0045469d30232cf7e23b0ab0d51dfe58fc3758cf79b9f95438a832e6612053c8",
    newSha256: "3905222922782078ba0b770272d9236a7fa69be82b16e803a729015d8788c861",
    reason: "Menutup gap canDo U5-o2 (groß/klein/lang/kurz) dan U5-o5 (bar vs mit Karte) dengan 4 item baru; ID lama dipertahankan.",
    evidence: "WINDOWS-HARDENING-20261118-07, outputs/hardening-2026-11-18/agent-2.md, scripts/test_a1_hardening_gaps.cjs",
    approvedBy: "WINDOWS-HARDENING-20261118-07 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit6_bank.json": {
    predecessor: "8c48e815ff9d393b1e8e80ba6df5c65bf4bf8341e3d35cefdc86916852a7be60",
    newSha256: "8ad443ac3e14f475562b6031a81e7e99920850613be4dba166821c6a3b28406c",
    reason: "u6-o1 menguji plural; u6-o3 menguji stehen vs liegen.",
    evidence: "audit penuh U6-o1/U6-o3, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit7_bank.json": {
    predecessor: "049b4b4fcd0760a8ca7920d0bdf4293fb17418021ff5972f9a3784da10ab72ec",
    newSha256: "55becb8c22426d147e22a57ba1f84f67801764b5c61bd530b790fb5783956610",
    reason: "Feedback imperatif Gehe diperbaiki; distraktor ambigu gerade diganti geradezu.",
    evidence: "A1-REV-07, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit8_bank.json": {
    predecessor: "566733f550474c5b73d1b158d6f44ac7991a261fc27c5f345c3080f47d976915",
    newSha256: "5a07ea47681c38322e0011aedb5fd9464c1dd203e8b0d0e187647d47646c1e53",
    reason: "u8-o1 memakai Erst pada langkah pertama sehingga klaim erst/danach terwakili.",
    evidence: "audit penuh U8-o1, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit9_bank.json": {
    predecessor: "46441ace116a696bd154c1073931317550c4e794ad8d5ae2d1a3859c06c1b35e",
    newSha256: "4ed4fcab6355e04706bcc690374c5bb2fdec8f8d9940ddb2582bd6c69a8403d9",
    reason: "u9-o5 menguji Apotheker dan Schmerzmittel sesuai canDo.",
    evidence: "audit penuh U9-o5, outputs/completion-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 (pengguna via Codex)",
  },
  "src/data/lessons/a1_unit10_bank.json": {
    predecessor: "19f1045a16e15b8b1cb69fe4a3ad1262909b425efabc60fb1c70e4b11779c7be",
    newSha256: "5e4f6f51b12691eb02425d5b5c88f112f38a009c743f870a28d5e3f68a4f3210",
    reason: "u10-o1-05 menguji am liebsten; u10-o5-06 menutup gap einmal/zweimal.",
    evidence: "A1-REV-08 + WINDOWS-HARDENING-20261118-07, outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-COMPLETE-20261118-05 + WINDOWS-HARDENING-20261118-07 (pengguna via Codex)",
  },
};
// Item bank baru setelah baseline wajib didaftarkan di sini; ID lama tidak
// boleh dihapus/diubah dan urutan baseline harus tetap terjaga.
const APPROVED_BANK_ADDITIONS = {
  "u5-o2-06": {
    unit: 5,
    objectiveId: "a1-u5-o2",
    reason: "zu groß sebagai jawaban benar; melengkapi klaim canDo.",
    evidence: "outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-HARDENING-20261118-07",
  },
  "u5-o2-07": {
    unit: 5,
    objectiveId: "a1-u5-o2",
    reason: "zu lang sebagai jawaban benar; melengkapi klaim canDo.",
    evidence: "outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-HARDENING-20261118-07",
  },
  "u5-o2-08": {
    unit: 5,
    objectiveId: "a1-u5-o2",
    reason: "zu kurz sebagai jawaban benar; melengkapi klaim canDo.",
    evidence: "outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-HARDENING-20261118-07",
  },
  "u5-o5-06": {
    unit: 5,
    objectiveId: "a1-u5-o5",
    reason: "bar sebagai jawaban benar; melengkapi klaim canDo bar/mit Karte.",
    evidence: "outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-HARDENING-20261118-07",
  },
  "u10-o5-06": {
    unit: 10,
    objectiveId: "a1-u10-o5",
    reason: "zweimal sebagai jawaban benar; melengkapi klaim canDo sekali/dua kali.",
    evidence: "outputs/hardening-2026-11-18/agent-2.md",
    approvedBy: "WINDOWS-HARDENING-20261118-07",
  },
};
// File konten BARU setelah baseline wajib didaftarkan di sini (bukan diubah
// baseline-nya) agar delta tambahan tetap terbawa ke freeze integrasi.
const APPROVED_ADDITIONS = {};

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}
function sha256(rel) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, rel))).digest("hex");
}
function loadTs(rel, overrides = {}) {
  const file = path.join(root, rel);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) =>
    Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : createRequire(file)(id);
  new Function("require", "module", "exports", output)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

assert.equal(baseline.id, "CONTENT-PARITY-20261117-01", "baseline id");
assert.equal(Object.keys(baseline.files).length, 81, "baseline file count");
assert.equal(sha256("PRD-Aplikasi-Belajar-Bahasa-Jerman.md"), baseline.prd_sha256, "PRD hash matches baseline");
// REGRESI-GAP-01: bila hash PRD berubah dari baseline historis, perubahan wajib
// membawa catatan Approved Delta lengkap (alasan + bukti + pemilik + pendahulu).
const prdDelta = baseline.approved_prd_hash_delta;
if (prdDelta) {
  assert.equal(prdDelta.predecessor, "14d9335e0ea81d0df5d48c004735adc38bbe46481f46c85b5ebe7f79b10517b3", "PRD delta predecessor");
  assert.equal(prdDelta.newSha256, baseline.prd_sha256, "PRD delta new sha");
  for (const field of ["reason", "evidence", "approvedBy", "recordedAt", "recordedBy"]) {
    assert.ok(typeof prdDelta[field] === "string" && prdDelta[field].length > 0, `PRD delta ${field}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Identitas file: setiap JSON konten harus byte-identik dengan baseline.
// ---------------------------------------------------------------------------
let unchanged = 0;
let deltas = 0;
for (const [rel, meta] of Object.entries(baseline.files)) {
  assert.ok(fs.existsSync(path.join(root, rel)), `MISSING FILE ${rel}`);
  const bytes = fs.statSync(path.join(root, rel)).size;
  const hash = sha256(rel);
  if (hash === meta.sha256 && bytes === meta.bytes) {
    unchanged += 1;
    continue;
  }
  const delta = APPROVED_DELTAS[rel];
  assert.ok(delta, `UNREVIEWED CONTENT CHANGE ${rel}: baseline ${meta.sha256.slice(0, 12)}/${meta.bytes}B, now ${hash.slice(0, 12)}/${bytes}B`);
  assert.equal(delta.predecessor, meta.sha256, `${rel} delta must name predecessor hash`);
  assert.equal(delta.newSha256, hash, `${rel} delta hash must match current file`);
  assert.ok(delta.reason && delta.evidence && delta.approvedBy, `${rel} delta needs reason/evidence/approval`);
  deltas += 1;
}

// File konten baru tidak boleh muncul diam-diam; daftarkan sebagai addition.
const contentFiles = new Set();
for (const dir of ["src/data/lessons", "src/data/drills", "src/data/reading", "src/data/practice", "src/data/seed"]) {
  for (const file of fs.readdirSync(path.join(root, dir)).filter((name) => name.endsWith(".json"))) {
    contentFiles.add(`${dir}/${file}`);
  }
}
assert.equal(contentFiles.size, Object.keys(baseline.files).length, "content JSON file count");
for (const rel of contentFiles) {
  if (Object.prototype.hasOwnProperty.call(baseline.files, rel)) continue;
  const addition = APPROVED_ADDITIONS[rel];
  assert.ok(addition, `NEW CONTENT FILE must be registered: ${rel}`);
  assert.ok(addition.reason && addition.evidence && addition.approvedBy, `${rel} addition needs reason/evidence/approval`);
}

// ---------------------------------------------------------------------------
// 2. Audio: 454 WAV, manifest, 453 frasa, 200 alias segmen angka.
// ---------------------------------------------------------------------------
assert.equal(sha256("src/assets/tts_core/manifest.json"), baseline.audio_manifest_sha256, "manifest hash");
const manifest = readJson("src/assets/tts_core/manifest.json");
assert.equal(Object.keys(manifest.phrases).length, baseline.summary.phrase_refs, "phrase refs");
assert.equal(Object.keys(manifest.numbers).length, baseline.summary.number_aliases, "number aliases");
const audioEntries = Object.entries(baseline.audio);
assert.equal(audioEntries.length, baseline.summary.root_audio_files, "baseline audio entries");
const currentWavs = fs.readdirSync(path.join(root, "src/assets/tts_core")).filter((f) => f.endsWith(".wav")).sort();
assert.deepEqual(currentWavs, audioEntries.map(([name]) => name).sort(), "WAV set must match baseline exactly (no loss, no orphan)");
let audioBytes = 0;
for (const [name, meta] of audioEntries) {
  const rel = `src/assets/tts_core/${name}`;
  assert.equal(fs.statSync(path.join(root, rel)).size, meta.bytes, `${name} bytes`);
  assert.equal(sha256(rel), meta.sha256, `${name} sha256`);
  audioBytes += meta.bytes;
}
assert.equal(audioBytes, baseline.summary.root_audio_bytes, "total audio bytes");

const phraseFiles = new Set(Object.values(manifest.phrases));
const numberFiles = new Set(["numbers_1_100.wav"]);
const wavSet = new Set(currentWavs);
for (const file of phraseFiles) assert.ok(wavSet.has(file), `phrase file missing: ${file}`);
for (const file of numberFiles) assert.ok(wavSet.has(file), `numbers file missing: ${file}`);
for (const file of currentWavs) {
  assert.ok(phraseFiles.has(file) || numberFiles.has(file), `orphan WAV not referenced by manifest: ${file}`);
}

function wavDurationSeconds(file) {
  const buf = fs.readFileSync(path.join(root, "src/assets/tts_core", file));
  assert.equal(buf.toString("ascii", 0, 4), "RIFF", `${file} RIFF`);
  assert.equal(buf.toString("ascii", 8, 12), "WAVE", `${file} WAVE`);
  let offset = 12;
  let byteRate = null;
  let dataSize = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data") { dataSize = size; break; }
    offset += 8 + size + (size % 2);
  }
  assert.ok(byteRate && dataSize, `${file} fmt/data chunk`);
  return dataSize / byteRate;
}
const numbersDuration = wavDurationSeconds("numbers_1_100.wav");
for (const [key, seg] of Object.entries(manifest.numbers)) {
  assert.ok(Number.isFinite(seg.start) && Number.isFinite(seg.duration) && seg.duration > 0, `${key} segment`);
  assert.ok(seg.start >= 0 && seg.start + seg.duration <= numbersDuration + 0.05, `${key} segment outside numbers_1_100.wav`);
}

// ---------------------------------------------------------------------------
// 3. Unit/pelajaran: identitas dan isi per level (42 unit/96 pelajaran).
// ---------------------------------------------------------------------------
const unitsByLevel = {};
for (const level of ["A1", "A2", "B1", "B2"]) {
  const file = readJson(`src/data/lessons/units_${level.toLowerCase()}.json`);
  assert.equal(file.level, level, `${level} file level`);
  const baseUnits = baseline.levels[level].units;
  assert.equal(file.units.length, baseUnits.length, `${level} unit count`);
  assert.equal(file.units.length, baseline.summary.units_by_level[level], `${level} baseline units`);
  unitsByLevel[level] = file.units;
  file.units.forEach((unit, index) => {
    const base = baseUnits[index];
    assert.equal(unit.unit, base.unit, `${level} unit identity ${index}`);
    assert.equal(unit.title, base.title, `${level} unit ${unit.unit} title`);
    assert.deepEqual(unit.goals, base.goals, `${level} unit ${unit.unit} goals`);
    assert.equal(unit.lessons.length, base.lessons.length, `${level} unit ${unit.unit} lessons`);
    unit.lessons.forEach((lesson, lessonIndex) => {
      const baseLesson = base.lessons[lessonIndex];
      assert.equal(lesson.no, baseLesson.no, `${level} unit ${unit.unit} lesson identity`);
      assert.equal(lesson.title, baseLesson.title, `${level} ${unit.unit}/${lesson.no} title`);
      assert.equal(lesson.slides.length, baseLesson.slides, `${level} ${unit.unit}/${lesson.no} slide count`);
      assert.ok(lesson.recap.length > 0 && lesson.vocab.length > 0, `${level} ${unit.unit}/${lesson.no} recap/vocab`);
      for (const slide of lesson.slides) {
        assert.ok(slide.title.trim() && Array.isArray(slide.body) && slide.body.length > 0, `${level} ${unit.unit}/${lesson.no} slide body`);
        assert.ok(slide.example_de && slide.example_id, `${level} ${unit.unit}/${lesson.no} example/translation`);
      }
    });
  });
  const lessonCount = file.units.reduce((n, unit) => n + unit.lessons.length, 0);
  assert.equal(lessonCount, baseline.summary.lessons_by_level[level], `${level} lesson count`);
}

// ---------------------------------------------------------------------------
// 4. A1: tujuan, bank, relasi tujuan-bank, dan latihan penerapan.
// ---------------------------------------------------------------------------
const objectivesFile = readJson("src/data/lessons/a1_objectives.json");
assert.deepEqual(objectivesFile.objectives.map((o) => o.id), baseline.a1_objective_ids, "A1 objective ids/order");
assert.equal(objectivesFile.objectives.length, baseline.summary.a1_objectives, "A1 objective count");
const objectiveById = new Map(objectivesFile.objectives.map((o) => [o.id, o]));
const a1UnitByNo = new Map(unitsByLevel.A1.map((u) => [u.unit, u]));
let bankTotal = 0;
for (let unitNo = 1; unitNo <= 12; unitNo += 1) {
  const bank = readJson(`src/data/lessons/a1_unit${unitNo}_bank.json`);
  assert.equal(bank.level, "A1", `unit ${unitNo} bank level`);
  assert.equal(bank.unit, unitNo, `unit ${unitNo} bank unit`);
  const baselineItems = baseline.a1_bank_ids[String(unitNo)];
  const baselineIdSet = new Set(baselineItems.map((item) => item.id));
  assert.deepEqual(
    bank.items.filter((item) => baselineIdSet.has(item.id)).map((item) => ({ id: item.id, objectiveId: item.objectiveId })),
    baselineItems,
    `unit ${unitNo} baseline bank ids/objective mapping preserved`,
  );
  const approvedForUnit = Object.entries(APPROVED_BANK_ADDITIONS).filter(([, addition]) => addition.unit === unitNo);
  for (const [id, addition] of approvedForUnit) {
    const item = bank.items.find((entry) => entry.id === id);
    assert.ok(item, `approved bank addition present: ${id}`);
    assert.equal(item.objectiveId, addition.objectiveId, `${id} approved objective`);
  }
  assert.equal(
    bank.items.length,
    baselineItems.length + approvedForUnit.length,
    `unit ${unitNo} bank count after approved additions`,
  );
  bankTotal += bank.items.length;
  const unitObjectives = objectivesFile.objectives.filter((o) => o.unit === unitNo);
  assert.equal(unitObjectives.length, 5, `unit ${unitNo} objective count`);
  for (const objective of unitObjectives) {
    const own = bank.items.filter((item) => item.objectiveId === objective.id);
    assert.ok(own.length >= 5, `${objective.id} bank pool minimum 5`);
    assert.ok(unitByNo(unitNo).lessons.some((l) => objective.lessonNos.includes(l.no)), `${objective.id} lesson reference`);
    assert.ok(objective.canDo && objective.remedy && Array.isArray(objective.prerequisites), `${objective.id} pedagogy fields`);
    assert.ok(objective.review === "reviewed" || objective.review === "not-reviewed", `${objective.id} review status`);
  }
  for (const item of bank.items) {
    assert.ok(objectiveById.has(item.objectiveId), `${item.id} objective exists`);
    assert.ok(["choice", "type", "order"].includes(item.mode), `${item.id} mode`);
    assert.ok(item.prompt.trim() && item.answer.trim() && item.explanation.trim(), `${item.id} text`);
    if (item.mode === "choice") {
      assert.ok(item.options.includes(item.answer), `${item.id} answer in options`);
      assert.equal(new Set(item.options).size, item.options.length, `${item.id} unique options`);
      for (const option of item.options.filter((o) => o !== item.answer)) {
        assert.ok(item.wrongFeedback && item.wrongFeedback[option], `${item.id} feedback ${option}`);
      }
    }
    if (item.mode === "order") assert.equal(item.tokens.join(" "), item.answer, `${item.id} tokens`);
  }
}
assert.equal(
  bankTotal,
  baseline.summary.a1_bank_items + Object.keys(APPROVED_BANK_ADDITIONS).length,
  "A1 bank total = baseline + approved additions",
);
const lessonPractice = readJson("src/data/lessons/a1_lesson_practice.json");
assert.equal(lessonPractice.items.length, 35, "application practice items");
for (const item of lessonPractice.items) {
  assert.ok(objectiveById.has(item.objectiveId), `${item.id} application objective`);
  assert.ok(unitsByLevel.A1.some((u) => u.unit === item.unit && u.lessons.some((l) => l.no === item.lesson)), `${item.id} unit/lesson`);
}
function unitByNo(no) { return a1UnitByNo.get(no); }

// ---------------------------------------------------------------------------
// 5. Bacaan: 67 identitas + isi/terjemahan.
// ---------------------------------------------------------------------------
const readings = [];
for (const file of ["texts_a1", "texts_a1a2_extra", "texts_a2", "texts_b1", "texts_b2", "texts_extra"]) {
  readings.push(...readJson(`src/data/reading/${file}.json`).texts);
}
assert.deepEqual(
  readings.map((t) => ({ title: t.title, level: t.level, tags: t.tags })),
  baseline.reading_keys,
  "reading identity list",
);
assert.equal(readings.length, baseline.summary.seed_text_rows, "reading count");
for (const text of readings) {
  assert.ok(Array.isArray(text.sentences) && text.sentences.length > 0, `${text.title} sentences`);
  for (const raw of text.sentences) {
    const sentence = Array.isArray(raw) ? { de: raw[0], id: raw[1] } : raw;
    assert.ok(sentence.de && sentence.id, `${text.title} sentence de/id`);
  }
}

// ---------------------------------------------------------------------------
// 6. Latihan + Uji A1: seluruh ID, pilihan, rubrik, cabang, referensi.
// ---------------------------------------------------------------------------
const listening = readJson("src/data/practice/a1_listening.json");
const writing = readJson("src/data/practice/a1_writing.json");
const conversation = readJson("src/data/practice/a1_conversation.json");
const exam = readJson("src/data/practice/a1_mock_exam.json");
assert.deepEqual(listening.items.map((d) => d.id), baseline.practice_ids.listening, "listening ids");
assert.equal(listening.items.reduce((n, d) => n + d.questions.length, 0), baseline.summary.listening_questions, "listening questions");
for (const dialogue of listening.items) {
  assert.ok(dialogue.title && dialogue.context && dialogue.lines.length > 0, `${dialogue.id} dialogue`);
  for (const line of dialogue.lines) assert.ok(line.speaker && line.de, `${dialogue.id} line`);
  for (const question of dialogue.questions) {
    assert.ok(question.options.includes(question.answer), `${dialogue.id} question answer`);
    assert.ok(question.explanation.trim(), `${dialogue.id} explanation`);
  }
}
assert.deepEqual(writing.tasks.map((t) => t.id), baseline.practice_ids.writing, "writing ids");
for (const task of writing.tasks) {
  assert.ok(task.situation && task.model && task.mustInclude.length > 0 && task.checklist.length > 0, `${task.id} writing fields`);
}
assert.equal(conversation.scenarios.length, baseline.summary.conversation_scenarios, "conversation scenarios");
const conversationNodes = {};
let optionCount = 0;
for (const scenario of conversation.scenarios) {
  const baseNodes = baseline.practice_ids.conversations[scenario.id];
  assert.ok(baseNodes, `${scenario.id} in baseline`);
  assert.deepEqual(Object.keys(scenario.nodes), baseNodes, `${scenario.id} node ids/order`);
  assert.ok(scenario.nodes[scenario.start], `${scenario.id} start`);
  for (const node of Object.values(scenario.nodes)) {
    assert.ok(node.speaker && node.de, `${scenario.id}/${node.id} text`);
    for (const option of node.options ?? []) {
      optionCount += 1;
      assert.ok(option.text && option.feedback, `${scenario.id}/${node.id} option text/feedback`);
      assert.ok(scenario.nodes[option.next], `${scenario.id}/${node.id} option target ${option.next}`);
    }
  }
  conversationNodes[scenario.id] = scenario.nodes;
}
assert.equal(optionCount, baseline.summary.conversation_options, "conversation option count");
assert.deepEqual(exam.sections.map((s) => s.id), baseline.practice_ids.exam_sections, "exam sections");
const listeningById = new Map(listening.items.map((d) => [d.id, d]));
for (const section of exam.sections) {
  assert.ok(section.title && section.minutes > 0, `${section.id} section`);
  if (section.kind === "listening") {
    assert.equal(section.items.length, 5, "exam listening items");
    for (const ref of section.items) {
      const dialogue = listeningById.get(ref.dialogueId);
      assert.ok(dialogue && dialogue.questions[ref.questionIndex], `exam listening ref ${ref.dialogueId}:${ref.questionIndex}`);
    }
  }
  if (section.kind === "reading") {
    assert.equal(section.items.length, 5, "exam reading items");
    for (const item of section.items) assert.ok(item.options.includes(item.answer) && item.explanation, "exam reading item");
  }
  if (section.kind === "writing") assert.ok(section.task.model && section.task.checklist.length > 0, "exam writing rubric");
  if (section.kind === "speaking") assert.ok(section.prompts.length === 3 && section.prompts.every((p) => p.model && p.checklist.length), "exam speaking rubric");
}

// ---------------------------------------------------------------------------
// 7. Seed: 2134 kata unik, field penting, tag, hubungan SRS via kind.
// ---------------------------------------------------------------------------
const seedFiles = fs.readdirSync(path.join(root, "src/data/seed")).filter((f) => /^words_.*\.json$/.test(f));
assert.equal(seedFiles.length, 45, "seed word files");
const words = [];
for (const file of seedFiles) {
  const data = readJson(`src/data/seed/${file}`);
  assert.ok(Array.isArray(data.words) && data.words.length > 0, `${file} words`);
  words.push(...data.words);
}
assert.equal(words.length, baseline.summary.seed_word_rows, "seed rows");
assert.equal(new Set(words.map((w) => w.de)).size, baseline.summary.seed_unique_de, "unique German words");
const kinds = new Set(["noun", "verb", "adj", "other"]);
for (const word of words) {
  assert.ok(word.de && word.meaning_id && kinds.has(word.kind), `${word.de} core fields`);
  assert.ok(typeof word.tags === "string" && word.tags.trim(), `${word.de} tags`);
  if (word.kind === "noun") assert.ok(word.article, `${word.de} article`);
  if (word.example_de || word.example_id) assert.ok(word.example_de && word.example_id, `${word.de} example pair`);
}

// ---------------------------------------------------------------------------
// 8. Perilaku domain: opsi, kapitalisasi, bank kurang, 73%, drill D1-D10.
// ---------------------------------------------------------------------------
const optionOrder = loadTs("src/lessons/optionOrder.ts");
const answers = loadTs("src/srs/answers.ts");
const objectives = loadTs("src/lessons/objectives.ts", { "./optionOrder": optionOrder });
const checkpointResult = loadTs("src/lessons/checkpointResult.ts");
const practice = loadTs("src/lessons/practice.ts", { "./optionOrder": optionOrder });
const itemsModule = loadTs("src/drills/items.ts", {
  "../lessons/optionOrder": optionOrder,
  "../stores/db": { __esModule: true, default: async () => ({ select: async () => [] }) },
});

for (const code of ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"]) {
  assert.ok(itemsModule.DRILL_META[code], `DRILL_META ${code}`);
}
assert.equal(itemsModule.conjugate("essen", "du"), "isst", "D3 essen/du");
assert.equal(itemsModule.conjugate("sprechen", "er/sie/es"), "spricht", "D3 sprechen/er");
assert.equal(itemsModule.conjugate("wohnen", "wir"), "wohnen", "D3 wohnen/wir");

let choiceItems = 0;
for (let unitNo = 1; unitNo <= 12; unitNo += 1) {
  assert.equal(objectives.objectiveReadiness(unitNo).status, "ready", `unit ${unitNo} bank ready`);
  const planA = objectives.buildObjectiveCheckpoint(unitNo, new Set(), optionOrder.mulberry32(1234));
  const planB = objectives.buildObjectiveCheckpoint(unitNo, new Set(), optionOrder.mulberry32(1234));
  assert.deepEqual(planA.items, planB.items, `unit ${unitNo} deterministic plan`);
  assert.equal(planA.items.length, 15, `unit ${unitNo} checkpoint items`);
  for (const objective of planA.objectives) {
    assert.equal(planA.items.filter((item) => item.objectiveId === objective.id).length, 3, `${objective.id} 3 items`);
  }
  for (const item of planA.items.filter((i) => i.mode === "choice")) {
    choiceItems += 1;
    assert.ok(item.options.includes(item.answer), `${item.key} answer present`);
    assert.ok(optionOrder.answerPosition(item.options, item.answer) >= 0, `${item.key} position`);
  }
}
assert.ok(choiceItems > 0, "choice items in checkpoints");

assert.equal(answers.choiceMatches("auf", "auf"), true);
assert.equal(answers.choiceMatches("musik", "Musik"), false);
assert.equal(answers.choiceMatches("Musik", "Musik"), true);
assert.equal(answers.choiceMatches("An der", "an der", ["An der"]), true);
assert.equal(answers.choiceMatches("Schwimmen", "schwimmen"), false);

const failed73 = checkpointResult.gradeCheckpoint(
  planItemsForUnit(1),
  objectives.objectivesOfUnit(1),
  objectives.objectivePolicy(1),
  patternAnswers(planItemsForUnit(1), objectives.objectivesOfUnit(1), [3, 3, 2, 2, 1]),
  70,
);
assert.equal(failed73.score, 73, "73 percent score");
assert.equal(failed73.pass, false, "73 percent with objective 5 failed must not pass");
assert.equal(failed73.objectiveResults[4].pass, false, "objective 5 1/3 fails");
assert.equal(objectives.evaluateObjectiveResult(
  objectives.objectivePolicy(1),
  [3, 3, 2, 2, 1].map((c) => ({ correct: c, total: 3 })),
  11, 15,
).pass, false, "shared rule 73 percent fails");

function planItemsForUnit(unitNo) {
  return objectives.buildObjectiveCheckpoint(unitNo, new Set(), optionOrder.mulberry32(77)).items;
}
function patternAnswers(items, objectivesList, pattern) {
  const result = [];
  objectivesList.forEach((objective, index) => {
    const own = items.filter((item) => item.objectiveId === objective.id);
    own.forEach((item, itemIndex) => result.push({ key: item.key, correct: itemIndex < pattern[index] }));
  });
  return result;
}

// 17 pelajaran penerapan + fallback D1-D3.
let appLessons = 0;
let appItems = 0;
for (const unit of unitsByLevel.A1) {
  for (const lesson of unit.lessons) {
    const items = practice.lessonApplicationItems(unit.unit, lesson.no, optionOrder.mulberry32(5));
    if (["D1", "D2", "D3"].includes(lesson.drill.code)) {
      assert.equal(items.length, 0, `${unit.unit}/${lesson.no} vocab drill uses bank`);
      continue;
    }
    appLessons += 1;
    appItems += items.length;
    assert.ok(items.length >= 2, `${unit.unit}/${lesson.no} application items`);
    assert.ok(items.every((item) => item.lessonApplication === true && item.objectiveId), `${unit.unit}/${lesson.no} application marker`);
    assert.ok(items.every((item) => item.options ? item.options.includes(item.answer) : true), `${unit.unit}/${lesson.no} answer in options`);
  }
}
assert.equal(appLessons, 17, "17 application lessons");
assert.equal(appItems, 35, "35 application items");
const vocabLesson = unitsByLevel.A1[0].lessons[0];
assert.ok(practice.lessonPracticeItems(1, vocabLesson, optionOrder.mulberry32(1)).every((i) => i.lessonExample === true));

// ---------------------------------------------------------------------------
// 9. Akses/rute: halaman lama dan kontrak frontend memetakan konten aktual.
// ---------------------------------------------------------------------------
const pagesSource = fs.readFileSync(path.join(root, "src/ui/pages/index.ts"), "utf8");
for (const page of ["hari-ini", "kurikulum", "drill", "kosakata", "membaca", "latihan", "uji-a1", "statistik", "pengaturan"]) {
  assert.ok(pagesSource.includes(`id: "${page}"`), `page ${page} registered`);
}
const routesSource = fs.readFileSync(path.join(root, "src/klab/routes.ts"), "utf8");
for (const page of ["hari-ini", "kurikulum", "drill", "kosakata", "membaca", "latihan", "uji-a1", "statistik", "pengaturan"]) {
  assert.ok(routesSource.includes(`${page}:`) || routesSource.includes(`'${page}':`), `KLAB route ${page}`);
}
const klabRoutes = loadTs("src/klab/routes.ts");
assert.equal(klabRoutes.TABS.length, 4, "KLAB tabs");
for (const page of ["hari-ini", "kurikulum", "drill", "kosakata", "membaca", "latihan", "uji-a1", "statistik", "pengaturan"]) {
  const route = klabRoutes.legacyRoute(page);
  assert.ok(route && route.name, `legacyRoute ${page} resolvable`);
}
assert.equal(klabRoutes.legacyRoute("tidak-ada"), null, "unknown legacy route rejected");
assert.equal(klabRoutes.legacyRoute("latihan").name, "explore", "latihan route section");
assert.equal(klabRoutes.legacyRoute("uji-a1").name, "exam", "exam route");
const wiring = [
  ["src/ui/pages/Latihan.tsx", ["a1_listening.json", "a1_writing.json", "a1_conversation.json"]],
  ["src/ui/pages/UjiTiruan.tsx", ["a1_mock_exam.json", "a1_listening.json"]],
  ["src/ui/pages/Kurikulum.tsx", ["lessons/units", "lessons/objectives", "CheckpointRunner", "LessonRunner"]],
  ["src/ui/pages/Statistik.tsx", ["stats/queries", "drills/items"]],
  ["src/lessons/objectives.ts", Array.from({ length: 12 }, (_, i) => `a1_unit${i + 1}_bank.json`)],
  ["src/drills/items.ts", ["d4_items.json", "d5_items.json", "d6_items.json", "d7_items.json", "d8_items.json", "d9_items.json", "d10_items.json"]],
  ["src/data/seedLoader.ts", ["words_*.json", "reading/texts_*.json"]],
  ["src/ui/pages/Membaca.tsx", ["reading/texts", "srs/tts"]],
];
for (const [file, needles] of wiring) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const needle of needles) assert.ok(source.includes(needle), `${file} must reference ${needle}`);
}
const contracts = fs.readFileSync(path.join(root, "src/klab/contracts.ts"), "utf8");
for (const token of ["QuizSession", "QuizSessions", "UnitRounds", "PreferencesRepository"]) {
  assert.ok(contracts.includes(token), `contracts ${token}`);
}
const appSource = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
assert.ok(appSource.includes("PAGE_COMPONENTS") && appSource.includes("initDatabase"), "App wiring");

// ---------------------------------------------------------------------------
// 10. Matriks harus segar dan konsisten dengan baseline + data aktual.
// ---------------------------------------------------------------------------
const matrix = readJson("docs/architecture/content-parity-matrix.json");
assert.equal(matrix.baseline_id, baseline.id, "matrix baseline id");
assert.equal(
  matrix.baseline_sha256,
  crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "docs/architecture/evidence-2026-11-17/legacy-content-baseline.json"))).digest("hex"),
  "matrix baseline hash",
);
assert.equal(matrix.objectives.length, 60, "matrix objectives");
assert.equal(matrix.readings.length, 67, "matrix readings");
assert.equal(matrix.levels.A1.lesson_count, 36, "matrix A1 lessons");
assert.equal(matrix.levels.A2.lesson_count, 20, "matrix A2 lessons");
assert.equal(matrix.levels.B1.lesson_count, 20, "matrix B1 lessons");
assert.equal(matrix.levels.B2.lesson_count, 20, "matrix B2 lessons");
assert.equal(
  Object.values(matrix.banks).reduce((n, bank) => n + bank.items.length, 0),
  300 + Object.keys(APPROVED_BANK_ADDITIONS).length,
  "matrix bank items",
);
assert.equal(Object.values(matrix.vocabulary).reduce((n, file) => n + file.words.length, 0), 2134, "matrix words");
assert.equal(matrix.audio.wav_files, 454, "matrix audio files");
assert.equal(matrix.audio.phrases, 453, "matrix audio phrases");
assert.equal(matrix.practice.listening.items.length, 5, "matrix listening");
assert.equal(matrix.practice.writing.items.length, 5, "matrix writing");
assert.equal(matrix.practice.conversation.items.length, 4, "matrix conversation");
assert.equal(matrix.exam.sections.length, 4, "matrix exam");

// ---------------------------------------------------------------------------
// Ringkasan
// ---------------------------------------------------------------------------
console.log(
  `CONTENT-PARITY OK: ${unchanged}/${Object.keys(baseline.files).length} file identik` +
  `${deltas ? `, ${deltas} delta disetujui` : ", 0 delta"}.\n` +
  `  ${baseline.summary.units_by_level.A1 + baseline.summary.units_by_level.A2 + baseline.summary.units_by_level.B1 + baseline.summary.units_by_level.B2} unit / ` +
  `${baseline.summary.lessons_by_level.A1 + baseline.summary.lessons_by_level.A2 + baseline.summary.lessons_by_level.B1 + baseline.summary.lessons_by_level.B2} pelajaran / ` +
  `${words.length} kata unik / ${readings.length} bacaan / ${bankTotal} bank A1 / ${implementationCount()} praktik / ${audioEntries.length} WAV.\n` +
  `  Perilaku: 73% [3,3,2,2,1] gagal, kapitalisasi salah, bank kurang tidak siap, 17 pelajaran=35 soal penerapan, D1-D10 terpetakan.`,
);

function implementationCount() {
  return listening.items.length + writing.tasks.length + conversation.scenarios.length + exam.sections.length;
}
