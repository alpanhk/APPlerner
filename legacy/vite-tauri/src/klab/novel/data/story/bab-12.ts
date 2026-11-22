// ===== Bab 12 · Sekarang kamu yang menyambut (A1, Unit 12) =====
// PILOT-AGENT-1 — sesuai docs/naskah-visual-novel-a1/bab-12.md + Mandat §6.B.
// Eva bersuara melalui telepon tanpa potret (mode voice, Mandat §5.5).
// Tulisan pesan (a1-u12-o5) dinilai dengan penilai khusus: umpan balik
// menyasar bagian yang salah; teks awal dan revisi keduanya tercatat (U08).

import type { EvalResult, StoryNode } from "../../types";

export const CH12_START = "ch12-start";

export const CH12_META = {
  id: "bab-12",
  title: "Sekarang kamu yang menyambut",
  level: "A1",
  unit: 12,
  objectives: [
    { id: "a1-u12-o1", title: "Mengundang dan menyepakati waktu" },
    { id: "a1-u12-o2", title: "Menerima atau menolak ajakan dan mengusulkan waktu lain" },
    { id: "a1-u12-o3", title: "Memulai percakapan telepon" },
    { id: "a1-u12-o4", title: "Memakai anrufen pisah dan meninggalkan pesan" },
    { id: "a1-u12-o5", title: "Menulis dan membalas pesan sederhana" },
  ],
} as const;

const low = (s: string) =>
  s.toLowerCase().replace(/ß/g, "ss").replace(/[.,!?;:…"'„“”()\-]/g, " ").replace(/\s+/g, " ").trim();

function evalInvite(text: string): EvalResult | null {
  const s = low(text);
  const hasLade = /(lade|einlad)/.test(s);
  const hasKommen = /(kommst|mit|treffen|komm)/.test(s);
  if (hasLade && hasKommen) {
    return { next: "ch12-s01-inv-ok", record: { objective: "a1-u12-o1", full: true } };
  }
  if (hasLade && !hasKommen) {
    return {
      feedback: "Ajakanmu sudah ada. Lanjutkan dengan „Kommst du mit?“ supaya menjadi satu ajakan utuh.",
      keepDraft: true,
    };
  }
  if (/(sonntag|samstag|uhr)/.test(s) && !hasLade) {
    return {
      feedback: "Kamu menyebut waktu, tetapi belum mengajak. Mulai dengan „Ich lade dich ein.“",
      keepDraft: true,
    };
  }
  return null;
}

function evalTime(text: string): EvalResult | null {
  const s = low(text);
  if (/(vier|16|4)\s*(uhr)?/.test(s) && /(treffen|kommen|uhr)/.test(s)) {
    return {
      next: "ch12-s01-uhr-ok",
      record: { objective: "a1-u12-o1", full: true },
      setFlags: { ch12AgreedSunday: true },
    };
  }
  if (/(samstag)/.test(s)) {
    return {
      feedback: "Kalendermu penuh pada hari Sabtu. Hari yang masih kosong adalah Sonntag.",
      keepDraft: true,
    };
  }
  return null;
}

function evalDecline(text: string): EvalResult | null {
  const s = low(text);
  const declines = /(leider|kann ich nicht|nicht)/.test(s);
  const proposes = /sonntag/.test(s);
  if (declines && proposes) {
    return { next: "ch12-s01-o2-ok", record: { objective: "a1-u12-o2", full: true } };
  }
  if (declines && !proposes) {
    return {
      feedback: "Tolak dengan sopan sudah benar. Usulkan satu waktu konkret: „Können wir uns am Sonntag treffen?“",
      keepDraft: true,
    };
  }
  if (/^(ja|gern|iya|yes)\b/.test(s)) {
    return {
      feedback: "Kartumu penuh pada hari Sabtu — jangan setuju. Tolak sopan lalu usulkan Sonntag.",
      keepDraft: true,
    };
  }
  return null;
}

function evalPhoneIntro(text: string): EvalResult | null {
  const s = low(text);
  if (/hier ist/.test(s)) {
    return { next: "ch12-s02-intro-ok", record: { objective: "a1-u12-o3", full: true } };
  }
  if (/(guten tag|hallo)/.test(s) && !/hier ist/.test(s)) {
    return {
      feedback: "Sapaanmu terdengar. Saat menelepon, kenalkan dirimu dengan „hier ist {nama}“.",
      keepDraft: true,
    };
  }
  return null;
}

function evalCallLater(text: string): EvalResult | null {
  const s = low(text);
  if (/ruf/.test(s) && /sonntag/.test(s)) {
    return { next: "ch12-s02-call-ok", record: { objective: "a1-u12-o4", full: true } };
  }
  if (/ruf/.test(s) && /samstag|montag|dienstag|freitag/.test(s)) {
    return {
      feedback: "Catat harinya baik-baik: Eva minta dihubungi pada hari Minggu (Sonntag).",
      keepDraft: true,
    };
  }
  if (/bauer/.test(s)) {
    return {
      feedback: "Peneleponnya adalah Eva — bukan Herr Bauer. Sebut namanya: „Ich rufe dich am Sonntag an.“",
      keepDraft: true,
    };
  }
  return null;
}

function evalMessage(text: string): EvalResult | null {
  const s = low(text);
  const hasDay = /sonntag/.test(s);
  const hasTime = /(vier|16)\s*(uhr)?/.test(s);
  const hasPlace = /(café|cafe|kafe)/.test(s);
  // U08: umpan balik menyasar informasi yang salah, satu hal per satu.
  if (/samstag/.test(s) && !hasDay) {
    return {
      feedback: "Hari yang kamu tulis berbeda dari jadwal: kalian sepakat Sonntag. Perbaiki hanya bagian hari.",
      keepDraft: true,
      record: { objective: "a1-u12-o5", full: false },
    };
  }
  if (!hasDay) {
    return {
      feedback: "Hari pertemuan belum tercantum. Tulis „am Sonntag“ sesuai kesepakatanmu dengan Eva.",
      keepDraft: true,
    };
  }
  if (!hasTime) {
    return {
      feedback: "Jam pertemuan belum tercantum. Tulis „um vier Uhr“.",
      keepDraft: true,
    };
  }
  if (!hasPlace) {
    return {
      feedback: "Tempat pertemuan belum tercantum. Tulis tempatnya, mis. „im Café“.",
      keepDraft: true,
    };
  }
  return { next: "ch12-s03-sent", record: { objective: "a1-u12-o5", full: true }, setFlags: { ch12MessageSent: true } };
}

function evalClosingName(text: string, ctx: StoryContext): EvalResult | null {
  const s = low(text);
  const name = low(ctx.name);
  const intro = /(ich heisse|ich bin|mein name ist)/.test(s);
  if (intro && (s.includes(name) || name.length === 0)) {
    return { next: "ch12-penutup-ok", record: { objective: "introduce", full: true } };
  }
  if (/(hallo|hi|guten)/.test(s) && !intro) {
    return {
      feedback: "Sampaikan namamu: „Ich heiße {nama}.“ atau „Ich bin {nama}.“",
      keepDraft: true,
    };
  }
  return null;
}

// ctx dipakai penilai nama; import tipe untuk kejelasan kontrak.
type StoryContext = { flags: Record<string, boolean>; name: string; hintCounts: Record<string, number> };

const N: StoryNode[] = [
  // ---------- Adegan 1 · Einladen und verabreden (ruang warga) ----------
  {
    id: "ch12-start",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "ruang-warga", overlay: "calendar", ambience: "rumah",
      chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }],
      calendar: { busy: "Samstag — janji kerja", free: "Sonntag" },
    },
    text: "Ruang warga kembali dibuka. Buku tamu yang dulu hanya berisi satu nama kini hampir penuh. Mia mengingatkanmu pada surat pertamamu.",
    next: "ch12-s01-mia",
  },
  {
    id: "ch12-s01-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch12.s01.umum.dialog-01.mia",
    text: "Erinnerst du dich an deinen ersten Brief?",
    translation: "Kamu ingat surat pertamamu?",
    next: "ch12-s01-tutor",
  },
  {
    id: "ch12-s01-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "einladen dan mitkommen dapat dipisah. Untuk waktu bersama tanyakan „Um wie viel Uhr treffen wir uns?“",
    next: "ch12-s01-mia2",
  },
  {
    id: "ch12-s01-mia2",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o1.dialog-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    text: "Wir öffnen morgen den Raum. Wen lädst du ein?",
    translation: "Besok kita membuka ruang warga. Siapa yang kamu undang?",
    next: "ch12-s01-inv",
  },
  {
    id: "ch12-s01-inv",
    kind: "input",
    speaker: "mia",
    where: "ch12-s01-o1",
    prompt: "Giliranmu: undang tamu yang kamu temui di stasiun — Eva. Ajak dia ikut serta.",
    chips: ["Ich", "lade", "dich", "ein", "Kommst", "du", "mit", "?"],
    hints: [
      "Kamu ingin mengundang Eva dan menanyakan apakah ia ikut.",
      "Mulai dengan: „Ich lade dich ein. …“",
      "Contoh lengkap: „Ich lade dich ein. Kommst du mit?“",
    ],
    evaluate: evalInvite,
    unknownHint: "Ajakanmu diawali „Ich lade dich ein.“ dan ditutup „Kommst du mit?“",
  },
  {
    id: "ch12-s01-inv-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o1.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    text: "Ich lade dich ein. Kommst du mit?",
    translation: "Contoh suaramu: aku mengundangmu. Ikut kah kamu?",
    next: "ch12-s01-uhr-tutor",
  },
  {
    id: "ch12-s01-uhr-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o1.tutor-de-01.tutor",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "question" }] },
    text: "Um wie viel Uhr treffen wir uns?",
    translation: "Kita bertemu jam berapa?",
    next: "ch12-s01-uhr",
  },
  {
    id: "ch12-s01-uhr",
    kind: "input",
    speaker: "tutor",
    where: "ch12-s01-uhr",
    prompt: "Sepakati waktu bertemu — lihat kalender: hari bebasmu adalah Sonntag.",
    chips: ["Wir", "treffen", "uns", "am", "Sonntag", "um", "vier", "Uhr", "."],
    hints: [
      "Kalender: Samstag penuh, Sonntag kosong.",
      "Mulai dengan: „Wir treffen uns am Sonntag …“",
      "Contoh lengkap: „Wir treffen uns am Sonntag um vier Uhr.“",
    ],
    evaluate: evalTime,
    unknownHint: "Usulkan hari Minggu pukul empat: „Wir treffen uns am Sonntag um vier Uhr.“",
  },
  {
    id: "ch12-s01-uhr-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o1.pemain-baku-02.{avatar}",
    stage: {
      chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }],
      calendar: { busy: "Samstag — janji kerja", free: "Sonntag", agreed: "Sonntag um vier Uhr" },
    },
    text: "Wir treffen uns am Sonntag um vier Uhr.",
    translation: "Contoh suaramu: kita bertemu hari Minggu pukul empat.",
    next: "ch12-s01-eva",
  },
  {
    id: "ch12-s01-eva",
    kind: "line",
    speaker: "eva",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o2.dialog-01.eva",
    stage: { chars: [{ id: "player", side: "left" }, { id: "eva", side: "right", expr: "question" }] },
    text: "Hast du am Samstag Zeit?",
    translation: "Sabtu kamu punya waktu? (Eva mengusulkan hari lain.)",
    next: "ch12-s01-o2",
  },
  {
    id: "ch12-s01-o2",
    kind: "input",
    speaker: "eva",
    where: "ch12-s01-o2",
    prompt: "Kartumu penuh pada Sabtu. Tolak dengan sopan dan usulkan satu waktu konkret.",
    chips: ["Leider", "kann", "ich", "nicht", "Können", "wir", "uns", "am", "Sonntag", "treffen", "?"],
    hints: [
      "Sabtumu penuh. Tolak sopan, lalu tawarkan hari lain.",
      "Mulai dengan: „Leider kann ich nicht. …“",
      "Contoh lengkap: „Leider kann ich nicht. Können wir uns am Sonntag treffen?“",
    ],
    evaluate: evalDecline,
    unknownHint: "Tolak dengan „Leider kann ich nicht.“ lalu usulkan Sonntag.",
  },
  {
    id: "ch12-s01-o2-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s01.a1-u12-o2.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "eva", side: "right", expr: "neutral" }] },
    text: "Leider kann ich nicht. Können wir uns am Sonntag treffen?",
    translation: "Contoh suaramu: maaf, aku tidak bisa. Bisakah kita bertemu hari Minggu?",
    next: "ch12-s01-eva-accept",
  },
  {
    id: "ch12-s01-eva-accept",
    kind: "line",
    speaker: "eva",
    lang: "de",
    // Balasan Eva belum tersedia sebagai klip produksi — jatuh ke TTS de-DE.
    text: "Gern! Dann bis Sonntag!",
    translation: "Dengan senang hati! Sampai hari Minggu!",
    stage: { chars: [{ id: "player", side: "left" }, { id: "eva", side: "right", expr: "smile" }] },
    setFlags: { ch12MetEva: true },
    next: "ch12-s02-phone",
  },

  // ---------- Adegan 2 · Am Telefon (Eva bersuara tanpa potret) ----------
  {
    id: "ch12-s02-phone",
    kind: "line",
    speaker: "narator",
    lang: "id",
    sfx: "telepon",
    stage: {
      bg: "ruang-warga", overlay: null, ambience: "rumah",
      chars: [{ id: "player", side: "left" }],
    },
    text: "Beberapa hari kemudian, telepon di meja ruang warga berdering.",
    next: "ch12-s02-eva",
  },
  {
    id: "ch12-s02-eva",
    kind: "line",
    speaker: "eva",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o3.dialog-01.eva",
    text: "Guten Tag, hier ist Eva. Kann ich bitte mit Mia sprechen?",
    translation: "Selamat siang, ini Eva. Bolehkah saya berbicara dengan Mia?",
    next: "ch12-s02-intro",
  },
  {
    id: "ch12-s02-intro",
    kind: "input",
    speaker: "eva",
    where: "ch12-s02-o3",
    prompt: "Angkat telepon: sapa dan kenalkan dirimu, lalu minta Eva menunggu sebentar.",
    chips: ["Guten", "Tag", "hier", "ist", "{name}", "Einen", "Moment", "bitte", "."],
    hints: [
      "Saat menelepon, kenalkan dirimu dengan „hier ist …“",
      "Mulai dengan: „Guten Tag, hier ist {name}.“",
      "Contoh lengkap: „Guten Tag, hier ist {name}. Einen Moment bitte.“",
    ],
    evaluate: evalPhoneIntro,
    unknownHint: "Kenalkan dirimu: „Guten Tag, hier ist {name}. Einen Moment bitte.“",
  },
  {
    id: "ch12-s02-intro-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o3.pemain-baku-01-tunggu.{avatar}",
    text: "Guten Tag, hier ist {name}. Einen Moment bitte.",
    translation: "Contoh suaramu: selamat siang, ini {name}. Sebentar ya.",
    next: "ch12-s02-mia-away",
  },
  {
    id: "ch12-s02-mia-away",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }] },
    text: "Kamu melihat ke meja Mia — kursinya kosong. Mia sedang berada di luar.",
    next: "ch12-s02-eva2",
  },
  {
    id: "ch12-s02-eva2",
    kind: "line",
    speaker: "eva",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.dialog-01.eva",
    text: "Mia ist nicht da? Kann ich eine Nachricht hinterlassen?",
    translation: "Mia tidak ada? Bolehkah saya meninggalkan pesan?",
    next: "ch12-s02-accept",
  },
  {
    id: "ch12-s02-accept",
    kind: "input",
    speaker: "eva",
    where: "ch12-s02-o4",
    prompt: "Terima pesan itu dengan senang hati — „Ja, gern.“",
    chips: ["Ja", "gern", "."],
    hints: ["Terima dengan sopan.", "Coba: „Ja, gern.“"],
    handlers: [
      { intents: ["ja"], next: "ch12-s02-accept-ok", record: { objective: "a1-u12-o4", full: true } },
      { intents: ["nein"], next: "ch12-s02-accept-hint" },
    ],
    unknownHint: "Terima pesannya: „Ja, gern.“",
  },
  {
    id: "ch12-s02-accept-hint",
    kind: "line",
    speaker: "eva",
    lang: "de",
    text: "Doch, gerne — ich warte.",
    translation: "Ya, dengan senang hati — saya tunggu.",
    next: "ch12-s02-accept",
  },
  {
    id: "ch12-s02-accept-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.pemain-baku-01.{avatar}",
    text: "Ja, gern.",
    translation: "Contoh suaramu: ya, dengan senang hati.",
    next: "ch12-s02-eva-msg",
  },
  {
    id: "ch12-s02-eva-msg",
    kind: "line",
    speaker: "eva",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.pesan-suara-01.eva",
    text: "Bitte ruf mich am Sonntag an.",
    translation: "Tolong hubungi saya pada hari Minggu. (Catat: siapa menelepon, dan hari yang diminta.)",
    next: "ch12-s02-call",
  },
  {
    id: "ch12-s02-call",
    kind: "input",
    speaker: "eva",
    where: "ch12-s02-o4b",
    prompt: "Sebagai Mia, janjikan kamu akan meneleponnya kembali pada hari yang diminta.",
    chips: ["Ich", "rufe", "dich", "am", "Sonntag", "an", "."],
    hints: [
      "Eva minta dihubungi pada hari Minggu. anrufen terpisah: „rufe … an“.",
      "Mulai dengan: „Ich rufe dich am Sonntag …“",
      "Contoh lengkap: „Ich rufe dich am Sonntag an.“",
    ],
    evaluate: evalCallLater,
    unknownHint: "Jawab sebagai Mia: „Ich rufe dich am Sonntag an.“",
  },
  {
    id: "ch12-s02-call-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.pemain-baku-02.{avatar}",
    text: "Ich rufe dich am Sonntag an.",
    translation: "Contoh suaramu: aku akan meneleponmu hari Minggu.",
    next: "ch12-s02-eva-bye",
  },
  {
    id: "ch12-s02-eva-bye",
    kind: "line",
    speaker: "eva",
    lang: "de",
    audio: "a1-ch12.s02.a1-u12-o4.transisi-01.eva",
    text: "Danke. Dann höre ich am Sonntag von euch.",
    translation: "Terima kasih. Kalau begitu aku menunggu kabar kalian hari Minggu.",
    next: "ch12-s03-intro",
  },

  // ---------- Adegan 3 · Eine Nachricht schreiben (meja tulis) ----------
  {
    id: "ch12-s03-intro",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "ambang-rumah", overlay: "postcard", ambience: "rumah",
      chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }],
    },
    text: "Meja tulis dan kotak pos. Ada kartu dengan gambar cangkir kosong — sama seperti surat pertamamu. Sekarang giliranmu menulis ajakan.",
    next: "ch12-s03-tutor",
  },
  {
    id: "ch12-s03-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "Pesan singkat perlu penerima, waktu, tempat, dan penutup. Gunakan Briefumschlag untuk amplop, Briefmarke untuk prangko.",
    next: "ch12-s03-mia",
  },
  {
    id: "ch12-s03-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch12.s03.a1-u12-o5.dialog-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    text: "Unser Gast kennt den neuen Termin noch nicht. Schreibst du ihm?",
    translation: "Tamu kita belum tahu jadwal yang baru. Maukah kamu menulis kepadanya?",
    next: "ch12-s03-write",
  },
  {
    id: "ch12-s03-write",
    kind: "input",
    speaker: "mia",
    where: "ch12-s03-o5",
    multiline: true,
    prompt: "Tulis pesan untuk Eva berdasarkan kesepakatan: hari Minggu, pukul empat, di kafe. Susunan lain yang wajar tetap diterima.",
    chips: [],
    hints: [
      "Pesan singkat perlu: sapaan, hari, jam, tempat, dan penutup.",
      "Mulai dengan: „Hallo Eva, danke für deine Nachricht. …“",
      "Contoh lengkap: „Hallo Eva, danke für deine Nachricht. Wir treffen uns am Sonntag um vier Uhr im Café. Bis bald! {name}“",
    ],
    evaluate: evalMessage,
    unknownHint: "Sertakan hari (Sonntag), jam (um vier Uhr), dan tempat (im Café).",
  },
  {
    id: "ch12-s03-sent",
    kind: "line",
    speaker: "narator",
    lang: "id",
    sfx: "kertas",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    // Kirim hanya sekali: bendera ch12MessageSent dipasang oleh penilai, dan
    // node ini tidak bisa dicapai lagi dari jalur manapun setelah pesan terkirim.
    text: "Kartu terkirim. Beberapa hari kemudian jawaban Eva datang — ia menyebut hari dan tempat yang sama: Sonntag, vier Uhr, im Café.",
    next: "ch12-penutup",
  },

  // ---------- Penutup ----------
  {
    id: "ch12-penutup",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "ruang-warga", overlay: null, ambience: "rumah",
      chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }, { id: "pendatang-baru", side: "center", expr: "smile" }],
    },
    text: "Hari pembukaan ruang warga. Seorang pendatang baru berdiri di depan buku tamu, menatap kartu bergambar cangkir.",
    next: "ch12-penutup-gast",
  },
  {
    id: "ch12-penutup-gast",
    kind: "line",
    speaker: "pendatang-baru",
    lang: "de",
    audio: "a1-ch12.penutup.umum.penutup-01.pendatang-baru",
    stage: { chars: [{ id: "player", side: "left" }, { id: "pendatang-baru", side: "right", expr: "question" }] },
    text: "Hallo! Ich bin neu hier. Wie heißt du?",
    translation: "Halo! Aku baru di sini. Siapa namamu?",
    next: "ch12-penutup-input",
  },
  {
    id: "ch12-penutup-input",
    kind: "input",
    speaker: "pendatang-baru",
    where: "ch12-penutup",
    prompt: "Sekarang kamu yang menyambut: perkenalkan dirimu kepada tamu baru.",
    chips: ["Hallo", "Ich", "heiße", "bin", "{name}", "!"],
    hints: [
      "Dulu Mia yang menyapamu; kini giliranmu menyambut orang baru.",
      "Mulai dengan: „Ich heiße …“",
      "Contoh lengkap: „Ich heiße {name}.“",
    ],
    evaluate: evalClosingName,
    unknownHint: "Sampaikan namamu: „Ich heiße {name}.“",
  },
  {
    id: "ch12-penutup-ok",
    kind: "line",
    speaker: "mia",
    lang: "de",
    // Penutup Mia belum tersedia sebagai klip produksi — jatuh ke TTS de-DE.
    text: "Siehst du? Jetzt sorgst du selbst für den Nachbarn.",
    translation: "Lihat? Sekarang kamu sendiri yang menyambut tetangga baru.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    next: "ch12-end",
  },
  { id: "ch12-end", kind: "end", stage: { bg: "ruang-warga", overlay: null } },
];

export const CH12_NODES: Record<string, StoryNode> = Object.fromEntries(N.map((n) => [n.id, n]));
