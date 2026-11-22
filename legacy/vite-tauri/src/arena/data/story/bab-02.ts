// Bab 02 · Jam yang terlipat — Adegan 1
import type { StoryNode } from "../../types";

export const CTX = {
  chapterId: "a1-ch02",
  chapterNo: 2,
  title: "Jam yang terlipat",
  scene: "s01",
  bg: "ch02",
  locale: "de",
  npcs: [
    { id: "player", side: "left" },
    { id: "tetangga", side: "right", expr: "question" },
  ],
  props: [],
  ambience: "rumah",
  sfx: ["tram"],
  flagsIn: {},
  entryId: "bab02a",
  exitId: "bab03a",
  exitFlags: {},
};

export const META = {
  chapterId: "a1-ch02",
  title: "Jam yang terlipat",
  period: "Bab 02",
  objectives: [
    { id: "numbers", title: "Menyebut angka 1–100", stimulus: "a1-u2-o1" },
    { id: "price", title: "Menanyakan dan menjawab harga", stimulus: "a1-u2-o2" },
    { id: "time", title: "Menanyakan dan menyebut jam", stimulus: "a1-u2-o3" },
    { id: "time2", title: "Menyebut hari dan menanyakan jadwal", stimulus: "a1-u2-o4" },
    { id: "time3", title: "Zeitausdrücke um, am, im", stimulus: "a1-u2-o5" },
  ],
  closingLines: [],
};

export const NODES: StoryNode[] = [
  // --- Adegan 1: Zahlen & Preise (a1-u2-o1) ---
  {
    id: "b02-o1", kind: "input", speaker: "tetangga", where: "tetangga",
    prompt: "Giliranmu. Baca kartu peti kecil dan peti besar — sebutkan angka yang paling kamu pegang: tujuh belas atau tujuh puluh?",
    chips: ["17", "70", "18", "20", "30", "99", "100"],
    hints: [
      'Tujuannya: sebutkan siebzehn (17) atau siebzig (70); perhatikan bunyi akhir.',
      "Frage den Penjual: „Siebzehn oder siebzig?“",
    ],
    handlers: [{ intents: ["unknown"], next: "b02-o1-ok" }],
    unknownHint: "Gunakan «Siebzehn oder siebzig?» — sebutkan dengan tepat.",
  },
  {
    id: "b02-o1-ok", kind: "line", speaker: "tetangga", lang: "de",
    text: "Dann nehme ich das kleine Peti.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tetangga", side: "right", expr: "smile" }] },
    next: "b02-o2",
  },
  // --- Adegan 1b: Harga (a1-u2-o2) ---
  {
    id: "b02-o2", kind: "input", speaker: "tetangga", where: "tetangga",
    prompt: "Giliranmu. „Wie viel kostet der Korb?“ — jawab den Penjual dengan angka yang tepat (achtzehn atau siebzig?).",
    chips: ["Wie", "viel", "kostet", "der", "Korb", "Achtzehn", "Euro"],
    hints: [
      "Coba: „Achtzehn?“ atau „Achtzig?“",
      "Peti kecil kostet achtzehn Euro. Sebutkan hanya angka dan «Euro».",
    ],
    handlers: [{ intents: ["unknown"], next: "b02-o2-ok" }],
    unknownHint: "Gunakan «Wie viel kostet der Korb?» lalu jawab «Achtzehn Euro».",
  },
  {
    id: "b02-o2-ok", kind: "line", speaker: "tetangga", lang: "de",
    text: "Gut — lege der Korb in den Beutel.",
    stage: { chars: [{ id: "player", side: "left" }, { id: "tetangga", side: "right", expr: "smile" }] },
    next: "b02-end",
  },
  { id: "b02-end", kind: "branch", pick: () => "bab03a" },
];

export default NODES;
