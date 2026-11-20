// Impor daftar kata (F6): tempel CSV/JSON → validasi → entri + 4 kartu SRS.
// Format sederhana yang didukung (PRD F6): `de | meaning_id | article | plural`.
import getDb from "../stores/db";
import { addManualEntry, ensureCards, type ManualEntry } from "../srs/cards";

export type ImportIssue = { line: number; text: string; reason: string };
export type ParsedWords = { rows: ManualEntry[]; issues: ImportIssue[] };

const ARTICLES = new Set(["der", "die", "das"]);
const ARTICLE_PREFIX = /^(der|die|das)\s+/i;

type Field = keyof ManualEntry;

const HEADER_ALIAS: Record<string, Field | "skip"> = {
  de: "de",
  kata: "de",
  wort: "de",
  german: "de",
  jerman: "de",
  meaning_id: "meaning_id",
  meaning: "meaning_id",
  arti: "meaning_id",
  indonesia: "meaning_id",
  id: "meaning_id",
  article: "article",
  artikel: "article",
  plural: "plural",
  kind: "kind",
  jenis: "kind",
  example_de: "example_de",
  contoh: "example_de",
  beispiel: "example_de",
  example_id: "example_id",
  contoh_id: "example_id",
  arti_contoh: "example_id",
};

const POSITIONAL: Field[] = ["de", "meaning_id", "article", "plural", "kind", "example_de", "example_id"];

// Parser CSV mempertahankan koma, kutip ganda, dan baris baru di dalam field.
function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || cell.trim() === "") quoted = !quoted;
      else cell += ch;
    } else if (!quoted && ch === delim) { row.push(cell.trim()); cell = ""; }
    else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (quoted) throw new Error("Tanda kutip CSV tidak ditutup.");
  row.push(cell.trim()); rows.push(row); return rows;
}

function looksLikeHeader(cells: string[]): boolean {
  if (cells.length === 0) return false;
  const known = cells.filter((c) => HEADER_ALIAS[c.toLowerCase()] !== undefined);
  // Header sah bila minimal dua kolom dikenali DAN tidak berisi kalimat panjang.
  return known.length >= 2 && cells.every((c) => c.length <= 24);
}

function normalizeRow(cells: string[], mapping: (Field | "skip")[]): {
  row: ManualEntry | null;
  reason?: string;
} {
  const get = (field: Field): string => {
    const i = mapping.indexOf(field);
    return i >= 0 ? (cells[i] ?? "").trim() : "";
  };

  let de = get("de");
  let article = get("article").toLowerCase();
  const meaning = get("meaning_id");
  const plural = get("plural");
  const kindGiven = get("kind").toLowerCase();
  const exampleDe = get("example_de");
  const exampleId = get("example_id");

  if (!de && !meaning) return { row: null, reason: undefined }; // baris kosong
  if (!de) return { row: null, reason: "kolom 'de' kosong" };
  if (!meaning) return { row: null, reason: "kolom arti kosong" };

  // "die Lampe" di kolom de tanpa kolom artikel → pisahkan otomatis.
  const prefixed = de.match(ARTICLE_PREFIX);
  if (prefixed) {
    if (!article) article = prefixed[1].toLowerCase();
    de = de.replace(ARTICLE_PREFIX, "").trim();
  }
  if (article && !ARTICLES.has(article)) {
    return { row: null, reason: `artikel "${article}" tidak dikenal (pakai der/die/das)` };
  }

  const kind = article
    ? "noun"
    : kindGiven && ["noun", "verb", "adj", "other"].includes(kindGiven)
      ? kindGiven
      : "other";

  return {
    row: {
      kind,
      de,
      article: article || null,
      plural: plural || null,
      meaning_id: meaning,
      example_de: exampleDe || null,
      example_id: exampleId || null,
    },
  };
}

function parseJson(raw: string): ParsedWords {
  const issues: ImportIssue[] = [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { rows: [], issues: [{ line: 0, text: "", reason: `JSON tidak valid: ${String(e)}` }] };
  }
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { words?: unknown }).words)
      ? ((data as { words: unknown[] }).words ?? [])
      : [];
  if (list.length === 0) {
    return {
      rows: [],
      issues: [{ line: 0, text: "", reason: "JSON harus berupa array kata atau { words: [...] }" }],
    };
  }
  const rows: ManualEntry[] = [];
  list.forEach((item, i) => {
    if (!item || typeof item !== "object") {
      issues.push({ line: i + 1, text: String(item), reason: "bukan objek" });
      return;
    }
    const o = item as Record<string, unknown>;
    const cells = POSITIONAL.map((f) => String(o[f] ?? ""));
    // dukung juga `meaning` / `arti` di JSON
    if (!cells[1]) cells[1] = String(o.meaning ?? o.arti ?? "");
    const parsed = normalizeRow(cells, POSITIONAL);
    if (!parsed.row) {
      if (parsed.reason) issues.push({ line: i + 1, text: JSON.stringify(item), reason: parsed.reason });
      return;
    }
    rows.push(parsed.row);
  });
  return { rows, issues };
}

export function parseWordImport(raw: string, existingDe: Set<string>): ParsedWords {
  const text = raw.trim();
  if (!text) return { rows: [], issues: [] };
  if (text.startsWith("[") || text.startsWith("{")) return dedupe(parseJson(text), existingDe);

  const issues: ImportIssue[] = [];
  const rows: ManualEntry[] = [];
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = ["|", "\t", ";", ","].find(d => firstLine.includes(d)) ?? ",";
  let records: string[][];
  try { records = parseDelimited(text, delim); }
  catch (e) { return { rows: [], issues: [{ line: 0, text: "", reason: String(e) }] }; }
  let mapping: (Field | "skip")[] = POSITIONAL;
  let start = 0;
  if (looksLikeHeader(records[0] ?? [])) {
    mapping = records[0].map(c => HEADER_ALIAS[c.toLowerCase()] ?? "skip");
    start = 1;
  }
  for (let i = start; i < records.length; i += 1) {
    const cells = records[i];
    if (!cells.some(c => c.trim()) || cells[0]?.trim().startsWith("#")) continue;
    const parsed = normalizeRow(cells, mapping);
    if (!parsed.row) {
      if (parsed.reason) issues.push({ line: i + 1, text: cells.join(delim), reason: parsed.reason });
      continue;
    }
    rows.push(parsed.row);
  }
  return dedupe({ rows, issues }, existingDe);
}

// Buang duplikat di dalam file & yang sudah ada di database.
function dedupe(parsed: ParsedWords, existingDe: Set<string>): ParsedWords {
  const seen = new Set(existingDe);
  const rows: ManualEntry[] = [];
  const issues = [...parsed.issues];
  for (const row of parsed.rows) {
    const key = row.de.toLowerCase();
    if (seen.has(key)) {
      issues.push({
        line: 0,
        text: `${row.article ?? ""} ${row.de}`.trim(),
        reason: existingDe.has(key) ? "sudah ada di deck" : "duplikat di dalam daftar",
      });
      continue;
    }
    seen.add(key);
    rows.push(row);
  }
  return { rows, issues };
}

export async function loadExistingDe(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select<{ de: string }[]>("SELECT de FROM entries");
  return new Set(rows.map((r) => r.de.toLowerCase()));
}

export async function importWords(
  rows: ManualEntry[],
): Promise<{ inserted: number; failed: number; cards: number }> {
  const db = await getDb();
  const before = (await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM cards"))[0]?.n ?? 0;
  let inserted = 0;
  let failed = 0;
  let repaired = false;
  for (const row of rows) {
    try {
      // Impor ulang setelah kegagalan sebagian tidak boleh gagal karena UNIQUE
      // de; entri yang sudah ada cukup dipastikan punya kartu.
      const existing = await db.select<{ id: number }[]>("SELECT id FROM entries WHERE de = $1 LIMIT 1", [row.de]);
      if (existing.length > 0) {
        repaired = true;
        continue;
      }
      await addManualEntry(row);
      inserted += 1;
    } catch (e) {
      failed += 1;
      console.error("import gagal:", row.de, e);
    }
  }
  if (repaired) await ensureCards(db);
  const after = (await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM cards"))[0]?.n ?? 0;
  return { inserted, failed, cards: after - before };
}
