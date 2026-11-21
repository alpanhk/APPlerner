// Bab 11 — Peron berubah. Sumber naskah: docs/naskah-visual-novel-a1/bab-11.md
// Alur: tiket -> pengumuman peron -> tanya petugas -> reservasi -> pesan ke Bab 12.
import type { StoryNode, StoryContext } from "../../types";

const norm = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .normalize("NFC")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9äöüß ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ticketTime = (value: string, _ctx: StoryContext) => {
  const s = norm(value);
  return ["09 10", "9 10", "neun uhr zehn", "neun zehn", "0910"].some((part) => s.includes(part));
};
const destination = (value: string) => norm(value).includes("leipzig");
const baggage = (value: string) => {
  const s = norm(value);
  return s.includes("rucksack") && s.includes("reisepass");
};
const platform = (value: string) => {
  const s = norm(value);
  return s === "4" || s === "vier" || s.includes("gleis 4") || s.includes("gleis vier");
};
const question = (value: string) => {
  const s = norm(value);
  return (s.includes("gleis") || s.includes("bahnsteig") || s.includes("steig")) && value.includes("?");
};
const reservation = (value: string) => {
  const s = norm(value);
  return s.includes("sitzplatz") && s.includes("reservieren");
};

export const CTX = {
  chapterId: "a1-ch11",
  chapterNo: 11,
  title: "Peron berubah",
  scene: "s02",
  bg: "peron",
  locale: "de",
  npcs: [
    { id: "player", side: "left" },
    { id: "mia", side: "right", expr: "smile" },
    { id: "pos", side: "right", expr: "neutral" },
  ],
  props: ["tiket", "papan-peron"],
  ambience: "jalan",
  sfx: ["bell", "tram"],
  flagsIn: {},
  entryId: "b11a",
  exitId: "b11-end",
  exitFlags: {},
};

export const META = {
  chapterId: "a1-ch11",
  title: "Peron berubah",
  period: "Bab 11",
  objectives: [
    { id: "a1-u11-o1", title: "Menyebut tujuan perjalanan", stimulus: "ticket-09-10", skills: ["lesen", "schreiben"] },
    { id: "a1-u11-o2", title: "Membaca jam keberangkatan", stimulus: "ticket-09-10", skills: ["lesen"] },
    { id: "a1-u11-o3", title: "Menyebut barang bawaan", stimulus: "packing-card", skills: ["lesen", "schreiben"] },
    { id: "a1-u11-o4", title: "Memahami peron terbaru dan bertanya", stimulus: "announcement-gleis-4", skills: ["hoeren", "schreiben"] },
    { id: "a1-u11-o5", title: "Meminta tempat duduk", stimulus: "counter-leipzig", skills: ["lesen", "schreiben"] },
  ],
  closingLines: [
    "Mia: „Schreib Eva bitte, wann wir wieder zu Hause sind.“",
    "Pemain membawa tiket dan catatan peron ke Bab 12.",
  ],
};

export const NODES: StoryNode[] = [
  {
    id: "b11a", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch11.s01.umum.dialog-01.mia",
    text: "Die Tickets habe ich. Hast du das Buch?",
    translation: "Tiketnya sudah kubawa. Bukunya ada padamu?",
    stage: { bg: "ruang-warga", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b11b",
  },
  {
    id: "b11b", kind: "line", speaker: "narator", lang: "id",
    text: "Di meja ada dua tiket. Tiket pertama: Abfahrt 09:10, Ankunft 10:25. Mia menunjuk kota tujuan: Leipzig.",
    next: "b11-dest-q",
  },
  {
    id: "b11-dest-q", kind: "input", speaker: "mia", where: "b11-dest",
    prompt: "Baca tiket. Ketik kota tujuan perjalanan ini.",
    chips: [],
    hints: ["Lihat kolom tujuan, bukan kolom waktu.", "Kota itu dimulai dengan L.", "Contoh: Leipzig."],
    validate: destination,
    invalidHint: "Tujuan belum tepat. Baca lagi nama kota pada tiket, bukan jam.",
    handlers: [{ intents: ["unknown"], next: "b11-dest-ok", record: { objective: "a1-u11-o1", full: false, skill: "lesen", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "ticket-09-10" } }],
    unknownHint: "Ketik nama kota yang tertulis pada tiket.",
  },
  {
    id: "b11-dest-ok", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch11.s01.a1-u11-o1.dialog-01.mia",
    text: "Genau, nach Leipzig. Und wann fährt unser Zug ab?",
    translation: "Tepat, ke Leipzig. Dan kapan kereta kita berangkat?",
    next: "b11-ticket-q",
  },
  {
    id: "b11-ticket-q", kind: "input", speaker: "mia", where: "b11-ticket",
    prompt: "Ketik jam keberangkatan (Abfahrt) dari tiket.",
    chips: [],
    hints: ["Abfahrt = keberangkatan; Ankunft = kedatangan.", "Angka pertama pada tiket adalah keberangkatan.", "Contoh: 09:10."],
    validate: ticketTime,
    invalidHint: "Itu bukan jam keberangkatan. Bedakan Abfahrt (09:10) dari Ankunft (10:25).",
    handlers: [{ intents: ["unknown"], next: "b11-ticket-ok", record: { objective: "a1-u11-o2", full: false, skill: "lesen", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "ticket-09-10" } }],
    unknownHint: "Ketik jam keberangkatan, misalnya 09:10.",
  },
  {
    id: "b11-ticket-ok", kind: "line", speaker: "mia", lang: "de",
    text: "Um neun Uhr zehn. Gut. Und was nimmst du mit?",
    translation: "Pukul sembilan lewat sepuluh. Bagus. Dan apa yang kamu bawa?",
    next: "b11-bag-q",
  },
  {
    id: "b11-bag-q", kind: "input", speaker: "mia", where: "b11-bag",
    prompt: "Sebutkan dua barang yang akan dibawa: Rucksack dan Reisepass.",
    chips: [],
    hints: ["Barang ada pada kartu di dekat tiket.", "Gunakan dua kata benda: Rucksack, Reisepass.", "Contoh: Ich nehme den Rucksack und den Reisepass mit."],
    validate: baggage,
    invalidHint: "Sebutkan Rucksack dan Reisepass; koper besar tetap tinggal.",
    handlers: [{ intents: ["unknown"], next: "b11-bag-ok", record: { objective: "a1-u11-o3", full: false, skill: "schreiben", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "packing-card" } }],
    unknownHint: "Sebutkan Rucksack dan Reisepass.",
  },
  {
    id: "b11-bag-ok", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch11.s01.a1-u11-o3.dialog-01.mia",
    text: "Gut. Am Bahnhof müssen wir auf die Anzeigetafel schauen.",
    translation: "Bagus. Di stasiun kita harus melihat papan keberangkatan.",
    stage: { bg: "peron", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }], ambience: "jalan" },
    sfx: "bell",
    next: "b11-announcement",
  },
  {
    id: "b11-announcement", kind: "line", speaker: "narator", lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.transisi-01.petugas-stasiun",
    text: "Achtung, eine Durchsage.",
    translation: "Perhatian, ada pengumuman.",
    stage: { bg: "peron", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    next: "b11-platform-q",
  },
  {
    id: "b11-platform-q", kind: "input", speaker: "mia", where: "b11-platform",
    prompt: "Ketik nomor peron yang disebut pengumuman. Papan lama belum diperbarui.",
    chips: [],
    hints: ["Dengarkan angka setelah „Gleis“.", "Jangan memakai angka lama dari tiket.", "Ketik 4 atau vier."],
    validate: platform,
    invalidHint: "Belum tepat. Dengarkan lagi; papan lama bukan pengumuman terbaru.",
    handlers: [{ intents: ["unknown"], next: "b11-platform-ok", record: { objective: "a1-u11-o4", full: false, skill: "hoeren", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "announcement-gleis-4" } }],
    unknownHint: "Ketik nomor peron yang baru.",
  },
  {
    id: "b11-platform-ok", kind: "line", speaker: "pos", lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.dialog-01.petugas-stasiun",
    text: "Der Zug hat zehn Minuten Verspätung. Er fährt heute von Gleis vier ab.",
    translation: "Kereta terlambat sepuluh menit. Hari ini kereta berangkat dari jalur empat.",
    stage: { bg: "peron", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }, { id: "pos", side: "right", expr: "neutral" }] },
    next: "b11-ask-q",
  },
  {
    id: "b11-ask-q", kind: "input", speaker: "pos", where: "b11-ask",
    prompt: "Tanyakan peron kepada petugas dengan sopan (teks).",
    chips: [],
    hints: ["Gunakan „Auf welchem Gleis …?“", "Sertakan kata kerja „fährt … ab“.", "Contoh: Auf welchem Gleis fährt der Zug ab?"],
    validate: question,
    invalidHint: "Pertanyaan belum meminta peron. Gunakan „Gleis“ atau „Bahnsteig“ dan tanda tanya.",
    handlers: [{ intents: ["unknown"], next: "b11-ask-ok", record: { objective: "a1-u11-o4", full: false, skill: "schreiben", mode: "text", support: "text-fallback", reviewStatus: "auto", stimulusId: "announcement-gleis-4" } }],
    unknownHint: "Tanyakan peron dengan kalimat sopan.",
  },
  {
    id: "b11-ask-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Gleis vier. Sie haben noch zehn Minuten. Brauchen Sie einen Sitzplatz?",
    translation: "Jalur empat. Anda masih punya sepuluh menit. Apakah Anda perlu tempat duduk?",
    stage: { bg: "stasiun", chars: [{ id: "player", side: "left" }, { id: "pos", side: "right", expr: "question" }] },
    next: "b11-reserve-q",
  },
  {
    id: "b11-reserve-q", kind: "input", speaker: "pos", where: "b11-reserve",
    prompt: "Minta satu tempat duduk dengan sopan.",
    chips: [],
    hints: ["Gunakan „Ich möchte … reservieren.“", "Sebutkan „einen Sitzplatz“.", "Contoh: Ich möchte einen Sitzplatz reservieren."],
    validate: reservation,
    invalidHint: "Permintaan belum menyebut tempat duduk dan reservieren.",
    handlers: [{ intents: ["unknown"], next: "b11-reserve-ok", record: { objective: "a1-u11-o5", full: false, skill: "schreiben", mode: "text", support: "none", reviewStatus: "pending-review", stimulusId: "counter-leipzig" } }],
    unknownHint: "Minta tempat duduk dengan „Sitzplatz“ dan „reservieren“.",
  },
  {
    id: "b11-reserve-ok", kind: "line", speaker: "pos", lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.konfirmasi-01.petugas-stasiun",
    text: "Also, ein Sitzplatz nach Leipzig. Wann kommen wir an?",
    translation: "Jadi, satu tempat duduk ke Leipzig. Kita tiba kapan?",
    stage: { bg: "stasiun", chars: [{ id: "player", side: "left" }, { id: "pos", side: "right", expr: "smile" }] },
    next: "b11-endline",
  },
  {
    id: "b11-endline", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.transisi-01.mia",
    text: "Schreib Eva bitte, wann wir wieder zu Hause sind.",
    translation: "Tolong kabari Eva kapan kita kembali ke rumah.",
    stage: { bg: "stasiun", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b11-end",
  },
  { id: "b11-end", kind: "end" },
];
