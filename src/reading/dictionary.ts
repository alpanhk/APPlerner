// Kamus kecil lokal untuk reader F4: lookup kata/lema + simpan kata baru ke SRS.
import getDb from "../stores/db";
import { ensureCards } from "../srs/cards";

export type DictEntry = {
  id: number;
  de: string;
  article: string | null;
  meaning_id: string;
  kind: string;
};

export type DictLookup = { entry: DictEntry; matchedForm: string };

export type Token = { text: string; word: boolean };

const WORD_RE = /[A-Za-zÀ-ÿ]+(?:-[A-Za-zÀ-ÿ]+)*/g;

function foldUmlauts(s: string): string {
  return s
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

export function tokenizeSentence(de: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of de.matchAll(WORD_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: de.slice(last, idx), word: false });
    out.push({ text: m[0], word: true });
    last = idx + m[0].length;
  }
  if (last < de.length) out.push({ text: de.slice(last), word: false });
  return out;
}

export async function loadDictionary(): Promise<Map<string, DictEntry>> {
  const db = await getDb();
  const rows = await db.select<DictEntry[]>(
    "SELECT id, de, article, meaning_id, kind FROM entries ORDER BY id",
  );
  const map = new Map<string, DictEntry>();
  for (const row of rows) {
    const key = row.de.toLowerCase();
    map.set(key, row);
    // Indeks bentuk tanpa umlaut: Männer → mann, Städte → stadt.
    map.set(foldUmlauts(key), row);
  }
  return map;
}

// Bentuk infleksi umum Jerman → lema yang ada di kamus.
function lemmaCandidates(token: string): string[] {
  const t = token.toLowerCase();
  const out: string[] = [];
  if (t.endsWith("innen")) out.push(t.slice(0, -3));
  if (t.endsWith("en")) out.push(t.slice(0, -2));
  if (t.endsWith("er")) out.push(t.slice(0, -2));
  if (t.endsWith("n")) out.push(t.slice(0, -1));
  if (t.endsWith("e")) {
    out.push(t.slice(0, -1));
    out.push(t + "n"); // wohne → wohnen, komme → kommen
  }
  if (t.endsWith("st")) out.push(t.slice(0, -2) + "en");
  if (t.endsWith("t")) out.push(t.slice(0, -1) + "en");
  if (t.endsWith("s")) out.push(t.slice(0, -1));
  return [...new Set(out)].filter((c) => c.length >= 3);
}

export function findEntry(
  dict: Map<string, DictEntry>,
  token: string,
): DictLookup | null {
  const lower = token.toLowerCase();
  const exact = dict.get(lower) ?? dict.get(foldUmlauts(lower));
  if (exact) return { entry: exact, matchedForm: token };
  const irregular: Record<string, string> = {
    bin: "sein", bist: "sein", ist: "sein", sind: "sein", seid: "sein",
    habe: "haben", hast: "haben", hat: "haben", haben: "haben", habt: "haben",
  };
  const auxiliary = irregular[lower] ? dict.get(irregular[lower]) : undefined;
  if (auxiliary) return { entry: auxiliary, matchedForm: token };
  for (const lemma of lemmaCandidates(token)) {
    const hit = dict.get(lemma) ?? dict.get(foldUmlauts(lemma));
    if (hit) return { entry: hit, matchedForm: token };
  }
  return null;
}

export function displayWord(entry: DictEntry): string {
  return entry.article ? `${entry.article} ${entry.de}` : entry.de;
}

// Simpan kata pembaca ke SRS: entri yang sudah ada dipastikan punya 4 kartu;
// kata baru tanpa arti ditolak (PRD F4: kata tak dikenal didefinisikan manual).
export async function saveWordToSrs(
  token: string,
  meaningInput?: string,
): Promise<{ created: boolean; entry: DictEntry }> {
  const db = await getDb();
  const clean = token.trim();
  if (!clean) throw new Error("Kata kosong.");

  const found = await db.select<DictEntry[]>(
    "SELECT id, de, article, meaning_id, kind FROM entries WHERE lower(de) = lower($1) LIMIT 1",
    [clean],
  );
  if (found.length > 0) {
    await ensureCards(db);
    return { created: false, entry: found[0] };
  }

  const meaning = (meaningInput ?? "").trim();
  if (!meaning) throw new Error("Isi arti kata dulu sebelum menyimpan.");

  await db.execute(
    "INSERT INTO entries (kind, de, article, plural, forms_json, meaning_id, example_de, example_id, tags, audio_ok) " +
      "VALUES ('word',$1,NULL,NULL,NULL,$2,NULL,NULL,'reader',0)",
    [clean, meaning],
  );
  const rows = await db.select<DictEntry[]>(
    "SELECT id, de, article, meaning_id, kind FROM entries WHERE lower(de) = lower($1) LIMIT 1",
    [clean],
  );
  if (!rows.length) throw new Error("Gagal menyimpan kata.");
  await ensureCards(db);
  return { created: true, entry: rows[0] };
}
