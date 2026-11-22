// Data reader F4: tipe teks, pemecahan kalimat, simpan/import ke SQLite.
import getDb, { nowIso } from "../stores/db";

export type Sentence = { de: string; id: string };

export type TextRow = {
  id: number;
  title: string;
  level: string;
  body_json: string;
  tags: string | null;
  reads: number;
  last_read: string | null;
  words_saved: number;
};

export type TextSummary = Omit<TextRow, "body_json"> & { sentences: Sentence[] };

export function parseSentences(bodyJson: string): Sentence[] {
  try {
    const raw = JSON.parse(bodyJson) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((s) => {
        if (typeof s === "string") return { de: s, id: "" };
        if (Array.isArray(s)) {
          return { de: String(s[0] ?? ""), id: String(s[1] ?? "") };
        }
        const obj = s as Partial<Sentence>;
        return { de: String(obj.de ?? ""), id: String(obj.id ?? "") };
      })
      .filter((s) => s.de.trim().length > 0);
  } catch {
    return [];
  }
}

// Pecah teks tempelan menjadi kalimat; baris tanpa tanda baca tetap satu kalimat.
export function splitSentences(body: string): string[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const clean = line.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    const parts = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [clean];
    for (const p of parts) {
      const s = p.trim();
      if (s) out.push(s);
    }
  }
  return out;
}

const BASE_SELECT =
  "SELECT t.id, t.title, t.level, t.body_json, t.tags, " +
  "(SELECT COUNT(*) FROM reading_log r WHERE r.text_id = t.id AND r.words_saved = 0) reads, " +
  "(SELECT MAX(r.ts) FROM reading_log r WHERE r.text_id = t.id AND r.words_saved = 0) last_read, " +
  "(SELECT COALESCE(SUM(r.words_saved),0) FROM reading_log r WHERE r.text_id = t.id) words_saved " +
  "FROM texts t";

const LIST_SQL = BASE_SELECT + " ORDER BY t.level, t.id";

export async function loadTexts(): Promise<TextSummary[]> {
  const db = await getDb();
  const rows = await db.select<TextRow[]>(LIST_SQL);
  return rows.map((r) => ({
    ...r,
    sentences: parseSentences(r.body_json),
  }));
}

export async function loadText(id: number): Promise<TextSummary | null> {
  const db = await getDb();
  const rows = await db.select<TextRow[]>(BASE_SELECT + " WHERE t.id = $1", [id]);
  if (!rows.length) return null;
  return { ...rows[0], sentences: parseSentences(rows[0].body_json) };
}

// Catat sesi baca (dipanggil saat teks dibuka / kata disimpan).
export async function logReading(textId: number, wordsSaved = 0): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO reading_log (text_id, ts, words_saved) VALUES ($1,$2,$3)", [
    textId,
    nowIso(),
    Math.max(0, wordsSaved),
  ]);
}

export async function importText(title: string, level: string, body: string): Promise<number> {
  const db = await getDb();
  const sentences = splitSentences(body).map((de) => ({ de, id: "" }));
  if (sentences.length === 0) throw new Error("Teks kosong.");
  const res = await db.execute(
    "INSERT INTO texts (title, level, body_json, tags) VALUES ($1,$2,$3,$4)",
    [title.trim(), level, JSON.stringify(sentences), "impor pengguna"],
  );
  return Number(res.lastInsertId ?? 0);
}
