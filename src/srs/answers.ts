// Validasi jawaban ketik (M1): toleransi kapital, spasi ganda, dan
// varian keyboard (ae/oe/ue/ss ↔ ä/ö/ü/ß). Kata dasar saja, tak melanggar
// kata seperti "Frau" (fold hanya diterapkan bila persis gagal).

export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’´`]/g, "'");
}

const FOLD: Record<string, string> = {
  "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss",
};

export function fold(s: string): string {
  let out = "";
  for (const ch of s) out += FOLD[ch] ?? ch;
  return out;
}

function same(a: string, b: string): boolean {
  return normalize(a) === normalize(b) || fold(normalize(a)) === fold(normalize(b));
}

// DE→ID produce: isi "der Mann" — kata + artikel untuk benda. Urutan artikel
// di depan wajib; "Mann der" ditolak karena menyesatkan tata bahasa.
export function checkProduce(input: string, article: string | null, word: string): boolean {
  const expectedFull = (article ? article + " " : "") + word;
  return same(input, expectedFull);
}

// Dengar→tulis & cloze: satu kata (bisa inflektif, contoh: Jahre).
export function checkWord(input: string, expected: string): boolean {
  return same(input, expected);
}

// Pilihan ganda: kapitalisasi adalah bagian jawaban (Musik ≠ musik,
// schwimmen ≠ Schwimmen), jadi bandingkan persis setelah trim/spasi ganda.
// Hanya jawaban alternatif yang didaftarkan yang diterima; pengecoh
// kapitalisasi tetap salah.
export function choiceMatches(
  chosen: string,
  answer: string,
  altAnswers: readonly string[] = [],
): boolean {
  const clean = (value: string) => value.trim().replace(/\s+/g, " ");
  const picked = clean(chosen);
  return picked === clean(answer) || altAnswers.some((alternative) => clean(alternative) === picked);
}

// Cari token kata di kalimat contoh (case-insensitive, prefer infleksi).
export function findTargetToken(sentence: string, baseWord: string): { token: string; index: number } | null {
  const clean = sentence.replace(/[.,!?;:]+/g, "");
  const tokens = clean.split(/\s+/);
  const norm = (t: string) => fold(t.toLowerCase());
  const base = fold(baseWord.toLowerCase());
  let exact = -1;
  let match = -1;
  tokens.forEach((t, i) => {
    if (norm(t) === base && exact < 0) exact = i;
    if (norm(t).startsWith(base) && match < 0) match = i;
  });
  const idx = exact >= 0 ? exact : match;
  if (idx < 0) return null;
  return { token: tokens[idx], index: idx };
}

// Kalimat dengan token disembunyikan: "Ich ___ heute." (taju kata sudah tersimpan).
export function clozeMask(sentence: string, token: string): string {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");
  return sentence.replace(re, "$1___");
}
