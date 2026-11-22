// Validasi cakupan audio offline A1: kata kosakata dan contoh slide harus punya
// klip di manifest tts_core dan file WAV-nya ada.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
const normalize = (value) =>
  String(value)
    .normalize("NFC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[.,!?.;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const unitsFile = readJson("src/data/lessons/units_a1.json");
const manifest = readJson("src/assets/tts_core/manifest.json");
const audioDir = path.join(root, "src/assets/tts_core");

const readingDir = path.join(root, "src/data/reading");
const readingSentences = fs
  .readdirSync(readingDir)
  .filter((file) => file.endsWith(".json"))
  .flatMap((file) => readJson(`src/data/reading/${file}`).texts ?? [])
  .filter((text) => text.level === "A1")
  .flatMap((text) => text.sentences.map((sentence) => sentence.de).filter(Boolean));

const words = [...new Set(unitsFile.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.vocab)))];
const examples = [
  ...new Set(
    unitsFile.units.flatMap((unit) =>
      unit.lessons.flatMap((lesson) =>
        lesson.slides.map((slide) => slide.example_de).filter(Boolean),
      ),
    ),
  ),
];

const missing = [];
let bytes = 0;
for (const text of [...words, ...examples, ...readingSentences]) {
  const file = manifest.phrases[normalize(text)];
  if (!file) {
    missing.push(`manifest: ${text}`);
    continue;
  }
  const full = path.join(audioDir, file);
  if (!fs.existsSync(full)) {
    missing.push(`file: ${text} → ${file}`);
    continue;
  }
  bytes += fs.statSync(full).size;
}

assert.equal(missing.length, 0, `audio A1 belum lengkap:\n${missing.slice(0, 10).join("\n")}`);
console.log(
  `A1 offline audio OK: ${words.length} kata + ${examples.length} contoh + ` +
    `${readingSentences.length} kalimat bacaan, ${(bytes / 1024 / 1024).toFixed(1)} MiB klip.`,
);
