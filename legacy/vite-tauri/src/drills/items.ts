// Bank item drill D1–D5 (F2). D1–D3 dihasilkan dari entri kosakata di DB;
// D4–D5 dari bank statis JSON (disusun mengikuti kerangka Goethe A1).
import d4Raw from "../data/drills/d4_items.json";
import d5Raw from "../data/drills/d5_items.json";
import d6Raw from "../data/drills/d6_items.json";
import d7Raw from "../data/drills/d7_items.json";
import d8Raw from "../data/drills/d8_items.json";
import d9Raw from "../data/drills/d9_items.json";
import d10Raw from "../data/drills/d10_items.json";
import getDb from "../stores/db";
import type { Entry } from "../srs/queue";
import { makeAttemptSeed, mulberry32, shuffleChoiceOptions, type Rng } from "../lessons/optionOrder";

export type DrillCode = "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8" | "D9" | "D10";

export type DrillItem = {
  code: DrillCode;
  lessonExample?: boolean;
  // Latihan penerapan baru untuk pelajaran yang sebelumnya hanya menguji
  // terjemahan contoh; terhubung ke tujuan unit.
  lessonApplication?: boolean;
  // Soal checkpoint berbasis tujuan: bukan contoh pelajaran dan tidak
  // dihitung sebagai akurasi drill biasa.
  checkpoint?: boolean;
  objectiveId?: string;
  wrongFeedback?: Record<string, string>;
  hintOnWrong?: string;
  key: string;
  prompt: string;
  sub: string;
  mode: "choice" | "type" | "order";
  options?: string[];
  tokens?: string[];
  say?: string;
  answer: string;
  explanation: string;
  entryId?: number;
  // Untuk D2: terima juga bentuk tanpa artikel.
  altAnswers?: string[];
};

export const DRILL_META: Record<
  DrillCode,
  { nama: string; level: string; mekanik: string; teori: string[]; requiresVoice?: boolean }
> = {
  D1: {
    nama: "Artikel: der/die/das",
    level: "A1",
    mekanik: "Pilih artikel yang benar untuk kata benda.",
    teori: [
      "Tiga genus: maskulin (der), feminin (die), netral (das). Genus harus dihafal bersama katanya.",
      "Petunjuk akhiran feminin: -ung, -heit, -keit, -schaft, -tion, -tät (die Zeitung, die Freiheit).",
      "Petunjuk maskulin: -er, -en, -el, -ling, -ismus (der Lehrer, der Frühling).",
      "Petunjuk netral: -chen, -lein, -ment, -um (das Mädchen, das Zentrum).",
    ],
  },
  D2: {
    nama: "Plural benda",
    level: "A1",
    mekanik: "Ketik bentuk plural dari kata benda.",
    teori: [
      "Pola umum: -e (der Tisch → die Tische), -er (das Kind → die Kinder), -n/-en (die Frau → die Frauen), -s (das Auto → die Autos).",
      "Banyak kata feminin berakhiran -e/-n → plural -n/-en.",
      "Beberapa kata memakai umlaut + akhiran: der Mann → die Männer, die Stadt → die Städte.",
      "Plural selalu memakai artikel die. Hafalkan bentuk pluralnya bersama kata tunggal.",
    ],
  },
  D3: {
    nama: "Konjugasi praesens",
    level: "A1",
    mekanik: "Ketik bentuk kata kerja untuk kata ganti yang tampil.",
    teori: [
      "Akhiran reguler: ich -e, du -st, er/sie/es -t, wir -en, ihr -t, sie/Sie -en.",
      "Batang berakhiran -s, -ß, -z: du hanya -t (heißen → du heißt, nicht heißst).",
      "Kata kerja takberaturan mengubah vokal: e → i (sprechen → du sprichst), e → ie (sehen → du siehst).",
      "Bentuk wir/sie/Sie selalu sama dengan infinitif tanpa -en? — tidak: sama dengan infinitif penuh (kommen → wir kommen).",
    ],
  },
  D4: {
    nama: "Kasus: Akkusativ/Dativ",
    level: "A1",
    mekanik: "Pilih artikel yang benar pada kalimat.",
    teori: [
      "Nominativ: der/die/das. Akkusativ (objek langsung): den/die/das.",
      "Dativ: dem/der/dem — setelah verba seperti helfen, danken, gefallen, gehören.",
      "Preposisi Dativ: aus, bei, mit, nach, seit, von, zu.",
      "Preposisi Akkusativ: durch, für, gegen, ohne, um.",
    ],
  },
  D5: {
    nama: "Perfekt: haben/sein + Partizip",
    level: "A1",
    mekanik: "Pilih auxiliary (haben/sein), lalu ketik Partizip II.",
    teori: [
      "Sebagian besar verba memakai haben: machen → hat gemacht, lesen → hat gelesen.",
      "Verba gerak/perubahan keadaan memakai sein: gehen → ist gegangen, kommen → ist gekommen, fahren → ist gefahren.",
      "Partizip lemah: ge- + batang + -t (machen → gemacht).",
      "Partizip kuat: ge- + batang berubah + -en (essen → gegessen, sprechen → gesprochen).",
    ],
  },
  D6: {
    nama: "Susun kalimat (word order)",
    level: "A1/A2",
    mekanik: "Susun kalimat dengan tap kata; verb finit selalu posisi 2, pada anak kalimat di akhir.",
    teori: [
      "Kalimat utama Jerman: subjek/keterangan di posisi 1, verb finit di posisi 2.",
      "Bila keterangan waktu/ tempat dibuka di awal, subjek pindah setelah verb (Heute trinke ich Kaffee).",
      "Pertanyaan ya/tidak: verb finit di posisi 1 (Kannst du mir helfen?).",
      "Anak kalimat (weil, dass, wenn): verb finit di akhir (..., weil ich krank bin).",
    ],
  },
  D7: {
    nama: "Präteritum umum",
    level: "A2",
    mekanik: "Ketik bentuk Präteritum dari verb umum (war, hatte, ging …).",
    teori: [
      "Präteritum dipakai banyak di cerita tertulis; dalam percakapan sering diganti Perfekt.",
      "sein: ich war, du warst, er war, wir waren. haben: ich hatte, du hattest, er hatte.",
      "Verb kuat berubah vokal: gehen → ging, kommen → kam, sehen → sah, sprechen → sprach.",
      "Verb lemah: batang + -te (wohnen → wohnte, machen → machte).",
    ],
  },
  D8: {
    nama: "Angka & waktu dari suara",
    level: "A1",
    mekanik: "TTS membacakan angka/jam; ketik angka atau jam yang didengar.",
    teori: [
      "Angka 21–99 dibaca terbalik: einundzwanzig = 1 + und + 20 = 21.",
      "Uhrzeit formal: acht Uhr dreißig = 8:30.",
      "halb sieben = setengah menuju jam tujuh = 6:30 (bukan 7:30).",
      "viertel vor neun = 8:45; viertel nach neun = 9:15.",
    ],
    requiresVoice: true,
  },
  D9: {
    nama: "Präpositionen um/am/im/nach/zu",
    level: "A1/A2",
    mekanik: "Pilih preposisi yang benar dalam kalimat waktu/tujuan.",
    teori: [
      "Waktu: um + jam tepat (um acht Uhr), am + hari/bagian hari (am Montag, am Abend), im + bulan/musim (im Sommer).",
      "Tujuan: nach + kota/negara tanpa artikel (nach Berlin, nach Deutschland), zu + orang/tempat (zum Arzt).",
      "Tempat: in + kota/negara (in Berlin), im = in + dem (im Kino).",
      "nach Hause = menuju rumah; zu Hause = berada di rumah.",
    ],
  },
  D10: {
    nama: "Modal verbs",
    level: "A1",
    mekanik: "Konjugasi modal (können/müssen/dürfen/wollen) + posisi infinitif di akhir.",
    teori: [
      "Modal: können, müssen, dürfen, wollen, mögen, sollen.",
      "ich kann/muss/darf/will/mag; du kannst/musst/darfst/willst/magst.",
      "er/sie/es kann/muss/darf/will/mag — tanpa akhiran -t pada modal.",
      "Modal di posisi 2, infinitif penuh di akhir: Ich kann heute nicht kommen.",
    ],
  },
};

type StaticItem = {
  prompt: string;
  sub: string;
  mode: "choice" | "type";
  options?: string[];
  answer: string;
  altAnswers?: string[];
  say?: string;
  explanation: string;
};

type OrderItem = {
  sentence: string;
  meaning_id: string;
  hint: string;
  explanation: string;
};

const D4_BANK: StaticItem[] = d4Raw as StaticItem[];
const D5_BANK: StaticItem[] = d5Raw as StaticItem[];
const D6_BANK: OrderItem[] = d6Raw as OrderItem[];
const D7_BANK: StaticItem[] = d7Raw as StaticItem[];
const D8_BANK: StaticItem[] = d8Raw as StaticItem[];
const D9_BANK: StaticItem[] = d9Raw as StaticItem[];
const D10_BANK: StaticItem[] = d10Raw as StaticItem[];

const PRONOUNS = [
  { p: "ich", end: "e" },
  { p: "du", end: "st" },
  { p: "er/sie/es", end: "t" },
  { p: "wir", end: "en" },
  { p: "ihr", end: "t" },
  { p: "sie/Sie", end: "en" },
];

// Bentuk takberaturan yang sering muncul di A1. Tanpa ini, D3 akan mengajari
// bentuk salah (mis. "du esst" padahal "du isst").
const IRREGULAR: Record<string, Record<string, string>> = {
  sein: { ich: "bin", du: "bist", "er/sie/es": "ist", wir: "sind", ihr: "seid", "sie/Sie": "sind" },
  haben: { ich: "habe", du: "hast", "er/sie/es": "hat", wir: "haben", ihr: "habt", "sie/Sie": "haben" },
  lesen: { ich: "lese", du: "liest", "er/sie/es": "liest", wir: "lesen", ihr: "lest", "sie/Sie": "lesen" },
  aufstehen: { ich: "stehe auf", du: "stehst auf", "er/sie/es": "steht auf", wir: "stehen auf", ihr: "steht auf", "sie/Sie": "stehen auf" },
  essen: {
    ich: "esse",
    du: "isst",
    "er/sie/es": "isst",
    wir: "essen",
    ihr: "esst",
    "sie/Sie": "essen",
  },
  nehmen: {
    ich: "nehme",
    du: "nimmst",
    "er/sie/es": "nimmt",
    wir: "nehmen",
    ihr: "nehmt",
    "sie/Sie": "nehmen",
  },
  sprechen: {
    ich: "spreche",
    du: "sprichst",
    "er/sie/es": "spricht",
    wir: "sprechen",
    ihr: "sprecht",
    "sie/Sie": "sprechen",
  },
  sehen: {
    ich: "sehe",
    du: "siehst",
    "er/sie/es": "sieht",
    wir: "sehen",
    ihr: "seht",
    "sie/Sie": "sehen",
  },
  fahren: {
    ich: "fahre",
    du: "fährst",
    "er/sie/es": "fährt",
    wir: "fahren",
    ihr: "fahrt",
    "sie/Sie": "fahren",
  },
};

const SAFE_REGULAR = new Set(["kommen", "wohnen", "lernen", "machen", "kaufen", "fragen", "sagen", "spielen", "arbeiten", "finden"]);

// Konjugasi praesens: bentuk takberaturan dulu, lalu aturan reguler + batang -s/-ß/-z.
export function conjugate(de: string, pronoun: string): string | null {
  const irregular = IRREGULAR[de]?.[pronoun];
  if (irregular) return irregular;
  if (!SAFE_REGULAR.has(de)) return null;
  if (!de.endsWith("en")) return null;
  const stem = de.slice(0, -2);
  const row = PRONOUNS.find((x) => x.p === pronoun);
  if (!row) return null;
  if (/[dt]$/.test(stem) && ["du", "er/sie/es", "ihr"].includes(row.p)) return stem + "e" + row.end;
  if (row.p === "du" && /(s|ß|z)$/.test(stem)) return stem + "t";
  return stem + row.end;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export async function loadEntries(): Promise<Entry[]> {
  const db = await getDb();
  return db.select<Entry[]>(
    "SELECT id, kind, de, article, plural, meaning_id, example_de, example_id FROM entries ORDER BY id",
  );
}

// Susun sesi drill: `count` item campuran; weak items dari sesi lalu diprioritaskan,
// dan bila `focusDe` diberikan (kosakata pelajaran), item dari kata itu didahulukan.
export async function buildDrillSession(
  code: DrillCode,
  count = 8,
  focusDe?: string[],
  focusOnly = false,
  rng: Rng = mulberry32(makeAttemptSeed()),
): Promise<DrillItem[]> {
  const db = await getDb();
  const entries = await loadEntries();
  const weak = await db.select<{ item_key: string; wrong: number }[]>(
    "SELECT item_key, COUNT(*) wrong FROM attempts WHERE drill_code = $1 AND correct = 0 AND item_key IS NOT NULL " +
      "GROUP BY item_key HAVING wrong >= 3",
    [code],
  );
  const weakKeys = new Set(weak.map((w) => w.item_key));

  let items: DrillItem[] = [];

  if (code === "D1") {
    const nouns = entries.filter((e) => e.kind === "noun" && e.article);
    items = shuffle(nouns).map((e) =>
      shuffleChoiceOptions(
        {
          code,
          key: `D1:${e.id}`,
          prompt: `___ ${e.de}`,
          sub: "Pilih artikel yang benar.",
          mode: "choice" as const,
          options: ["der", "die", "das"],
          answer: e.article as string,
          explanation: `${e.article} ${e.de}${e.plural ? ` (plural: ${e.plural})` : ""} — artinya ${e.meaning_id}.`,
          entryId: e.id,
        },
        rng,
      ),
    );
  } else if (code === "D2") {
    const nouns = entries.filter((e) => e.kind === "noun" && e.plural);
    items = shuffle(nouns).map((e) => {
      const plural = e.plural as string;
      const noArticle = plural.replace(/^(der|die|das)\s+/i, "");
      return {
        code,
        key: `D2:${e.id}`,
        prompt: `${e.article ?? ""} ${e.de}`,
        sub: "Ketik bentuk pluralnya (boleh dengan atau tanpa artikel).",
        mode: "type" as const,
        answer: plural,
        altAnswers: [noArticle],
        explanation: `Plural dari ${e.article ?? ""} ${e.de} adalah ${plural}.`,
        entryId: e.id,
      };
    });
  } else if (code === "D3") {
    const verbs = entries.filter((e) => e.kind === "verb" && (IRREGULAR[e.de] || SAFE_REGULAR.has(e.de)));
    items = shuffle(
      verbs.flatMap((e) =>
        PRONOUNS.map((row) => ({ entry: e, row })),
      ),
    ).map(({ entry, row }) => {
      const form = conjugate(entry.de, row.p) ?? entry.de;
      return {
        code,
        key: `D3:${entry.id}:${row.p}`,
        prompt: `${row.p} ___ (${entry.de})`,
        sub: "Ketik bentuk konjugasinya (tanpa kata ganti).",
        mode: "type" as const,
        answer: form,
        explanation: `${row.p} ${form} — dari infinitif ${entry.de} (${entry.meaning_id}).`,
        entryId: entry.id,
      };
    });
  } else if (code === "D4") {
    items = shuffle(D4_BANK).map((it) => shuffleChoiceOptions({ ...it, code, key: `D4:${it.prompt}` }, rng));
  } else if (code === "D5") {
    items = shuffle(D5_BANK).map((it) =>
      shuffleChoiceOptions({ ...it, code, key: `D5:${it.prompt}`, entryId: undefined }, rng),
    );
  } else if (code === "D6") {
    items = shuffle(D6_BANK).map((it) => {
      const tokens = it.sentence.split(/\s+/);
      let mixed = shuffle(tokens);
      if (mixed.join(" ") === it.sentence) mixed = [...tokens.slice(1), tokens[0]];
      return {
        code,
        key: `D6:${it.sentence}`,
        prompt: it.meaning_id,
        sub: `${it.hint} Susun kata menjadi kalimat Jerman.`,
        mode: "order" as const,
        tokens: mixed,
        answer: it.sentence,
        explanation: it.explanation,
      };
    });
  } else if (code === "D7") {
    items = shuffle(D7_BANK).map((it) => shuffleChoiceOptions({ ...it, code, key: `D7:${it.prompt}` }, rng));
  } else if (code === "D8") {
    items = shuffle(D8_BANK).map((it) =>
      shuffleChoiceOptions(
        {
          ...it,
          code,
          key: `D8:${it.prompt}:${it.say ?? ""}`,
          entryId: undefined,
        },
        rng,
      ),
    );
  } else if (code === "D9") {
    items = shuffle(D9_BANK).map((it) => shuffleChoiceOptions({ ...it, code, key: `D9:${it.prompt}` }, rng));
  } else {
    items = shuffle(D10_BANK).map((it) => shuffleChoiceOptions({ ...it, code, key: `D10:${it.prompt}` }, rng));
  }

  // Weak items lebih dulu, lalu sisanya hingga `count`.
  const weakItems = items.filter((i) => weakKeys.has(i.key));
  const rest = items.filter((i) => !weakKeys.has(i.key));
  let ordered = [...weakItems, ...rest];

  if (focusDe && focusDe.length > 0) {
    const focus = new Set(focusDe.map((s) => s.toLowerCase()));
    const deById = new Map(entries.map((e) => [e.id, e.de.toLowerCase()]));
    const onTopic = ordered.filter((i) => i.entryId != null && focus.has(deById.get(i.entryId) ?? ""));
    if (focusOnly) return onTopic.slice(0, count);
    if (onTopic.length > 0) {
      const others = ordered.filter((i) => !(i.entryId != null && focus.has(deById.get(i.entryId) ?? "")));
      ordered = [...onTopic, ...others];
    }
  }

  return ordered.slice(0, count);
}
