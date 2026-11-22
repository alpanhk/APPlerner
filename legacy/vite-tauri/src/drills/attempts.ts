// Perekam jawaban drill — dipakai sesi Drill penuh maupun thumb drill pelajaran.
import { invoke } from "@tauri-apps/api/core";
import getDb, { nowIso } from "../stores/db";
import { syncProgressDaily } from "../srs/review";
import type { DrillItem } from "./items";

export type AttemptOptions = {
  sessionId?: string;
  draftKey?: string;
  draft?: unknown;
};

export type AttemptResult = { correct: boolean; reused: boolean };

async function existingCorrect(
  db: Awaited<ReturnType<typeof getDb>>,
  sessionId: string | undefined,
  itemKey: string,
): Promise<boolean | undefined> {
  if (!sessionId) return undefined;
  const rows = await db.select<{ correct: number }[]>(
    "SELECT correct FROM attempts WHERE session_id = $1 AND item_key = $2 ORDER BY id LIMIT 1",
    [sessionId, itemKey],
  );
  return rows.length > 0 ? rows[0].correct === 1 : undefined;
}

export async function recordAttempt(
  item: DrillItem,
  correct: boolean,
  ms: number,
  options: AttemptOptions = {},
): Promise<AttemptResult> {
  const db = await getDb();
  const ts = nowIso();
  const rounded = Math.max(0, Math.round(ms));
  // Baca verdict canonical sebelum menulis draft retry. Jika respons pertama
  // hilang, draft tidak boleh berisi verdict baru yang kalah INSERT OR IGNORE.
  const prior = await existingCorrect(db, options.sessionId, item.key);
  const effective = prior ?? correct;
  const draftForWrite = options.draft !== undefined && options.draft !== null && typeof options.draft === "object"
    ? { ...(options.draft as Record<string, unknown>), correct: effective }
    : options.draft;
  if (options.draftKey && draftForWrite !== undefined) {
    // Attempt + posisi/draft adalah satu transaksi Rust (DB-03).
    await invoke("save_attempt_with_draft", {
      payload: {
        ts,
        kind: "drill",
        item_id: item.entryId ?? 0,
        correct: effective,
        ms: rounded,
        drill_code: item.lessonExample || item.checkpoint || item.lessonApplication ? null : item.code,
        item_key: item.key,
        session_id: options.sessionId ?? null,
        objective_id: item.objectiveId ?? null,
        draft_key: options.draftKey,
        draft_json: JSON.stringify(draftForWrite),
        updated_at: ts,
      },
    });
  } else {
    await db.execute(
      "INSERT OR IGNORE INTO attempts (ts, kind, item_id, correct, ms, drill_code, item_key, session_id, objective_id) VALUES ($1,'drill',$2,$3,$4,$5,$6,$7,$8)",
      [
        ts,
        item.entryId ?? 0,
        effective ? 1 : 0,
        rounded,
        item.lessonExample || item.checkpoint || item.lessonApplication ? null : item.code,
        item.key,
        options.sessionId ?? null,
        item.objectiveId ?? null,
      ],
    );
  }
  const canonical = (await existingCorrect(db, options.sessionId, item.key)) ?? effective;
  // Statistik harian adalah turunan; kegagalannya tidak membatalkan jawaban.
  await syncProgressDaily(db).catch((e) => console.error("refresh progress:", e));
  return { correct: canonical, reused: prior !== undefined };
}
