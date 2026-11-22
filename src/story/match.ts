import type { Rule } from "./types";

// ===== Pencocok jawaban berbasis pola =====
// Versi lama hanya mengenal maksud perkenalan (greet / intro_full / …), sehingga
// bab lain terpaksa menerima jawaban apa pun. Di sini setiap giliran menulis
// polanya sendiri dengan bahasa Jerman biasa:
//   "ich komme aus ~"        ~  = satu sampai empat kata bebas
//   "ich heisse {name}"      {name} = nama pemain
//   "(guten )?morgen"        tanda kurung, | dan ? seperti regex
// Huruf besar, tanda baca, ß dan umlaut diseragamkan, jadi „Ich heiße“ = "ich heisse".
// Sapaan pembuka („Hallo, …“, „Entschuldigung, …“) selalu boleh mendahului jawaban,
// kecuali pola diawali ^.

const SLOT = "[a-z0-9]+(?: [a-z0-9]+){0,3}";
const LEAD = "(?:(?:hallo|hi|hey|guten morgen|guten tag|guten abend|oh|ah|ach|also|hm|entschuldigung) )*";

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Normalisasi: huruf kecil, ß→ss, umlaut→vokal dasar, tanpa tanda baca. */
export function norm(s: string): string {
  return fold(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dua bacaan: apa adanya, dan dengan ae/oe/ue dibaca sebagai umlaut (moechte = möchte). */
function variants(raw: string): string[] {
  const a = norm(raw);
  const b = a.replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
  return a === b ? [a] : [a, b];
}

export function fill(text: string, name: string): string {
  return text.replace(/\{name\}/g, name);
}

const cache = new Map<string, RegExp>();

export function compile(pattern: string, name: string): RegExp {
  const key = `${name}\u0000${pattern}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const anchored = pattern.startsWith("^");
  const body = fold(anchored ? pattern.slice(1) : pattern)
    .replace(/\{name\}/g, (norm(name) || "\u0000").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .replace(/~/g, SLOT);
  const re = new RegExp(`^${anchored ? "" : LEAD}(?:${body})$`);
  cache.set(key, re);
  return re;
}

export function matches(raw: string, patterns: string[], name: string): boolean {
  const vs = variants(raw);
  return patterns.some((p) => {
    const re = compile(p, name);
    return vs.some((v) => re.test(v));
  });
}

export function findRule(rules: Rule[], raw: string, name: string): Rule | null {
  if (!norm(raw)) return null;
  return rules.find((r) => matches(raw, r.when, name)) ?? null;
}

function lev(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Umpan balik spesifik untuk jawaban yang hampir benar: salah urutan atau salah eja.
 * Mengembalikan null bila jawabannya memang jauh dari contoh.
 */
export function diagnose(raw: string, model: string, name: string): string | null {
  const a = norm(raw);
  const m = norm(fill(model, name));
  if (!a || a === m) return null;
  const at = a.split(" ");
  const mt = m.split(" ");
  if (at.length === mt.length && at.length > 1 && [...at].sort().join(" ") === [...mt].sort().join(" ")) {
    return "Semua katanya sudah tepat — tinggal urutannya. Coba susun ulang.";
  }
  const limit = m.length >= 14 ? 2 : m.length >= 6 ? 1 : 0;
  if (limit && lev(a, m) <= limit) {
    const odd = at.find((w) => !mt.includes(w));
    return odd ? `Hampir tepat! Periksa lagi ejaan „${odd}“.` : "Hampir tepat! Masih ada satu kata yang kurang.";
  }
  return null;
}
