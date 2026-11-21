// ===== Bab 11 · Peron berubah (A1, Unit 11) =====
// PILOT-AGENT-1 — misi stasiun sesuai docs/naskah-visual-novel-a1/bab-11.md
// dan Mandat §6.B. Semua klip berlisensi Supertonic (public/a1-story, salinan
// di src/klab/novel/assets). Id klip pemain memakai pola {avatar} dan
// diselesaikan runtime sesuai avatar yang dipilih.
//
// Aturan anti-bocor (U05): selama tugas menyimak, teks yang ditampilkan hanyalah
// deskripsi netral ([…]); kalimat Jerman hanya dibunyikan lewat audio
// (LineNode.spokenText). Papan keberangkatan memakai data lama (fresh=false)
// sampai jawaban diberikan, lalu node berikutnya mengirim papan baru.

import type { EvalResult, StoryNode } from "../../types";

export const CH11_START = "ch11-start";
export const CH11_TRANSFER_START = "ch11-transfer-start";

export const CH11_META = {
  id: "bab-11",
  title: "Peron berubah",
  level: "A1",
  unit: 11,
  objectives: [
    { id: "a1-u11-o1", title: "Menyebut tujuan dengan nach dan in die Schweiz" },
    { id: "a1-u11-o2", title: "Menyebut jam keberangkatan dan kedatangan" },
    { id: "a1-u11-o3", title: "Membawa barang dengan mitnehmen" },
    { id: "a1-u11-o4", title: "Menanyakan peron, keterlambatan, dan sambungan" },
    { id: "a1-u11-o5", title: "Memesan tempat duduk dan meminta informasi" },
  ],
} as const;

// ---------- Penilai jawaban ----------
const low = (s: string) =>
  s.toLowerCase().replace(/ß/g, "ss").replace(/[.,!?;:…"'„“”()\-]/g, " ").replace(/\s+/g, " ").trim();

function evalDestination(text: string): EvalResult | null {
  const s = low(text);
  const hasLeipzig = /nach\s+leipzig/.test(s) || /wir\s+fahren\s+(heute\s+)?nach\s+leipzig/.test(s);
  const hasSchweizIn = /in\s+(die\s+)?schweiz/.test(s);
  if (hasLeipzig && hasSchweizIn) {
    return { next: "ch11-s01-o1-ok", record: { objective: "a1-u11-o1", full: true } };
  }
  if (/nach\s+der\s+schweiz|nach\s+schweiz/.test(s)) {
    return {
      feedback: "Untuk negara berartikel seperti Swiss, pakai „in die Schweiz“ — „nach“ hanya untuk tujuan tanpa artikel seperti Leipzig.",
      keepDraft: true,
    };
  }
  if (hasLeipzig && !hasSchweizIn) {
    return {
      feedback: "Leipzig sudah tepat. Herr Bauer berlibur ke Swiss — negara berartikel memakai „in die Schweiz“.",
      keepDraft: true,
    };
  }
  return null;
}

function evalSchedule(text: string): EvalResult | null {
  const s = low(text);
  const dep = /(neun\s*uhr\s*zehn|9\s*uhr\s*10|09[.:]10|um\s*neun\s*zehn)/.test(s);
  const arr = /(zehn\s*uhr\s*f(u|ü)nfundzwanzig|10\s*uhr\s*25|10[.:]25|f(u|ü)nfundzwanzig)/.test(s);
  if (dep && arr) {
    return { next: "ch11-s01-o2-ok", record: { objective: "a1-u11-o2", full: true } };
  }
  if (dep) {
    return {
      feedback: "Kamu menyebut keberangkatan dua kali. Tiket menunjukkan Ankunft (tiba) 10.25 — „Er kommt um zehn Uhr fünfundzwanzig an.“",
      keepDraft: true,
    };
  }
  if (arr) {
    return {
      feedback: "Jam tiba sudah benar; sebutkan juga Abfahrt (berangkat) 09.10 — „Er fährt um neun Uhr zehn ab.“",
      keepDraft: true,
    };
  }
  return null;
}

function evalMitnehmen(text: string): EvalResult | null {
  const s = low(text);
  const hasMit = /\bmit\b/.test(s);
  const hasNehmen = /(nehme|nehmen|nimmt)\b/.test(s);
  const hasItem = /(rucksack|reisepass|koffer|buch)\b/.test(s);
  if (hasNehmen && hasMit && hasItem) {
    const mitAtEnd = /\bmit\s*$/.test(s);
    if (!mitAtEnd) {
      return {
        feedback: "Isinya sudah lengkap. „mitnehmen“ terpisah: partikel „mit“ berada di akhir kalimat.",
        keepDraft: true,
      };
    }
    return { next: "ch11-s01-o3-ok", record: { objective: "a1-u11-o3", full: true } };
  }
  if (hasNehmen && hasItem && !hasMit) {
    return {
      feedback: "„mitnehmen“ terpisah menjadi „nehme … mit“ — jangan lupa partikel „mit“.",
      keepDraft: true,
    };
  }
  return null;
}

function evalGleisFrage(text: string): EvalResult | null {
  const s = low(text);
  if (/welchem\s*gleis|von\s*welchem|welches\s*gleis|gleis\s*\?/.test(s) || /gleis\b/.test(s)) {
    return { next: "ch11-s02-ask-ok", record: { objective: "a1-u11-o4", full: true } };
  }
  if (/wohin|wo\b/.test(s)) {
    return {
      feedback: "Kamu menanyakan arah tujuan (Wohin?). Yang perlu kamu tanyakan adalah PERON: „Auf welchem Gleis fährt der Zug ab?“",
      keepDraft: true,
    };
  }
  return null;
}

function evalAnschluss(text: string): EvalResult | null {
  const s = low(text);
  if (/anschluss|erreiche|schaffe\b/.test(s)) {
    return { next: "ch11-s03-arrive", record: { objective: "a1-u11-o4", full: true } };
  }
  return null;
}

function evalReservieren(text: string): EvalResult | null {
  const s = low(text);
  if (/reservier/.test(s)) {
    return { next: "ch11-s03-ok", record: { objective: "a1-u11-o5", full: true } };
  }
  if (/^(ja|iya|yes)\b/.test(s) && !/reservier/.test(s)) {
    return {
      feedback: "Petugas bertanya lagi soal kursi: pesan dengan „reservieren“ — „Ich möchte einen Sitzplatz reservieren.“",
      keepDraft: true,
    };
  }
  return null;
}

function evalAnkunftConfirm(text: string): EvalResult | null {
  const s = low(text);
  if (/(zehn\s*uhr\s*f(u|ü)nfundzwanzig|10\s*uhr\s*25|10[.:]25|f(u|ü)nfundzwanzig)/.test(s)) {
    return { next: "ch11-s03-done", record: { objective: "a1-u11-o2", full: true } };
  }
  if (/(neun\s*uhr\s*zehn|09[.:]10)/.test(s)) {
    return {
      feedback: "Itu jam BERANGKAT (Abfahrt). Petugas menanyakan jam TIBA (Ankunft) yang tertera di tiket: 10.25.",
      keepDraft: true,
    };
  }
  return null;
}

// ---------- Transfer: tiket kedua + pengumuman peron 5 ----------
function evalTransferGleis(text: string): EvalResult | null {
  const s = low(text);
  if (/(halb\s+eins|12[.:]30|zw(o|ö)lf\s*uhr\s*drei(ss|β)ig)/.test(s)) {
    return { next: "ch11-transfer-reserv", record: { objective: "a1-u11-o2", full: true } };
  }
  if (/(11[.:]15|elf\s*uhr\s*f(u|ü)nfzehn)/.test(s)) {
    return {
      feedback: "Itu jam berangkat. Baca kolom Ankunft pada tiket baru: 12.30 — „um zwölf Uhr dreißig“ atau „halb eins“.",
      keepDraft: true,
    };
  }
  return null;
}

function evalTransferReserv(text: string): EvalResult | null {
  const s = low(text);
  if (/reservier/.test(s)) {
    return { next: "ch11-transfer-end", record: { objective: "a1-u11-o5", full: true } };
  }
  return null;
}

const N: StoryNode[] = [
  // ---------- Adegan 1 · Eine Reise planen (ruang warga) ----------
  {
    id: "ch11-start",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "ruang-warga", overlay: "ticket", ambience: "rumah",
      chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }],
      ticket: { ziel: "Leipzig", abfahrt: "09.10", ankunft: "10.25", gleis: "2" },
    },
    text: "Di ruang warga, Mia membuka sampul buku dan mengeluarkan dua tiket. Hari ini kalian akan mencoba perjalanan pertamamu.",
    next: "ch11-s01-mia-tickets",
  },
  {
    id: "ch11-s01-mia-tickets",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch11.s01.umum.dialog-01.mia",
    text: "Die Tickets habe ich. Hast du das Buch?",
    translation: "Tiketnya sudah kubawa. Bukunya ada padamu?",
    next: "ch11-s01-slide-a",
  },
  {
    id: "ch11-s01-slide-a",
    kind: "line",
    speaker: "tutor",
    lang: "de",
    audio: "a1-ch11.s01.umum.tutor-slide-01.tutor",
    text: "Wir fahren nach Hamburg.",
    translation: "Contoh: Kami pergi ke Hamburg. — „nach“ untuk kota tanpa artikel.",
    next: "ch11-s01-slide-b",
  },
  {
    id: "ch11-s01-slide-b",
    kind: "line",
    speaker: "tutor",
    lang: "de",
    audio: "a1-ch11.s01.umum.tutor-slide-02.tutor",
    text: "Die Abfahrt ist um Viertel nach acht.",
    translation: "Keberangkatannya pukul lewat seperempat delapan.",
    next: "ch11-s01-slide-c",
  },
  {
    id: "ch11-s01-slide-c",
    kind: "line",
    speaker: "tutor",
    lang: "de",
    audio: "a1-ch11.s01.umum.tutor-slide-03.tutor",
    text: "Hast du deinen Reisepass dabei?",
    translation: "Apakah pasportmu kaubawa?",
    next: "ch11-s01-o1-tutor",
  },
  {
    id: "ch11-s01-o1-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "Untuk kota dan negara tanpa artikel gunakan nach. Untuk tujuan negara berartikel seperti Swiss gunakan in die Schweiz.",
    next: "ch11-s01-o1-mia",
  },
  {
    id: "ch11-s01-o1-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o1.dialog-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    text: "Wohin fahren wir heute? Und wohin fährt Herr Bauer im Sommer?",
    translation: "Hari ini kita pergi ke mana? Dan musim panas nanti Herr Bauer pergi ke mana?",
    next: "ch11-s01-o1-input",
  },
  {
    id: "ch11-s01-o1-input",
    kind: "input",
    speaker: "mia",
    where: "ch11-s01-o1",
    prompt: "Giliranmu. Tiketmu tertulis Leipzig; kartu liburan Herr Bauer menunjukkan Swiss.",
    chips: ["Wir", "fahren", "nach", "Leipzig", "Herr", "Bauer", "fährt", "in", "die", "Schweiz", "Deutschland", "."],
    hints: [
      "Mia bertanya dua tujuan: tujuan kalian hari ini, dan tujuan liburan Herr Bauer.",
      "Mulai dengan: „Wir fahren nach Leipzig.“",
      "Contoh lengkap: „Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz.“",
    ],
    evaluate: evalDestination,
    unknownHint: "Sebut dua tujuan itu: kalian ke Leipzig, dan Herr Bauer ke Swiss.",
  },
  {
    id: "ch11-s01-o1-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o1.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    text: "Wir fahren nach Leipzig. Herr Bauer fährt in die Schweiz.",
    translation: "Contoh suaramu: kita pergi ke Leipzig; musim panas Herr Bauer pergi ke Swiss.",
    next: "ch11-s01-o2-tutor",
  },
  {
    id: "ch11-s01-o2-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "Abfahrt ialah keberangkatan, Ankunft ialah kedatangan. Pada „Wann kommt der Zug an?“ bagian an terdengar paling akhir.",
    next: "ch11-s01-o2-mia",
  },
  {
    id: "ch11-s01-o2-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o2.dialog-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    text: "Wann fährt unser Zug ab? Wann kommt er an?",
    translation: "Kapan kereta kita berangkat? Kapan tiba?",
    next: "ch11-s01-o2-input",
  },
  {
    id: "ch11-s01-o2-input",
    kind: "input",
    speaker: "mia",
    where: "ch11-s01-o2",
    prompt: "Baca tiket di atas meja, lalu sebutkan jam berangkat dan jam tiba.",
    chips: ["Er", "fährt", "um", "neun", "Uhr", "zehn", "ab", "kommt", "zehn", "fünfundzwanzig", "an", "."],
    hints: [
      "Dua kolom tiket: Abfahrt (berangkat) dan Ankunft (tiba). Sebut keduanya.",
      "Mulai dengan: „Er fährt um neun Uhr zehn ab. …“",
      "Contoh lengkap: „Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an.“",
    ],
    evaluate: evalSchedule,
    unknownHint: "Baca kedua kolom pada tiket: berangkat 09.10, tiba 10.25.",
  },
  {
    id: "ch11-s01-o2-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o2.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    text: "Er fährt um neun Uhr zehn ab. Er kommt um zehn Uhr fünfundzwanzig an.",
    translation: "Contoh suaramu: berangkat pukul 09.10, tiba pukul 10.25.",
    setFlags: { ch11TicketRead: true },
    next: "ch11-s01-o3-tutor",
  },
  {
    id: "ch11-s01-o3-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "mitnehmen terpisah menjadi nehme … mit. Kenali der Koffer, der Rucksack, der Reisepass.",
    next: "ch11-s01-o3-mia",
  },
  {
    id: "ch11-s01-o3-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o3.dialog-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "question" }] },
    text: "Was nimmst du auf die Reise mit?",
    translation: "Apa yang kamu bawa dalam perjalanan?",
    next: "ch11-s01-o3-input",
  },
  {
    id: "ch11-s01-o3-input",
    kind: "input",
    speaker: "mia",
    where: "ch11-s01-o3",
    prompt: "Sebutkan dua barang yang kamu bawa: rucksack dan paspor.",
    chips: ["Ich", "nehme", "den", "Rucksack", "und", "Reisepass", "mit", "."],
    hints: [
      "Sebut benda yang kamu bawa, lalu tutup dengan „mit“.",
      "Mulai dengan: „Ich nehme den Rucksack und den Reisepass …“",
      "Contoh lengkap: „Ich nehme den Rucksack und den Reisepass mit.“",
    ],
    evaluate: evalMitnehmen,
    unknownHint: "Gunakan „nehme … mit“ dan sebutkan barangmu.",
  },
  {
    id: "ch11-s01-o3-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch11.s01.a1-u11-o3.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    text: "Ich nehme den Rucksack und den Reisepass mit.",
    translation: "Contoh suaramu: aku membawa rucksack dan paspor.",
    next: "ch11-s02-arrive",
  },

  // ---------- Adegan 2 · Am Bahnhof (peron) — tugas menyimak ----------
  {
    id: "ch11-s02-arrive",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "peron", overlay: "board", ambience: "jalan",
      chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "neutral" }],
      board: { ziel: "Leipzig", gleis: "2", abfahrt: "09.20", verspaetung: "", fresh: false },
    },
    text: "Kalian tiba di peron. Tiketmu menunjukkan peron 2. Seorang petugas stasiun berdiri di dekat papan keberangkatan.",
    next: "ch11-s02-petugas",
  },
  {
    id: "ch11-s02-petugas",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.dialog-01.petugas-stasiun",
    spokenText: "Der Zug hat zehn Minuten Verspätung. Er fährt heute von Gleis vier ab.",
    // Teks tampil sengaja netral: angka peron baru hanya boleh datang dari
    // audio (Mandat §6.B: tidak bocor di teks dialog/papan sebelum dijawab).
    text: "[Petugas stasiun mengatakan sesuatu tentang jadwal kereta hari ini. Dengarkan baik-baik.]",
    next: "ch11-s02-chime",
  },
  {
    id: "ch11-s02-chime",
    kind: "line",
    speaker: "narator",
    lang: "id",
    sfx: "peron-chime",
    stage: { board: { ziel: "Leipzig", gleis: "2", abfahrt: "09.20", verspaetung: "", fresh: false } },
    text: "Nada pengumuman terdengar sekali dari pengeras suara.",
    next: "ch11-s02-announce",
  },
  {
    id: "ch11-s02-announce",
    kind: "line",
    speaker: "pengumuman",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.transisi-01.petugas-stasiun",
    spokenText: "Achtung, der Zug fährt heute von Gleis vier ab.",
    text: "[Pengumuman lewat pengeras suara. Perhatikan peron yang disebut. Buka transkrip hanya bila perlu — itu akan tercatat.]",
    stage: { board: { ziel: "Leipzig", gleis: "2", abfahrt: "09.20", verspaetung: "", fresh: false } },
    next: "ch11-s02-q",
  },
  {
    id: "ch11-s02-q",
    kind: "choice",
    stage: { overlay: "board", board: { ziel: "Leipzig", gleis: "2", abfahrt: "09.20", verspaetung: "", fresh: false } },
    prompt: "Papan masih menampilkan peron lama. Ke peron mana kamu mengarahkan langkahmu?",
    options: [
      {
        label: "Gleis 2",
        next: "ch11-s02-wrong",
        record: { objective: "a1-u11-o4", full: false },
      },
      {
        label: "Gleis 4",
        next: "ch11-s02-right",
        record: { objective: "a1-u11-o4", full: true },
      },
      {
        label: "Gleis 5",
        next: "ch11-s02-wrong",
        record: { objective: "a1-u11-o4", full: false },
      },
    ],
  },
  {
    id: "ch11-s02-wrong",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.klarifikasi-01.petugas-stasiun",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "question" }] },
    text: "Das war das alte Gleis. Hören Sie bitte noch einmal zu.",
    translation: "Itu jalur yang lama. Silakan dengarkan sekali lagi.",
    next: "ch11-s02-announce",
  },
  {
    id: "ch11-s02-right",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.transisi-01.petugas-stasiun",
    stage: {
      board: { ziel: "Leipzig", gleis: "4", abfahrt: "09.30", verspaetung: "+10 Min.", fresh: true },
      chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "smile" }],
    },
    text: "Genau — der Zug fährt heute von Gleis vier ab.",
    translation: "Tepat — hari ini kereta berangkat dari peron empat. (Papan kini menampilkan peron baru.)",
    next: "ch11-s02-ask",
  },
  {
    id: "ch11-s02-ask",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-s02-ask",
    mic: { objective: "a1-u11-o4", next: "ch11-s02-ask-ok", modelText: "Auf welchem Gleis fährt der Zug ab?" },
    modelAudio: "a1-ch11.s02.a1-u11-o4.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "neutral" }] },
    prompt: "Giliranmu: tanyakan peron kepada petugas — „Auf welchem Gleis fährt der Zug ab?“ Rekam jawabanmu dengan suara, atau gunakan teks.",
    chips: ["Auf", "welchem", "Gleis", "fährt", "der", "Zug", "ab", "?"],
    hints: [
      "Kamu ingin tahu peron kereta. „Auf welchem Gleis“ = di peron berapa.",
      "Mulai dengan: „Auf welchem Gleis …“",
      "Contoh lengkap: „Auf welchem Gleis fährt der Zug ab?“",
    ],
    evaluate: evalGleisFrage,
    unknownHint: "Pertanyaanmu belum tentang peron. Coba: „Auf welchem Gleis fährt der Zug ab?“",
  },
  {
    id: "ch11-s02-ask-ok",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    // Balasan petugas belum tersedia sebagai klip produksi — jatuh ke TTS de-DE.
    text: "Gleis vier, wie gesagt. Der Anschluss wartet noch.",
    translation: "Peron empat, seperti tadi. Kereta sambungan masih menunggu.",
    next: "ch11-s02-ask2",
  },
  {
    id: "ch11-s02-ask2",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-s02-ask2",
    mic: { objective: "a1-u11-o4", next: "ch11-s03-arrive", modelText: "Erreiche ich meinen Anschluss?" },
    modelAudio: "a1-ch11.s02.a1-u11-o4.pemain-baku-02.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "neutral" }] },
    prompt: "Tanyakan juga kereta sambunganmu — „Erreiche ich meinen Anschluss?“ Rekam atau gunakan teks.",
    chips: ["Erreiche", "ich", "meinen", "Anschluss", "?"],
    hints: [
      "Anschluss = kereta sambungan. Tanyakan apakah kamu masih mengejarnya.",
      "Mulai dengan: „Erreiche ich …“",
      "Contoh lengkap: „Erreiche ich meinen Anschluss?“",
    ],
    evaluate: evalAnschluss,
    unknownHint: "Tanyakan kereta sambungan: „Erreiche ich meinen Anschluss?“",
  },

  // ---------- Adegan 3 · Informationen und Reservierung (loket) ----------
  {
    id: "ch11-s03-arrive",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "stasiun", overlay: "ticket", ambience: "jalan",
      chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "smile" }],
      ticket: { ziel: "Leipzig", abfahrt: "09.30", ankunft: "10.25", gleis: "4" },
    },
    text: "Kalian menuju loket informasi. Tiket sudah di tangan, tetapi tempat duduk belum dipesan.",
    next: "ch11-s03-tutor",
  },
  {
    id: "ch11-s03-tutor",
    kind: "line",
    speaker: "tutor",
    lang: "id",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tutor", side: "right", expr: "neutral" }] },
    text: "Pesan tempat duduk dengan reservieren. Di loket minta informasi dan sambungan; di mesin pilih tiket.",
    next: "ch11-s03-petugas",
  },
  {
    id: "ch11-s03-petugas",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.dialog-01.petugas-stasiun",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "question" }] },
    text: "Sie möchten nach Leipzig. Brauchen Sie auch einen Sitzplatz?",
    translation: "Anda ingin ke Leipzig. Apakah juga memerlukan tempat duduk?",
    next: "ch11-s03-input",
  },
  {
    id: "ch11-s03-input",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-s03",
    prompt: "Pesan tempat duduk, lalu minta informasi tentang sambungan. Susunan lain yang sopan tetap diterima.",
    chips: ["Ja", "ich", "möchte", "einen", "Sitzplatz", "reservieren", "Können", "Sie", "mir", "eine", "Auskunft", "geben", "?"],
    hints: [
      "Pesan kursi dengan „reservieren“, lalu boleh minta Auskunft (informasi).",
      "Mulai dengan: „Ja, ich möchte einen Sitzplatz reservieren. …“",
      "Contoh lengkap: „Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben?“",
    ],
    evaluate: evalReservieren,
    unknownHint: "Pesan kursi: „Ich möchte einen Sitzplatz reservieren.“",
  },
  {
    id: "ch11-s03-ok",
    kind: "line",
    speaker: "player",
    lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.pemain-baku-01.{avatar}",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "smile" }] },
    text: "Ja, ich möchte einen Sitzplatz reservieren. Können Sie mir eine Auskunft geben?",
    translation: "Contoh suaramu: ya, aku ingin memesan tempat duduk. Bisakah Anda memberi saya informasi?",
    next: "ch11-s03-konfirmasi",
  },
  {
    id: "ch11-s03-konfirmasi",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.konfirmasi-01.petugas-stasiun",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "question" }] },
    text: "Also, ein Sitzplatz nach Leipzig. Wann kommen wir an?",
    translation: "Jadi, satu tempat duduk ke Leipzig. Kita tiba jam berapa?",
    next: "ch11-s03-ankunft",
  },
  {
    id: "ch11-s03-ankunft",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-s03-ankunft",
    prompt: "Bacakan jam TIBA dari tiket terakharmu.",
    chips: ["um", "zehn", "Uhr", "fünfundzwanzig", "."],
    hints: [
      "Petugas menanyakan Ankunft — kolom jam tiba pada tiket.",
      "Mulai dengan: „Um zehn Uhr fünfundzwanzig.“",
      "Contoh lengkap: „Wir kommen um zehn Uhr fünfundzwanzig an.“",
    ],
    evaluate: evalAnkunftConfirm,
    unknownHint: "Lihat kolom Ankunft di tiket: 10.25.",
  },
  {
    id: "ch11-s03-done",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    text: "Vielen Dank. Ihre Reservierung ist bestätigt — zwei Karten, ein Fensterplatz.",
    translation: "Terima kasih. Reservasi Anda sudah dikonfirmasi — dua tiket, satu tempat di jendela.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "smile" }] },
    setFlags: { ch11Reserved: true },
    next: "ch11-s03-mia",
  },
  {
    id: "ch11-s03-mia",
    kind: "line",
    speaker: "mia",
    lang: "de",
    audio: "a1-ch11.s03.a1-u11-o5.transisi-01.mia",
    stage: { chars: [{ id: "player", side: "left" }, { id: "mia", side: "right", expr: "smile" }] },
    text: "Schreib Eva bitte, wann wir wieder zu Hause sind.",
    translation: "Tolong kabari Eva kapan kita kembali ke rumah.",
    next: "ch12-start",
  },

  // ---------- Transfer · Pertemuan mandiri (tiket kedua, peron 5) ----------
  {
    id: "ch11-transfer-start",
    kind: "line",
    speaker: "narator",
    lang: "id",
    stage: {
      bg: "stasiun", overlay: "ticket", ambience: "jalan",
      chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "neutral" }],
      ticket: { ziel: "Dresden", abfahrt: "11.15", ankunft: "12.30", gleis: "3" },
      board: { ziel: "Dresden", gleis: "3", abfahrt: "11.15", verspaetung: "", fresh: false },
    },
    text: "Hari lain, perjalanan baru: tiket ke Dresden, berangkat 11.15 dari peron 3. Perhatikan pengumuman sekali lagi.",
    next: "ch11-transfer-chime",
  },
  {
    id: "ch11-transfer-chime",
    kind: "line",
    speaker: "narator",
    lang: "id",
    sfx: "peron-chime",
    stage: { overlay: "board" },
    text: "Nada pengumuman terdengar.",
    next: "ch11-transfer-announce",
  },
  {
    id: "ch11-transfer-announce",
    kind: "line",
    speaker: "pengumuman",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.pengumuman-variasi-01.petugas-stasiun",
    spokenText: "Achtung, der Zug fährt heute von Gleis fünf ab.",
    text: "[Pengumuman lewat pengeras suara — tiketmu masih menunjukkan peron 3.]",
    stage: { board: { ziel: "Dresden", gleis: "3", abfahrt: "11.15", verspaetung: "", fresh: false } },
    next: "ch11-transfer-q",
  },
  {
    id: "ch11-transfer-q",
    kind: "choice",
    stage: { overlay: "board", board: { ziel: "Dresden", gleis: "3", abfahrt: "11.15", verspaetung: "", fresh: false } },
    prompt: "Peron baru yang disebut pengumuman adalah…",
    options: [
      { label: "Gleis 3", next: "ch11-transfer-wrong", record: { objective: "a1-u11-o4", full: false } },
      { label: "Gleis 5", next: "ch11-transfer-right", record: { objective: "a1-u11-o4", full: true } },
      { label: "Gleis 4", next: "ch11-transfer-wrong", record: { objective: "a1-u11-o4", full: false } },
    ],
  },
  {
    id: "ch11-transfer-wrong",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    audio: "a1-ch11.s02.a1-u11-o4.klarifikasi-01.petugas-stasiun",
    text: "Das war das alte Gleis. Hören Sie bitte noch einmal zu.",
    translation: "Itu jalur yang lama. Silakan dengarkan sekali lagi.",
    next: "ch11-transfer-announce",
  },
  {
    id: "ch11-transfer-right",
    kind: "line",
    speaker: "petugas-stasiun",
    lang: "de",
    text: "Richtig — heute von Gleis fünf.",
    translation: "Benar — hari ini dari peron lima.",
    stage: { board: { ziel: "Dresden", gleis: "5", abfahrt: "11.15", verspaetung: "", fresh: true }, chars: [{ id: "player", side: "left" }, { id: "petugas-stasiun", side: "right", expr: "smile" }] },
    next: "ch11-transfer-ankunft",
  },
  {
    id: "ch11-transfer-ankunft",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-transfer-ankunft",
    prompt: "Sebutkan jam TIBA perjalanan baru ini, lalu pesan kursi untuk pulang.",
    chips: ["Der", "Zug", "kommt", "um", "zwölf", "Uhr", "dreißig", "ich", "möchte", "reservieren", "."],
    hints: [
      "Baca kolom Ankunft pada tiket baru: 12.30.",
      "Katakan: „Der Zug kommt um zwölf Uhr dreißig.“",
      "Lanjutkan: „… und ich möchte einen Sitzplatz reservieren.“",
    ],
    evaluate: evalTransferGleis,
    unknownHint: "Jam tiba ada di tiket: 12.30 („um zwölf Uhr dreißig“ atau „halb eins“).",
  },
  {
    id: "ch11-transfer-reserv",
    kind: "input",
    speaker: "petugas-stasiun",
    where: "ch11-transfer-reserv",
    prompt: "Pesan satu tempat duduk untuk perjalanan pulang.",
    chips: ["Ich", "möchte", "einen", "Sitzplatz", "reservieren", "."],
    hints: [
      "Pesan dengan „reservieren“.",
      "Mulai dengan: „Ich möchte einen Sitzplatz …“",
      "Contoh lengkap: „Ich möchte einen Sitzplatz reservieren.“",
    ],
    evaluate: evalTransferReserv,
    unknownHint: "Pesan kursi: „Ich möchte einen Sitzplatz reservieren.“",
  },
  {
    id: "ch11-transfer-end",
    kind: "end",
    stage: { bg: "stasiun", overlay: null, chars: [{ id: "player", side: "left" }] },
  },
];

export const CH11_NODES: Record<string, StoryNode> = Object.fromEntries(N.map((n) => [n.id, n]));
