// Terapkan satu review: FSRS → srs_state (upsert), attempts (insert),
// progress_daily (sinkron agregat).
import { invoke } from "@tauri-apps/api/core";
import { nextCard, cardToRow, rowToCard, type GradeKey, type SrsRow } from "./fsrs";
import getDb, { nowIso, todayLocal, localDayRange, type Database } from "../stores/db";
import type { QueueItem } from "./queue";

export async function loadSrsRow(cardId: number): Promise<SrsRow | null> {
  const db = await getDb();
  const rows = await db.select<SrsRow[]>("SELECT * FROM srs_state WHERE card_id = $1", [cardId]);
  return rows.length ? rows[0] : null;
}

export async function syncProgressDaily(db: Database): Promise<void> {
  const day = todayLocal();
  const [t0, t1] = localDayRange(day);
  const agg = await db.select<
    { cards_done: number; drills_done: number; total_ms: number | null }[]
  >(
    "SELECT " +
      "COALESCE(SUM(CASE WHEN kind='srs' THEN 1 ELSE 0 END),0) cards_done, " +
      "COALESCE(SUM(CASE WHEN kind='drill' THEN 1 ELSE 0 END),0) drills_done, " +
      "COALESCE(SUM(ms),0) total_ms " +
      "FROM attempts WHERE ts >= $1 AND ts < $2",
    [t0, t1],
  );
  const a = agg[0];
  const minutes = Math.round((a.total_ms ?? 0) / 60000);
  await db.execute(
    "INSERT INTO progress_daily (date, minutes, cards_done, drills_done, streak_count) VALUES ($1,$2,$3,$4,0) " +
      "ON CONFLICT(date) DO UPDATE SET minutes=excluded.minutes, cards_done=excluded.cards_done, drills_done=excluded.drills_done",
    [day, minutes, a.cards_done, a.drills_done],
  );
}

export type GradeOutcome = {
  interval: string;
  correct: boolean;
};

// Jadwalkan ulang kartu dengan grade Again TANPA menulis attempts
// (dipakai drill D1: salah 2× berurut → kartu masuk SRS, PRD F2).
export async function scheduleAgain(cardId: number): Promise<void> {
  const db: Database = await getDb();
  const rows = await db.select<SrsRow[]>("SELECT * FROM srs_state WHERE card_id = $1", [cardId]);
  const existing = rows.length ? rowToCard(rows[0]) : null;
  const now = new Date();
  const { next } = nextCard(existing, "again", now);
  const row = cardToRow(cardId, next, "again");
  row.last_review = now.toISOString();
  await db.execute(
    "INSERT INTO srs_state (card_id, due, stability, difficulty, reps, lapses, last_grade, state, last_review) " +
      "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) " +
      "ON CONFLICT(card_id) DO UPDATE SET due=excluded.due, stability=excluded.stability, difficulty=excluded.difficulty, " +
      "reps=excluded.reps, lapses=excluded.lapses, last_grade=excluded.last_grade, state=excluded.state, last_review=excluded.last_review",
    [row.card_id, row.due, row.stability, row.difficulty, row.reps, row.lapses, row.last_grade, row.state, row.last_review],
  );
}

export async function gradeQueueItem(
  item: QueueItem,
  gradeKey: GradeKey,
  msSpent: number,
): Promise<GradeOutcome> {
  const db: Database = await getDb();
  const now = new Date();

  const rows = await db.select<SrsRow[]>("SELECT * FROM srs_state WHERE card_id = $1", [
    item.card_id,
  ]);
  const existing = rows.length ? rowToCard(rows[0]) : null;

  const { next, correct } = nextCard(existing, gradeKey, now);
  const row = cardToRow(item.card_id, next, gradeKey);
  row.last_review = now.toISOString();

  // State and attempt are committed together on one SQLite connection.
  await invoke("save_review_atomic", {
    row, correct, ms: Math.max(0, Math.round(msSpent)), ts: nowIso(),
  });
  // Daily totals are a derived cache; a refresh failure must not replay review.
  await syncProgressDaily(db).catch((e) => console.error("refresh progress:", e));

  // Interval manusiawi untuk feedback tombol.
  const nights = (next.due.getTime() - now.getTime()) / 86_400_000;
  const interval =
    next.state === 1 || next.state === 3 ? "menit" : nights <= 1 ? "besok" : `${Math.round(nights)} hari`;
  return { interval, correct };
}
