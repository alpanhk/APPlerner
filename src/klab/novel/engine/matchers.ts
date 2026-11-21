import type { Intent, StoryNode, StoryContext } from "../types";

/** Normalisasi: huruf kecil, ß→ss, buang tanda baca, rapikan spasi. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:…"'„“”‚‘’()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GREETINGS = [
  "hallo",
  "hi",
  "hey",
  "moin",
  "servus",
  "guten morgen",
  "guten tag",
  "guten abend",
  "gruss dich",
  "gruess dich",
  "grüss dich",
  "morgen",
  "tag",
];

function stripGreeting(s: string): { rest: string; hadGreeting: boolean } {
  let rest = s;
  let had = false;
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of GREETINGS) {
      if (rest === g) {
        return { rest: "", hadGreeting: true };
      }
      if (rest.startsWith(g + " ")) {
        rest = rest.slice(g.length + 1).trim();
        had = true;
        changed = true;
      }
    }
  }
  return { rest, hadGreeting: had };
}

/** Deteksi maksud jawaban pemain. Mengembalikan daftar intent yang terdeteksi. */
export function detectIntents(raw: string, playerName: string): Intent[] {
  const s = normalize(raw);
  if (!s) return ["empty"];
  const name = normalize(playerName);
  const intents: Intent[] = [];

  let { rest, hadGreeting } = stripGreeting(s);
  if (hadGreeting) intents.push("greet");

  // ja / nein di awal
  if (/^(ja|jа|yes|iya)\b/.test(rest)) {
    intents.push("ja");
    rest = rest.replace(/^(ja|yes|iya)\b/, "").trim();
  } else if (/^(nein|ne|nee|no|nicht|tidak|bukan)\b/.test(rest)) {
    intents.push("nein");
    rest = rest.replace(/^(nein|ne|nee|no|nicht|tidak|bukan)\b/, "").trim();
    const g2 = stripGreeting(rest);
    rest = g2.rest;
  }

  // Kalimat perkenalan
  const intro = rest.match(/^(?:ich heisse|ich bin|mein name ist)\s+(.+)$/);
  if (intro) {
    const given = intro[1].trim();
    if (/^(nicht|kein|keine)\b/.test(given)) {
      if (!intents.includes("nein")) intents.push("nein"); // "Ich bin nicht Mia" = penyangkalan
    } else if (given === name) intents.push("intro_full");
    else intents.push("intro_other");
  } else if (rest === name && name.length > 0) {
    intents.push("name_only");
  } else if (/^(ich heisse|ich bin|mein name ist)$/.test(rest)) {
    // kalimat belum selesai
  } else if (rest.length > 0 && !intents.includes("ja") && !intents.includes("nein")) {
    intents.push("unknown");
  }

  if (intents.length === 0) intents.push("unknown");
  return intents;
}

export function fillTemplate(text: string, name: string): string {
  return text.replace(/\{name\}/g, name);
}

export function resolveInputHandler(
  node: Extract<StoryNode, { kind: "input" }>,
  intents: Intent[],
  ctx: StoryContext,
) {
  for (const h of node.handlers) {
    if (h.when && !h.when(ctx)) continue;
    if (h.intents.some((i) => intents.includes(i))) return h;
  }
  return null;
}
