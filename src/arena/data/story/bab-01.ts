// Bab 01 · Tanda cangkir di balik surat (lanjutan prolog)
// Naskah: lernen-app/docs/naskah-visual-novel-a1/bab-01.md
// Pemeran: ambang-rumah + penjaga buku (ch01 s01); warna kamar
import type { StoryNode } from "../../types";

export const CTX = {
  chapterId: "a1-ch01",
  chapterNo: 1,
  title: "Tanda cangkir di balik surat",
  scene: "s01",
  bg: "ambang-rumah",
  locale: "de",
  npcs: [
    { id: "player", side: "left" },
    { id: "mia", side: "right", expr: "smile" },
  ],
  props: [],
  ambience: "rumah",
  sfx: ["paper", "hinge"],
  flagsIn: {},
  entryId: "c1a",
  exitId: "bab02a",
  exitFlags: {},
};

export const META = {
  chapterId: "a1-ch01",
  title: "Tanda cangkir di balik surat",
  period: "Bab 01",
  objectives: [
    { id: "greet", title: "Menyapa sesuai waktu hari", stimulus: "a1-u1-o1", answer: "Guten Morgen, Mia!" },
    { id: "introduce", title: "Memperkenalkan diri", stimulus: "a1-u1-o2", answer: "Ich heiße Rina." },
    { id: "origin", title: "Menyebut asal dan tempat tinggal", stimulus: "a1-u1-o3", answer: "Ich komme aus Jerman, ich wohne in Berlin." },
    { id: "friends", title: "Menyebut teman dan umur", stimulus: "a1-u1-o4", answer: "Das ist meine Freundin Mia. Sie ist zweiundzwanzig Jahre alt." },
    { id: "articles", title: "Artikel dan bentuk jamak", stimulus: "a1-u1-o5", answer: "Das sind meine Eltern. Die Namen sind die Namen." },
  ],
  closingLines: [],
};

// ---------- Bab 01 (lanjutan prolog) ----------
export const NODES: StoryNode[] = [
  {
    id: "c1a", kind: "line", speaker: "mia", lang: "de",
    text: "Kamu membalik surat «Bis morgen!». Di belakangnya terlihat gambar bangku di depan kafe — dia mengundangku bertemu di sana. Ini penemuan pertama.",
    translation: "Kamu membalik surat «Sampai besok!». Di belakangnya terlihat gambar bangku di depan kafe — dia mengundangku bertemu di sana. Ini penemuan pertama.",
    stage: { bg: "ambang-rumah", chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }], overlay: null, ambience: "rumah" },
    sfx: "paper",
    next: "c1b",
  },
  {
    id: "c1b", kind: "line", speaker: "mia", lang: "de",
    text: "Saya akan menulis nama saya di buku tamu.",
    translation: "Saya akan menulis nama saya di buku tamu.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    next: "c1c",
  },
  {
    id: "c1c", kind: "line", speaker: "pos", lang: "de",
    text: "Hier ist die neue Nachbarin! Tut sie deinen Namen am Ende mit dazu?",
    translation: "Ini adalah tetangga barunya! tutor muss etwa.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    next: "c1d",
  },
  {
    id: "c1d", kind: "line", speaker: "mia", lang: "de",
    text: "Ach, ich wurde angekündigt. Sagt ihm, wie du es erlaubst.",
    translation: "Ach, dia wurde vorgestellt. Sag ihr, wie viel du erlaubst.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "c1e",
  },
  {
    id: "c1e", kind: "line", speaker: "pos", lang: "de",
    text: "Guten Abend!",
    translation: "Selamat malam!",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    next: "b01-o1",
  },

  // --- Bab 01 Adegan 1: Sapaan sesuai waktu hari (a1-u1-o1) ---
  {
    id: "b01-o1", kind: "input", speaker: "pos", where: "pos",
    prompt: "Giliranmu. Sapaan sesuai waktu hari.",
    chips: ["Guten", "Morgen", "Guten", "Abend", "Hallo", "Auf", "Wiedersehen", "Tschüs", "Heute"],
    hints: [
      "Sapa penjaga. Sapaan sesuai waktu hari: Guten Morgen untuk pagi, Guten Abend untuk sore/malam.",
      "Catatan: „Guten Abend!“ tepat pada saat ini, meskipun suratnya hari ini.",
    ],
    handlers: [
      { intents: ["greet"], next: "b01-o1-ok", record: { objective: "greet", full: true }, setFlags: { greetedByGuard: true } },
      { intents: ["nein"], next: "b01-o1-retry" },
    ],
    unknownHint: 'Sebut sapaan yang pas: „Guten Abend!“.',
  },
  { id: "b01-o1-retry", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] }, text: "Penjaga mau jawabanmu! Sebutkan sapaan yang benar: „Guten Abend!“", next: "b01-o1" },
  {
    id: "b01-o1-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Ich hoffe, Sie hatten einen schönen Abend!",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b01-o2",
  },

  // --- Bab 01 Adegan 2: perkenalan & asal (a1-u1-o2) ---
  {
    id: "b01-o2", kind: "input", speaker: "pos", where: "pos",
    prompt: "Giliranmu. Penjaga menunggu jawabanmu.",
    chips: ["Ich", "heiße", "bin", "{name}", "Rina", "."],
    hints: [
      "Kirim kata: „Ich heiße …“ — gunakan nama panggilanmu.",
      "Petunjuk lengkap: „Ich heiße {name}.“",
    ],
    handlers: [
      { intents: ["intro_full"], next: "b01-o2-ok", record: { objective: "introduce", full: true } },
      { intents: ["name_only"], next: "b01-o2-ok", record: { objective: "introduce", full: false } },
      { intents: ["intro_other"], next: "b01-o2-wrong" },
      { intents: ["greet"], next: "b01-o2-retry" },
    ],
    unknownHint: "Sebutkan nama Anda: „Ich heiße {name}“.",
  },
  { id: "b01-o2-wrong", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] }, text: "Tidak, itu bukan nama Anda. Gunakan nama Anda di sini: „Ich heiße {name}.“", next: "b01-o2" },
  { id: "b01-o2-retry", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] }, text: "Kalimat yang benar! Coba sebutkan dulu nama panggilanmu.", next: "b01-o2" },
  {
    id: "b01-o2-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Freut mich! Ich vermerke Ihren Namen im Buch.",
    translation: "Senang berkenalan. Sekarang kalimat Anda sudah dicatat di buku.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b01-o3",
  },

  // --- Bab 01 Adegan 3: asal & tempat tinggal (a1-u1-o3) ---
  {
    id: "b01-o3", kind: "input", speaker: "pos", where: "pos",
    prompt: "Giliranmu. Penjaga bertanya: Wo kommst du? Und wo wohnst du jetzt?",
    chips: ["Ich", "komme", "aus", "Jerman", "wohne", "in", "Berlin"],
    hints: [
      "Sebutkan asal dengan «Ich komme aus …» — sesuai situasi Anda, bisa kota atau negara.",
      "Sebutkan tempat tinggal dengan «Ich wohne in …» — sesuai situasi Anda sekarang.",
    ],
    handlers: [
      { intents: ["unknown"], next: "b01-o3-retry" },
    ],
    unknownHint: "Gunakan «Ich komme aus …» dan «Ich wohne in …».",
  },
  { id: "b01-o3-retry", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] }, text: "Penjaga bertanya lagi: „Wo kommst du? Wo wohnst du jetzt?“", next: "b01-o3" },
  {
    id: "b01-o3-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Das habe ich verstanden! „Wir sagen: Ich komme aus und ich wohne in“ — tambahkan nama sesuai jawabanmu.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b01-o4",
  },

  // --- Bab 01 Adegan 4: teman & usia (a1-u1-o4) ---
  {
    id: "b01-o4", kind: "input", speaker: "pos", where: "pos",
    prompt: "Giliranmu. Penjaga menanyakan: Wie viele Geschwister hast du?",
    chips: ["einen", "Bruder", "eine", "Schwester", "Wie", "alt", "ist", "sie", "zweiundzwanzig", "Jahre"],
    hints: [
      "Sebutkan jumlah saudara: „Sie hat einen Bruder.“",
      "Petunjuk usia: „Er/Sie ist [wie alt] — sebutkan umur dengan angka.“",
    ],
    handlers: [
      { intents: ["unknown"], next: "b01-o4-retry" },
    ],
    unknownHint: "Sebutkan: „Sie hat einen Bruder. Er ist [umur].“",
  },
  { id: "b01-o4-retry", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] }, text: "Penjaga ingin jawabanmu lengkap: sebutkan saudaranya dan usianya.", next: "b01-o4" },
  {
    id: "b01-o4-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Danke! „Das ist sehr nützlich für das Büchlein.“",
    translation: "Terima kasih! — penjaga mencatat di buku tamu: sebutkan saudaranya dan usianya.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b01-o5",
  },

  // --- Bab 01 Adegan 5: artikel & jamak (a1-u1-o5) ---
  {
    id: "b01-o5", kind: "input", speaker: "pos", where: "pos",
    prompt: "Giliranmu. Penjaga menulis label: Die Namen der kenntnis sind jetzt amEnde",
    chips: ["die", "Namen", "die", "Freunde", "sind", "sehr"],
    hints: [
      "Gunakan artikel yang benar: „Das sind meine Freunde.“",
      "Coba juga: „Das ist meine Mutter.“ untuk bentuk singular.",
    ],
    handlers: [
      { intents: ["unknown"], next: "b01-o5-retry" },
    ],
    unknownHint: "Gunakan artikel «die» untuk jamak dan das-prefix bentuk sederhana.",
  },
  { id: "b01-o5-retry", kind: "line", speaker: "pos", lang: "id", stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] }, text: "Saya tidak paham — sebutkan bentuk jamak, misalnya: „Das sind meine Freunde.“", next: "b01-o5" },
  {
    id: "b01-o5-ok", kind: "line", speaker: "pos", lang: "de",
    text: "Gut gesagt! Die Namen sind angeschrieben.",
    translation: "Kasihan — terletak di halaman buku tamu sejumlah nama keluarga.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "b01-end",
  },

  // --- Bab 01 selesai — ulang surat pendamping sebelum pergi ke Bab 02 ---
  { id: "bab01-end", kind: "branch", pick: () => "bab02a" },
  // --- Bab 02 entry: ambang kios pasar (Penjual mandiri, ch02) ---
  { id: "bab02a", kind: "line", speaker: "tetangga", lang: "de", stage: { bg: "ch02", chars: [{ id: "player", side: "left" }, { id: "tetangga", side: "right", expr: "question" }], ambience: "rumah" }, text: "Siebzehn oder siebzig? Das macht einen Unterschied!", translation: "Tujuq 17 atau 70? Itu beda sekali!", next: "b02-o1" },
];

export default NODES;
