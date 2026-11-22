// AUDIO-01: pencocokan teks ke klip bawaan. Meniru persis normalizeSpeech() di
// src/srs/tts.ts dan indeks manifest yang dibangun di sana.
// Kasus regresi utama: manifest menyimpan ejaan asli ("dreiunddreißig") sementara
// kunci pencarian sudah dinormalisasi ke "ss" -> tidak pernah cocok.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));

const normalizeSpeech = (text) =>
  String(text)
    .normalize("NFC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[.,!?…;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const manifest = readJson("src/assets/tts_core/manifest.json");
const phrases = new Map(Object.entries(manifest.phrases).map(([k, v]) => [normalizeSpeech(k), v]));
const numbers = new Map(Object.entries(manifest.numbers).map(([k, v]) => [normalizeSpeech(k), v]));
const has = (text) => {
  const key = normalizeSpeech(text);
  return phrases.has(key) || numbers.has(key);
};

// 1. Tidak ada dua entri berbeda yang bertabrakan setelah normalisasi.
const collisions = [];
for (const [label, source] of [["phrases", manifest.phrases], ["numbers", manifest.numbers]]) {
  const seen = new Map();
  for (const [key, value] of Object.entries(source)) {
    const n = normalizeSpeech(key);
    const prev = seen.get(n);
    if (prev && JSON.stringify(prev) !== JSON.stringify(value)) collisions.push(`${label}: ${n}`);
    seen.set(n, value);
  }
}
assert.deepEqual(collisions, [], `kunci manifest bertabrakan: ${collisions.slice(0, 5).join(", ")}`);

// 2. D8: seluruh 14 item harus cocok, termasuk angka 33 dan jam dengan eszett.
const d8 = readJson("src/data/drills/d8_items.json");
assert.equal(d8.length, 14, "jumlah item D8 berubah");
const d8Missing = d8.filter((item) => !has(item.say)).map((item) => `${item.say} (${item.answer})`);
assert.deepEqual(d8Missing, [], `D8 tidak cocok: ${d8Missing.join(", ")}`);
// Regresi yang dilaporkan audit: pencarian mentah gagal pada ejaan eszett.
const rawFails = d8.filter((item) => !manifest.phrases[normalizeSpeech(item.say)] && !manifest.numbers[normalizeSpeech(item.say)]);
assert.ok(rawFails.length >= 1, "kasus regresi eszett hilang dari data, cek ulang asumsi tes");
assert.ok(
  rawFails.some((item) => item.answer === "33"),
  "item D8 angka 33 harus tetap menjadi kasus regresi eszett",
);

// 3. Bacaan A1: 100 kalimat.
const readingSentences = fs
  .readdirSync(path.join(root, "src/data/reading"))
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => readJson(`src/data/reading/${file}`).texts ?? [])
  .filter((text) => text.level === "A1")
  .flatMap((text) => text.sentences.map((s) => s.de).filter(Boolean));
assert.equal(readingSentences.length, 100, "jumlah kalimat bacaan A1 berubah");
const readingMissing = readingSentences.filter((s) => !has(s));
assert.deepEqual(readingMissing, [], `bacaan A1 tanpa klip: ${readingMissing.slice(0, 5).join(" | ")}`);

// 4. Percakapan A1: seluruh baris node (bukan opsi jawaban) harus punya klip.
const conversation = readJson("src/data/practice/a1_conversation.json");
const nodeLines = conversation.scenarios.flatMap((s) =>
  Object.values(s.nodes).map((n) => n.de).filter(Boolean),
);
const uniqueNodeLines = [...new Set(nodeLines)];
const conversationMissing = uniqueNodeLines.filter((line) => !has(line));
assert.deepEqual(conversationMissing, [], `baris percakapan tanpa klip: ${conversationMissing.slice(0, 5).join(" | ")}`);

// 5. P4 listening + kosakata + contoh slide A1.
const listening = readJson("src/data/practice/a1_listening.json");
const listeningLines = [...new Set(listening.items.flatMap((item) => item.lines.map((l) => l.de)))];
const units = readJson("src/data/lessons/units_a1.json");
const vocab = [...new Set(units.units.flatMap((u) => u.lessons.flatMap((l) => l.vocab)))];
const examples = [
  ...new Set(
    units.units.flatMap((u) => u.lessons.flatMap((l) => l.slides.map((s) => s.example_de).filter(Boolean))),
  ),
];
for (const [label, list] of [
  ["listening", listeningLines],
  ["kosakata", vocab],
  ["contoh slide", examples],
]) {
  const missing = list.filter((t) => !has(t));
  assert.deepEqual(missing, [], `${label} tanpa klip: ${missing.slice(0, 5).join(" | ")}`);
}

console.log(
  `Audio lookup OK: D8 ${d8.length}/${d8.length} (${rawFails.length} kasus eszett tetap tertangkap regresi), ` +
    `bacaan ${readingSentences.length}, percakapan ${uniqueNodeLines.length} baris node, ` +
    `listening ${listeningLines.length}, kosakata ${vocab.length}, contoh ${examples.length}.`,
);
