// Bab 12 — Sekarang kamu yang menyambut. Sumber: docs/naskah-visual-novel-a1/bab-12.md
// Alur: undangan -> telepon Eva -> pesan konfirmasi -> transfer waktu/tempat.
import type { StoryNode, StoryContext } from "../../types";

const norm = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .normalize("NFC")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9äöüß ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const invitation = (value: string) => {
  const s = norm(value);
  return (s.includes("lade") && s.includes("ein")) || (s.includes("kommst") && s.includes("mit"));
};
const phone = (value: string) => {
  const s = norm(value);
  return s.includes("hier ist") && (s.includes("moment") || s.includes("bitte"));
};
const callback = (value: string) => {
  const s = norm(value);
  return s.includes("sonntag") && s.includes("rufe");
};
export const validateMessage = (value: string, _ctx: StoryContext) => {
  const s = norm(value);
  return (s.includes("hallo") || s.includes("guten tag"))
    && s.includes("sonntag")
    && (s.includes("vier") || s.includes("4"))
    && (s.includes("cafe") || s.includes("café"));
};
export const validateTransferMessage = (value: string, _ctx: StoryContext) => {
  const s = norm(value);
  return (s.includes("hallo") || s.includes("guten tag"))
    && s.includes("montag")
    && (s.includes("sechs") || s.includes("6"))
    && (s.includes("cafe") || s.includes("café"));
};

export const CTX = {
  chapterId: "a1-ch12",
  chapterNo: 12,
  title: "Sekarang kamu yang menyambut",
  scene: "s01",
  bg: "ruang-warga",
  locale: "de",
  npcs: [
    { id: "player", side: "left" },
    { id: "mia", side: "right", expr: "smile" },
    { id: "tetangga", side: "right", expr: "neutral" },
    { id: "tetangga", side: "right", expr: "question" },
  ],
  props: ["buku-tamu-terbuka", "kartu-cangkir"],
  ambience: "rumah",
  sfx: ["paper"],
  flagsIn: {},
  entryId: "c12a",
  exitId: "b12-end",
  exitFlags: {},
};

export const META = {
  chapterId: "a1-ch12",
  title: "Sekarang kamu yang menyambut",
  period: "Bab 12",
  objectives: [
    { id: "a1-u12-o1", title: "Mengundang dan menyepakati waktu", stimulus: "invitation-room", skills: ["lesen", "schreiben"] },
    { id: "a1-u12-o2", title: "Menerima atau menolak ajakan", stimulus: "calendar-saturday", skills: ["lesen", "schreiben"] },
    { id: "a1-u12-o3", title: "Memulai percakapan telepon", stimulus: "phone-eva", skills: ["hoeren", "schreiben"] },
    { id: "a1-u12-o4", title: "Meninggalkan pesan dan menelepon balik", stimulus: "voicemail-sunday", skills: ["hoeren", "schreiben"] },
    { id: "a1-u12-o5", title: "Menulis konfirmasi waktu dan tempat", stimulus: "message-sunday-four", skills: ["schreiben"] },
  ],
  closingLines: [
    "Pendatang baru: „Hallo! Ich bin neu hier. Wie heißt du?“",
    "Pemain menjawab dengan nama pilihannya; Mia menutup buku tamu.",
  ],
};

export const NODES: StoryNode[] = [
  {
    id: "c12a", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch12.s01.umum.dialog-01.mia",
    text: "Erinnerst du dich an deinen ersten Brief?",
    translation: "Kamu ingat surat pertamamu?",
    stage: { bg: "ruang-warga", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "c12b",
  },
  {
    id: "c12b", kind: "line", speaker: "narator", lang: "id",
    text: "Buku tamu yang dulu hanya berisi satu nama kini hampir penuh. Mia membuka halaman baru.",
    next: "c12-invite-q",
  },
  {
    id: "c12-invite-q", kind: "input", speaker: "mia", where: "c12-invite",
    prompt: "Tulis ajakan kepada Mia: ajak dia datang dan tanyakan apakah ia ikut.",
    chips: [],
    hints: ["Gunakan „Ich lade dich ein.“", "Tambahkan „Kommst du mit?“", "Contoh: Ich lade dich ein. Kommst du mit?"],
    validate: invitation,
    invalidHint: "Ajakan belum lengkap. Gunakan „Ich lade dich ein“ atau „Kommst du mit?“.",
    handlers: [{ intents: ["unknown"], next: "c12-invite-ok", record: { objective: "a1-u12-o1", full: false, skill: "schreiben", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "invitation-room" } }],
    unknownHint: "Tulis ajakan dengan „einladen“ atau „mitkommen“.",
  },
  {
    id: "c12-invite-ok", kind: "line", speaker: "mia", lang: "de",
    text: "Gern! Wir treffen uns am Sonntag um vier Uhr.",
    translation: "Dengan senang hati! Kita bertemu hari Minggu pukul empat.",
    next: "c12-call",
  },
  {
    id: "c12-call", kind: "line", speaker: "tetangga", lang: "de",
    audio: "a1-ch12.s02.a1-u12-o3.dialog-01.eva",
    text: "Guten Tag, hier ist Eva. Kann ich bitte mit Mia sprechen?",
    translation: "Selamat siang, ini Eva. Bolehkah saya berbicara dengan Mia?",
    stage: { bg: "ruang-warga", chars: [{ id: "player", side: "left" }, { id: "tetangga", side: "right", expr: "neutral" }] },
    next: "c12-phone-q",
  },
  {
    id: "c12-phone-q", kind: "input", speaker: "tetangga", where: "c12-phone",
    prompt: "Jawab telepon: sebutkan siapa dirimu dan minta Eva menunggu.",
    chips: [],
    hints: ["Gunakan „hier ist …“.", "Tambahkan „Einen Moment bitte.“", "Contoh: Guten Tag, hier ist {name}. Einen Moment bitte."],
    validate: phone,
    invalidHint: "Jawaban belum memperkenalkan diri dan meminta waktu.",
    handlers: [{ intents: ["unknown"], next: "c12-phone-ok", record: { objective: "a1-u12-o3", full: false, skill: "schreiben", mode: "text", support: "text-fallback", reviewStatus: "auto", stimulusId: "phone-eva" } }],
    unknownHint: "Gunakan „hier ist …“ dan „Einen Moment bitte.“",
  },
  {
    id: "c12-phone-ok", kind: "line", speaker: "tetangga", lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.dialog-01.eva",
    text: "Mia ist nicht da? Kann ich eine Nachricht hinterlassen?",
    translation: "Mia tidak ada? Bolehkah saya meninggalkan pesan?",
    next: "c12-message-q",
  },
  {
    id: "c12-message-q", kind: "line", speaker: "tetangga", lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.pesan-suara-01.eva",
    text: "Bitte ruf mich am Sonntag an.",
    translation: "Tolong telepon saya hari Minggu.",
    next: "c12-callback-q",
  },
  {
    id: "c12-callback-q", kind: "input", speaker: "tetangga", where: "c12-callback",
    prompt: "Ulangi janji itu sebagai Mia: kapan kamu akan menelepon?",
    chips: [],
    hints: ["Gunakan „Ich rufe … an.“", "Sebutkan hari Minggu.", "Contoh: Ich rufe dich am Sonntag an."],
    validate: callback,
    invalidHint: "Janji belum menyebut hari Minggu dan „anrufen“.",
    handlers: [{ intents: ["unknown"], next: "c12-callback-ok", record: { objective: "a1-u12-o4", full: false, skill: "hoeren", mode: "text", support: "none", reviewStatus: "auto", stimulusId: "voicemail-sunday" } }],
    unknownHint: "Tulis „Ich rufe dich am Sonntag an.“",
  },
  {
    id: "c12-callback-ok", kind: "line", speaker: "tetangga", lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.transisi-01.eva",
    text: "Danke. Dann höre ich am Sonntag von euch.",
    translation: "Terima kasih. Kalau begitu aku menunggu kabar kalian hari Minggu.",
    next: "c12-write-intro",
  },
  {
    id: "c12-write-intro", kind: "line", speaker: "mia", lang: "de",
    audio: "a1-ch12.s03.a1-u12-o5.dialog-01.mia",
    text: "Unser Gast kennt den neuen Termin noch nicht. Schreibst du ihm?",
    translation: "Tamu kita belum tahu jadwal baru. Maukah kamu menulis kepadanya?",
    stage: { bg: "ruang-warga", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    next: "c12-write-q",
  },
  {
    id: "c12-write-q", kind: "input", speaker: "tutor", where: "c12-write",
    prompt: "Tulis pesan kepada Eva: salam, waktu Minggu pukul empat, tempat di Café, penutup.",
    chips: [],
    hints: ["Sebut penerima, waktu, dan tempat.", "Gunakan „Wir treffen uns am Sonntag um vier Uhr im Café.“", "Contoh: Hallo Eva, wir treffen uns am Sonntag um vier Uhr im Café. Bis bald, {name}."],
    validate: validateMessage,
    invalidHint: "Pesan belum memuat waktu (Minggu, pukul empat) atau tempat (Café).",
    handlers: [{ intents: ["unknown"], next: "c12-write-ok", record: { objective: "a1-u12-o5", full: false, skill: "schreiben", mode: "text", support: "none", reviewStatus: "pending-review", stimulusId: "message-sunday-four" } }],
    unknownHint: "Tulis pesan dengan waktu dan tempat yang disepakati.",
  },
  {
    id: "c12-write-ok", kind: "line", speaker: "mia", lang: "de",
    text: "Danke! Die Karte bekommt noch deine Unterschrift.",
    translation: "Terima kasih! Kartunya tinggal diberi tanda tanganmu.",
    next: "c12-transfer-intro",
  },
  {
    id: "c12-transfer-intro", kind: "line", speaker: "narator", lang: "id",
    text: "Latihan transfer: tamu yang lain mendapat jadwal baru, Senin pukul enam di Café yang sama. Tulis pesan baru tanpa menyalin kalimat sebelumnya.",
    next: "c12-transfer-q",
  },
  {
    id: "c12-transfer-q", kind: "input", speaker: "tutor", where: "c12-transfer",
    prompt: "Tulis pesan konfirmasi untuk jadwal baru: Senin pukul enam di Café.",
    chips: [],
    hints: ["Ganti hari dan jam; tempat tetap Café.", "Gunakan pola yang sama, tetapi jangan menyalin jawaban lama.", "Contoh: Hallo, wir treffen uns am Montag um sechs Uhr im Café. Bis bald!"],
    validate: validateTransferMessage,
    invalidHint: "Pesan transfer belum memuat Senin, pukul enam, atau Café.",
    handlers: [{ intents: ["unknown"], next: "c12-transfer-ok", record: { objective: "a1-u12-o5", full: false, skill: "schreiben", mode: "text", support: "none", reviewStatus: "pending-review", stimulusId: "transfer-message-monday" } }],
    unknownHint: "Tulis pesan dengan Senin, pukul enam, dan Café.",
  },
  {
    id: "c12-transfer-ok", kind: "line", speaker: "tetangga", lang: "de",
    audio: "a1-ch12.penutup.umum.penutup-01.pendatang-baru",
    text: "Hallo! Ich bin neu hier. Wie heißt du?",
    translation: "Halo! Aku baru di sini. Siapa namamu?",
    stage: { bg: "ruang-warga", chars: [{ id: "player", side: "left" }, { id: "tetangga", side: "right", expr: "smile" }] },
    next: "b12-end",
  },
  { id: "b12-end", kind: "end" },
];
