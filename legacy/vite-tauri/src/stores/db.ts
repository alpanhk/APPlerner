import Database from "@tauri-apps/plugin-sql";

export type { Database };

// Singleton koneksi DB (plugin-sql menyimpan koneksi per URL).
let instance: Database | null = null;

export default async function getDb(): Promise<Database> {
  if (!instance) {
    instance = await Database.load("sqlite:lernen.db");
  }
  return instance;
}

// ---- Util waktu -------------------------------------------------------------
export function nowIso(): string {
  return new Date().toISOString();
}

export function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Batas lokal midnight (ISO UTC) untuk query per-hari.
export function localDayRange(day: string): [string, string] {
  const [y, m, d] = day.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1);
  return [start.toISOString(), end.toISOString()];
}
