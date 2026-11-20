// Adapter pembaca produksi: rute membawa textId, judul dan mode tidak boleh
// di-hardcode "Im Café" saat aplikasi dibuka ulang lewat rute langsung.
import getDb from "../stores/db";
import { allReadings } from "../klab/learning/logic";

export type ReadingMeta = {
  textId: number;
  title: string;
  level: string;
  lead: string | null;
};

export type ReadingMode = "read" | "listen";

export function readingMeta(textId: number): ReadingMeta | null {
  if (!Number.isInteger(textId) || textId < 1) return null;
  const reading = allReadings().find((item) => item.textId === textId);
  if (!reading) return null;
  return {
    textId,
    title: reading.title,
    level: reading.level,
    lead: reading.sentences[0]?.de ?? null,
  };
}

const MODE_KEY = "klab_reading_mode_v1";

export async function saveReadingMode(mode: ReadingMode): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [MODE_KEY, JSON.stringify(mode)],
    );
  } catch { /* mode hanya preferensi masuk, tidak boleh menghalangi bacaan */ }
}

export async function loadReadingMode(): Promise<ReadingMode | null> {
  try {
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [MODE_KEY]);
    if (!rows.length) return null;
    const value = JSON.parse(rows[0].value) as unknown;
    return value === "read" || value === "listen" ? value : null;
  } catch { return null; }
}
