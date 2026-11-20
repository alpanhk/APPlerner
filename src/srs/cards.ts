// Kartu: backfill 4 tipe kartu per entri (idempotent) + inspeksi deck.
import getDb, { type Database } from "../stores/db";

export const CARD_TYPES = ["recog", "produce", "listen", "cloze"] as const;

const DEFAULT_DECK = "A1 · Unit 1 — Salam & perkenalan";

// ID deck default; dibuat bila belum ada. topic='' (bukan NULL) agar
// UNIQUE(name, level, topic) benar-benar berlaku di SQLite.
export async function defaultDeckId(dbIn?: Database): Promise<number> {
  const db = dbIn ?? (await getDb());
  const found = await db.select<{ id: number }[]>(
    "SELECT id FROM decks WHERE name = $1 ORDER BY id LIMIT 1",
    [DEFAULT_DECK],
  );
  if (found.length) return found[0].id;
  await db.execute(
    "INSERT OR IGNORE INTO decks (name, level, topic, kind) VALUES ($1,'A1','','vocab')",
    [DEFAULT_DECK],
  );
  const again = await db.select<{ id: number }[]>(
    "SELECT id FROM decks WHERE name = $1 ORDER BY id LIMIT 1",
    [DEFAULT_DECK],
  );
  return again[0].id;
}

// Setiap entri dijamin punya 4 kartu di deck default (UNIQUE idempotent).
export async function ensureCards(dbIn?: Database): Promise<void> {
  const db = dbIn ?? (await getDb());
  const deckId = await defaultDeckId(db);
  await db.execute(
    "INSERT OR IGNORE INTO cards (entry_id, type, deck_id) SELECT id, 'recog', $1 FROM entries",
    [deckId],
  );
  await db.execute(
    "INSERT OR IGNORE INTO cards (entry_id, type, deck_id) SELECT id, 'produce', $1 FROM entries",
    [deckId],
  );
  await db.execute(
    "INSERT OR IGNORE INTO cards (entry_id, type, deck_id) SELECT id, 'listen', $1 FROM entries",
    [deckId],
  );
  // Kartu cloze hanya dibuat bila entri punya contoh kalimat; entri tanpa
  // contoh (mis. dek kosakata tambahan) cukup 3 kartu.
  await db.execute(
    "INSERT OR IGNORE INTO cards (entry_id, type, deck_id) SELECT id, 'cloze', $1 FROM entries " +
      "WHERE example_de IS NOT NULL AND example_de <> ''",
    [deckId],
  );
}

// Tambah entri manual (editor padat F1) + 4 kartunya.
export type ManualEntry = {
  kind: string;
  de: string;
  article: string | null;
  plural: string | null;
  meaning_id: string;
  example_de: string | null;
  example_id: string | null;
};

export async function addManualEntry(e: ManualEntry): Promise<number> {
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO entries (kind, de, article, plural, forms_json, meaning_id, example_de, example_id, tags, audio_ok) " +
      "VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,'manual',0)",
    [e.kind, e.de, e.article, e.plural, e.meaning_id, e.example_de, e.example_id],
  );
  await ensureCards(db);
  return Number(res.lastInsertId ?? 0);
}

// Ubah entri (editor kartu F6). Kartu tidak dibuat ulang — teksnya mengikuti
// baris entries, jadi 4 kartu lama otomatis memakai isi baru.
export async function updateEntry(id: number, e: ManualEntry): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE entries SET kind=$2, de=$3, article=$4, plural=$5, meaning_id=$6, example_de=$7, example_id=$8 " +
      "WHERE id=$1",
    [id, e.kind, e.de, e.article, e.plural, e.meaning_id, e.example_de, e.example_id],
  );
  await ensureCards(db);
}

// Hapus entri + kartu + jadwal SRS-nya. Riwayat attempts dibiarkan (statistik
// historis) — baris yatim tidak dipakai lagi setelah kartunya hilang.
export async function deleteEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM srs_state WHERE card_id IN (SELECT id FROM cards WHERE entry_id = $1)",
    [id],
  );
  await db.execute("DELETE FROM cards WHERE entry_id = $1", [id]);
  await db.execute("DELETE FROM entries WHERE id = $1", [id]);
}
