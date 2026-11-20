// Antrian belajar harian (PRD F1): hanya kartu due ≤ sekarang yang keluar;
// kartu baru dibatasi `daily_new` (default 20) / hari dan total dibatasi
// `daily_max` (default 30).
import getDb, { todayLocal, localDayRange, type Database } from "../stores/db";
import { findTargetToken } from "./answers";
import { ensureCards } from "./cards";
import { hasBundledAudio, ttsReadyAsync } from "./tts";
import { computeStreak } from "../stats/dates";
import type { SrsRow } from "./fsrs";
import { levelFromTags } from "../data/pronunciation";
import { CHECKPOINT_LESSON_NO, LEVELS, type LevelCode } from "../lessons/units";

export type CardType = "recog" | "produce" | "listen" | "cloze";

export type Entry = {
  id: number;
  kind: string;
  de: string;
  article: string | null;
  plural: string | null;
  meaning_id: string;
  example_de: string | null;
  example_id: string | null;
  tags?: string | null;
};

export type QueueItem = {
  card_id: number;
  type: CardType;
  entry: Entry;
};

export type DailyQueue = {
  items: QueueItem[];
  dueCount: number;
  newCount: number;
  minutesToday: number;
  streak: number;
  dailyMax: number;
  dailyNew: number;
  ttsReady: boolean;
};

const DEFAULT_MAX = 30;
const DEFAULT_NEW = 20;

async function readConfig(db: Database, key: string, fallback: number): Promise<number> {
  const rows = await db.select<{ value: string | null }[]>(
    "SELECT value FROM config WHERE key = $1",
    [key],
  );
  const v = rows.length ? Number(rows[0].value) : NaN;
  return Number.isFinite(v) && v >= 0 && (key === "daily_new" || v > 0) ? v : fallback;
}

// Streak dihitung dari attempts (sumber kebenaran): jumlah hari berurutan
// hingga hari ini yang punya minimal satu attempt.
async function computeStreakFromDb(db: Database): Promise<number> {
  const rows = await db.select<{ ts: string }[]>(
    "SELECT ts FROM attempts UNION ALL SELECT ts FROM reading_log WHERE words_saved = 0 UNION ALL SELECT finished_at AS ts FROM lesson_progress WHERE finished_at IS NOT NULL UNION ALL SELECT substr(key,10) AS ts FROM config WHERE key LIKE 'study_ms:%' AND CAST(value AS INTEGER)>0",
  );
  const days = new Set(
    rows.map((r) => {
      const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(r.ts) ? `${r.ts}T12:00:00` : r.ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }),
  );
  return computeStreak(days).current;
}

export async function buildDailyQueue(): Promise<DailyQueue> {
  const db = await getDb();
  await ensureCards(db);
  const dailyMax = await readConfig(db, "daily_max", DEFAULT_MAX);
  const dailyNew = await readConfig(db, "daily_new", DEFAULT_NEW);
  const levelRows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", ["srs_new_level"]);
  const allowedLevels = ["A1", "A2", "B1", "B2", "all"];
  const newLevel = allowedLevels.includes(levelRows[0]?.value) ? levelRows[0].value : "A1";
  const checkpoints = await db.select<{ unit_no: number; state: string; score: number | null }[]>(
    "SELECT unit_no,state,score FROM lesson_progress WHERE lesson_no = $1", [CHECKPOINT_LESSON_NO],
  );
  const openedUnits = new Set<number>();
  if (newLevel !== "all") {
    const units = LEVELS[newLevel as LevelCode].units;
    for (let i = 0; i < units.length; i++) {
      const preceding = i > 0 ? units[i - 1] : null;
      if (preceding && !checkpoints.some(row => row.unit_no === preceding.unit && row.state === "done" && (row.score ?? 0) >= (preceding.checkpoint?.pass ?? 70))) break;
      openedUnits.add(units[i].unit % 100);
    }
  }

  const [t0, t1] = localDayRange(todayLocal());

  // Kuota harian nyata (attempts = sumber kebenaran): kartu unik yang sudah
  // direview hari ini, dan kartu yang pertama kali diperkenalkan hari ini.
  const doneToday =
    (
      await db.select<{ n: number }[]>(
        "SELECT COUNT(DISTINCT item_id) n FROM attempts WHERE kind='srs' AND ts >= $1 AND ts < $2",
        [t0, t1],
      )
    )[0]?.n ?? 0;
  const newToday =
    (
      await db.select<{ n: number }[]>(
        "SELECT COUNT(*) n FROM (SELECT item_id, MIN(ts) first_ts FROM attempts " +
          "WHERE kind='srs' GROUP BY item_id) WHERE first_ts >= $1 AND first_ts < $2",
        [t0, t1],
      )
    )[0]?.n ?? 0;

  const remainingMax = Math.max(0, dailyMax - doneToday);
  const remainingNew = Math.min(Math.max(0, dailyNew - newToday), remainingMax);

  // Tanpa Piper, hanya kartu yang memiliki klip statis yang bisa didengar.
  // Jangan masukkan kartu listen lain ke antrian agar sesi tidak menebak.
  const ttsReady = await ttsReadyAsync();

  const entries = await db.select<Entry[]>(
    "SELECT id, kind, de, article, plural, meaning_id, example_de, example_id, tags FROM entries",
  );
  const byId = new Map(entries.map((e) => [e.id, e]));

  const cards = await db.select<{ id: number; entry_id: number; type: CardType }[]>(
    "SELECT id, entry_id, type FROM cards",
  );
  const states = await db.select<SrsRow[]>("SELECT * FROM srs_state");
  const stateByCard = new Map(states.map((s) => [s.card_id, s]));

  const dueItems: { item: QueueItem; due: number }[] = [];
  const newItems: QueueItem[] = [];
  for (const c of cards) {
    const entry = byId.get(c.entry_id);
    if (!entry) continue;
    if (c.type === "cloze" && (!entry.example_de || !findTargetToken(entry.example_de, entry.de))) continue;
    if (c.type === "listen" && !ttsReady && !hasBundledAudio(entry.de)) continue;
    const st = stateByCard.get(c.id);
    const item: QueueItem = { card_id: c.id, type: c.type, entry };
    if (st) {
      dueItems.push({ item, due: new Date(st.due).getTime() });
    } else {
      const level = levelFromTags(entry.tags);
      // Manual/imported entries remain eligible. The filter affects only new
      // cards; previously studied cards must still be reviewed on schedule.
      const unit = /(?:^|,)unit(\d+)(?:,|$)/i.exec(entry.tags ?? "");
      const levelAllowed = newLevel === "all" || !["A1", "A2", "B1", "B2"].includes(level) || level === newLevel;
      const unitAllowed = newLevel === "all" || !unit || !["A1", "A2", "B1", "B2"].includes(level) || openedUnits.has(Number(unit[1]));
      if (levelAllowed && unitAllowed) newItems.push(item);
    }
  }

  // Hanya kartu yang benar-benar jatuh tempo (due <= sekarang) yang keluar.
  const nowT = Date.now();
  const dueDue = dueItems.filter((x) => x.due <= nowT).sort((a, b) => a.due - b.due);

  // Kartu jatuh tempo yang paling lama didahulukan; kartu baru hanya mengisi
  // sisa kuota, sehingga pengguna dapat mengejar tunggakan review.
  const newCap = remainingNew;
  const dueTaken = dueDue.slice(0, remainingMax);
  const queue: QueueItem[] = dueTaken.map((x) => x.item);
  // Selang-seling jenis agar kartu produksi tidak tertunda oleh urutan ID.
  const types: CardType[] = ["recog", "produce", "listen", "cloze"];
  const groups = types.map(type => newItems.filter(item => item.type === type).sort((a, b) => a.entry.id - b.entry.id));
  const interleaved: QueueItem[] = [];
  while (groups.some(group => group.length)) {
    for (const group of groups) {
      if (!group.length) continue;
      const lastEntry = interleaved[interleaved.length - 1]?.entry.id;
      const different = group.findIndex(item => item.entry.id !== lastEntry);
      const [next] = group.splice(different >= 0 ? different : 0, 1);
      interleaved.push(next);
    }
  }
  queue.push(...interleaved.slice(0, Math.min(newCap, remainingMax - queue.length)));

  const ms = await db.select<{ total: number | null }[]>(
    "SELECT COALESCE(SUM(ms),0) total FROM attempts WHERE ts >= $1 AND ts < $2",
    [t0, t1],
  );
  const clock = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [`study_ms:${todayLocal()}`]);
  const todayMs = clock.length && Number.isFinite(Number(clock[0].value)) ? Number(clock[0].value) : (ms[0]?.total ?? 0);

  return {
    items: queue,
    dueCount: dueDue.length,
    newCount: Math.min(newItems.length, remainingNew),
    minutesToday: Math.round(todayMs / 60000),
    streak: await computeStreakFromDb(db),
    dailyMax,
    dailyNew,
    ttsReady,
  };
}
