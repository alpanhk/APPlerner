// Bantuan baca untuk pembelajar Indonesia: pemenggalan suku kata (perkiraan)
// dan pelafalan Jerman yang ditulis dengan ejaan Indonesia.
//
// Catatan penting: ini heuristik, bukan kamus. Untuk kata majemuk dan kata
// serapan, hasilnya bisa berbeda dari pelafalan standar — tetap gunakan Piper
// atau audio bawaan sebagai acuan utama.

const VOWELS = "aeiouäöüy";

// Diftong Jerman diperlakukan sebagai satu vokal.
const DIPHTHONGS = ["eu", "äu", "ei", "ai", "ie", "au"];

const PREFIXES = [
  "ver",
  "vor",
  "ge",
  "be",
  "er",
  "ent",
  "zer",
  "un",
  "über",
  "unter",
  "auf",
  "aus",
  "ein",
  "mit",
  "nach",
  "an",
  "ab",
];

const SUFFIXES = ["ung", "heit", "keit", "schaft", "lich", "isch", "ieren", "chen", "lein", "bar", "sam", "nis", "tum", "ling"];

// Kluster konsonan yang dianggap satu bunyi (tidak dipecah).
const CONSONANT_UNITS = ["tsch", "sch", "ch", "ph", "th", "ck", "qu"];

function tokenizeCluster(cluster: string): string[] {
  const units: string[] = [];
  let i = 0;
  while (i < cluster.length) {
    const unit = CONSONANT_UNITS.find((u) => cluster.startsWith(u, i));
    if (unit) {
      units.push(unit);
      i += unit.length;
    } else {
      units.push(cluster[i]);
      i += 1;
    }
  }
  return units;
}

function isVowel(ch: string): boolean {
  return VOWELS.includes(ch);
}

// Tandai posisi vokal: setiap vokal atau diftong satu "nucleus".
function nuclei(word: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let i = 0;
  while (i < word.length) {
    const ch = word[i];
    if (!isVowel(ch)) {
      i += 1;
      continue;
    }
    const diph = DIPHTHONGS.find((d) => word.startsWith(d, i));
    if (diph) {
      out.push({ start: i, end: i + diph.length });
      i += diph.length;
      continue;
    }
    out.push({ start: i, end: i + 1 });
    i += 1;
  }
  return out;
}

function splitPlain(word: string): string[] {
  const lower = word.toLowerCase();
  const ns = nuclei(lower);
  if (ns.length <= 1) return [word];

  const boundaries: number[] = [];
  for (let k = 0; k < ns.length - 1; k += 1) {
    const between = lower.slice(ns[k].end, ns[k + 1].start);
    if (between.length === 0) {
      // Dua vokal bertemu (mis. Bau-er) → pecah di antara keduanya.
      boundaries.push(ns[k].end);
      continue;
    }
    const units = tokenizeCluster(between);
    // Satu unit → seluruhnya jadi onset suku kata berikutnya (Woh-nung).
    // Lebih dari satu → hanya unit pertama yang tinggal di coda (Fens-ter).
    boundaries.push(units.length === 1 ? ns[k].end : ns[k].end + units[0].length);
  }

  const parts: string[] = [];
  let start = 0;
  for (const b of boundaries) {
    if (b <= start) continue;
    parts.push(word.slice(start, b));
    start = b;
  }
  parts.push(word.slice(start));
  return parts.filter((p) => p.length > 0);
}

// Pecah kata majemuk sederhana (Wohnungsschlüssel) di antara dua huruf kapital
// atau setelah akhiran yang lazim.
function splitCompound(word: string): string[] {
  const byCase = word.split(/(?=[A-ZÄÖÜ])/).filter(Boolean);
  const out: string[] = [];
  for (const part of byCase) {
    // Sambungan "-s-" pada kata majemuk: Wohnungs|schlüssel.
    const m = part.search(/s(sch|st|sp)/i);
    if (part.length > 8 && m > 2 && m < part.length - 3) {
      out.push(part.slice(0, m + 1), part.slice(m + 1));
    } else {
      out.push(part);
    }
  }
  return out.length ? out : [word];
}

export function syllabify(word: string): string[] {
  if (!word) return [];
  const clean = word.replace(/[^A-Za-zÄÖÜäöüß-]/g, "");
  if (!clean) return [word];

  const pieces: string[] = [];
  for (const compound of splitCompound(clean)) {
    let parts = splitPlain(compound);

    // Akhiran yang biasanya membentuk suku kata sendiri.
    if (parts.length > 2) {
      const last = parts[parts.length - 1].toLowerCase();
      const suffix = SUFFIXES.find((s) => last === s);
      if (suffix && parts[parts.length - 2].length >= 2) {
        // sudah terpisah dengan benar (mis. -heit), biarkan
      } else {
        const merged = parts.join("");
        const suf = SUFFIXES.find((s) => merged.length > s.length + 2 && merged.toLowerCase().endsWith(s));
        if (suf) {
          const cut = merged.length - suf.length;
          const head = merged.slice(0, cut);
          // Ulangi pemenggalan pada bagian depan saja.
          const headParts = splitPlain(head);
          parts = [...headParts, merged.slice(cut)];
        }
      }
    }

    // Awalan umum dipisah bila kata cukup panjang.
    if (parts.length > 1) {
      const prefix = PREFIXES.find((p) => parts[0].toLowerCase() === p);
      if (!prefix) {
        const merged = parts.join("");
        const p = PREFIXES.filter((cand) => merged.toLowerCase().startsWith(cand) && merged.length > cand.length + 3).sort(
          (a, b) => b.length - a.length,
        )[0];
        if (p && parts[0].toLowerCase() !== p) {
          // Hanya pindahkan bila batas kata saat ini tidak sudah memisahkannya.
          const headParts = splitPlain(merged.slice(0, p.length));
          const restParts = splitPlain(merged.slice(p.length));
          parts = [...headParts, ...restParts];
        }
      }
    }

    pieces.push(...parts);
  }

  return pieces.map((p, i) => (i === 0 ? p[0].toUpperCase() + p.slice(1) : p.toLowerCase()));
}

// ---- Pelafalan dalam ejaan Indonesia --------------------------------------

const PREFIX_WORDS = ["ver", "vor", "be", "ge", "er", "ent", "zer", "un", "über", "unter", "auf", "aus", "ein", "mit", "nach", "an", "ab"];

function afterPrefix(word: string, pos: number): boolean {
  const head = word.slice(0, pos);
  return PREFIX_WORDS.some((p) => head === p || head.endsWith(p));
}

function respellWord(raw: string): string {
  const word = raw.toLowerCase();
  let out = "";
  let i = 0;

  const atStart = () => i === 0;

  while (i < word.length) {
    const rest = word.slice(i);
    const ch = word[i];

    // Aturan multi-huruf lebih dulu.
    if (rest.startsWith("tsch")) {
      out += "c";
      i += 4;
      continue;
    }
    if (rest.startsWith("sch")) {
      out += "sy";
      i += 3;
      continue;
    }
    if (rest.startsWith("chs")) {
      out += "ks";
      i += 3;
      continue;
    }
    if (rest.startsWith("ch")) {
      out += "kh";
      i += 2;
      continue;
    }
    if (rest.startsWith("ph")) {
      out += "f";
      i += 2;
      continue;
    }
    if (rest.startsWith("th")) {
      out += "t";
      i += 2;
      continue;
    }
    if (rest.startsWith("qu")) {
      out += "kv";
      i += 2;
      continue;
    }
    if (rest.startsWith("ck")) {
      out += "k";
      i += 2;
      continue;
    }
    if (rest.startsWith("tz")) {
      out += "ts";
      i += 2;
      continue;
    }
    if (rest.startsWith("ssch")) {
      out += "ssy";
      i += 4;
      continue;
    }
    if (rest.startsWith("ss") || ch === "ß") {
      out += "s";
      i += ch === "ß" ? 1 : 2;
      continue;
    }
    if (rest.startsWith("sp") && (atStart() || afterPrefix(word, i))) {
      out += "syp";
      i += 2;
      continue;
    }
    if (rest.startsWith("st") && (atStart() || afterPrefix(word, i))) {
      out += "syt";
      i += 2;
      continue;
    }
    if (rest.startsWith("ei") || rest.startsWith("ai")) {
      out += "ai";
      i += 2;
      continue;
    }
    if (rest.startsWith("ie")) {
      out += "ii";
      i += 2;
      continue;
    }
    if (rest.startsWith("eu") || rest.startsWith("äu")) {
      out += "oi";
      i += 2;
      continue;
    }
    if (rest.startsWith("au")) {
      out += "au";
      i += 2;
      continue;
    }

    if (ch === "z") {
      out += "ts";
      i += 1;
      continue;
    }
    if (ch === "v") {
      out += "f";
      i += 1;
      continue;
    }
    if (ch === "w") {
      out += "v";
      i += 1;
      continue;
    }
    if (ch === "j") {
      out += "y";
      i += 1;
      continue;
    }
    if (ch === "x") {
      out += "ks";
      i += 1;
      continue;
    }
    if (ch === "c") {
      out += "k";
      i += 1;
      continue;
    }
    if (ch === "ä") {
      out += "e";
      i += 1;
      continue;
    }
    if (ch === "ö") {
      out += "ö";
      i += 1;
      continue;
    }
    if (ch === "ü") {
      out += "ü";
      i += 1;
      continue;
    }
    if (ch === "y") {
      out += "ü";
      i += 1;
      continue;
    }
    if (ch === "h") {
      // h setelah vokal tidak dibaca (Jahr → jaar); h awal tetap.
      const prev = i > 0 ? word[i - 1] : "";
      if (prev && isVowel(prev)) {
        i += 1;
        continue;
      }
      out += "h";
      i += 1;
      continue;
    }
    if (ch === "s") {
      const prev = i > 0 ? word[i - 1] : "";
      const next = word[i + 1] ?? "";
      const voiced = atStart() || (isVowel(prev) && isVowel(next));
      out += voiced ? "z" : "s";
      i += 1;
      continue;
    }
    if (ch === "e" && rest === "er" && i > 1) {
      out += "a";
      i += 2;
      continue;
    }
    if (ch === "e" && rest === "e" && i > 1) {
      out += "ê";
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }

  return out;
}

export function respell(word: string): string {
  if (!word) return "";
  const pieces = word.split(/([^A-Za-zÄÖÜäöüß]+)/);
  return pieces
    .map((piece) => (/[A-Za-zÄÖÜäöüß]/.test(piece) ? respellWord(piece) : piece))
    .join("");
}

function notesFor(word: string): string[] {
  const w = word.toLowerCase();
  const notes: string[] = [];
  if (w.includes("sch")) notes.push("sch = sy");
  if (w.includes("ch")) notes.push("ch = kh (seperti 'kh' ringan)");
  if (w.includes("ei") || w.includes("ai")) notes.push("ei/ai = ai");
  if (w.includes("ie")) notes.push("ie = ii (vokal panjang)");
  if (w.includes("eu") || w.includes("äu")) notes.push("eu/äu = oi");
  if (w.includes("z")) notes.push("z = ts");
  if (w.includes("v")) notes.push("v dapat berbunyi f atau v, tergantung kata");
  if (w.includes("w")) notes.push("w Jerman umumnya berbunyi seperti v");
  if (w.includes("j")) notes.push("j = y");
  if (w.includes("qu")) notes.push("qu = kv");
  if (w.includes("ß")) notes.push("ß = ss");
  if (w.includes("ä")) notes.push("ä = e");
  if (w.includes("ö")) notes.push("ö = e dengan bibir bulat");
  if (w.includes("ü")) notes.push("ü = i dengan bibir bulat");
  if (w.endsWith("er")) notes.push("akhiran -er dibaca 'a'");
  if (w.includes("h") && /[aeiouäöü]h/.test(w)) notes.push("h setelah vokal tidak dibaca");
  return notes.slice(0, 4);
}

export type ReadingHint = {
  syllables: string;
  spoken: string;
  notes: string[];
};

export function readingHint(word: string): ReadingHint {
  const syllables = syllabify(word).join("-");
  // The letter v varies across native German words and loanwords; avoid a
  // misleading one-rule respelling when no verified transcription is present.
  const spoken = /v/i.test(word) ? "Dengarkan audio untuk bunyi v" : respell(word);
  return { syllables, spoken, notes: notesFor(word) };
}

// ---- Label level dari tag entri ------------------------------------------
export function levelFromTags(tags: string | null | undefined): string {
  const t = (tags ?? "").toLowerCase();
  if (!t) return "—";
  for (const level of ["a1", "a2", "b1", "b2"]) {
    if (t.split(",").includes(level)) return level.toUpperCase();
  }
  if (t.includes("wortschatz")) return "Wortschatz";
  if (t.includes("unit")) return "A1";
  if (t.includes("manual")) return "Manual";
  return t.split(",")[0]?.toUpperCase() || "—";
}
