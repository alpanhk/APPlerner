// Komposisi awal: urutan init dipertahankan persis dari App.tsx lama.
// Tidak ada seed/migrasi/backup baru di sini; Rust tetap pemilik migrasi.
import getDb from "../stores/db";

export type DbState = "loading" | "ready" | "error";

// Buka DB (migrasi dijalankan Rust) + seed idempotent + integrity check sebelum
// UI menyentuh data. Fungsi seed disuntikkan composition root agar urutan tetap
// terlihat di App.tsx dan bootstrap tetap mudah diuji.
export async function initializeDatabase(openDatabase: () => Promise<string>): Promise<string> {
  const msg = await openDatabase();
  const db = await getDb();
  const check = await db.select<{ integrity_check: string }[]>("PRAGMA integrity_check");
  const verdict = check.length ? String(check[0].integrity_check) : "ok";
  if (verdict.toLowerCase() !== "ok") {
    throw new Error(`Pemeriksaan integritas SQLite: ${verdict}`);
  }
  return msg;
}
