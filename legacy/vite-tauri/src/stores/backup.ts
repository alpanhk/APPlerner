// Backup & restore JSON (F6) — semua tabel disalin apa adanya ke satu file,
// ditulis/dibaca lewat perintah Rust (folder "Dokumen\Lernen Backups").
import { invoke } from "@tauri-apps/api/core";
import getDb, { nowIso } from "./db";

export type BackupEntry = { name: string; path: string; size: number; modified_ms: number };
export type BackupCounts = Record<string, number>;

export type BackupFile = {
  format: string;
  version: number;
  exported_at: string;
  app: string;
  tables: Record<string, Record<string, unknown>[]>;
};

export type BackupSummary = {
  name: string;
  exportedAt: string;
  counts: BackupCounts;
  total: number;
};

export type RestoreReport = {
  restored: number;
  preBackup: string;
  counts: BackupCounts;
};

export type BackupKind = "auto" | "manual" | "pre-restore";

const FORMAT = "lernen-backup";
const VERSION = 1;
const AUTO_KEY = "backup_last_auto";
const DIR_KEY = "backup_dir";
const AUTO_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

// Urutan induk → anak (penting saat restore: hapus anak dulu, isi induk dulu).
const TABLES = [
  "decks",
  "entries",
  "cards",
  "srs_state",
  "attempts",
  "drills",
  "lesson_progress",
  "texts",
  "reading_log",
  "progress_daily",
  "saved_from_chat",
  "config",
  "lesson_drafts",
] as const;

const OPTIONAL_TABLES = new Set<string>(["lesson_drafts"]);


function stamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}-${String(date.getMilliseconds()).padStart(3, "0")}`
  );
}

function fileName(kind: BackupKind): string {
  return `lernen-backup-${stamp()}-${kind}.json`;
}

// ---- Folder backup: default aplikasi atau pilihan pengguna -----------------
export async function readBackupDir(): Promise<string | null> {
  try {
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>(
      "SELECT value FROM config WHERE key = $1",
      [DIR_KEY],
    );
    const dir = rows.length && rows[0].value ? rows[0].value : null;
    if (dir) localStorage.setItem("lernen_backup_dir", dir);
    else localStorage.removeItem("lernen_backup_dir");
    return dir;
  } catch {
    // Path is also stored outside SQLite, so the backup folder remains accessible
    // when the database cannot be opened. Older installs fall back to default.
    return localStorage.getItem("lernen_backup_dir");
  }
}

export async function saveBackupDir(dir: string | null): Promise<void> {
  const db = await getDb();
  if (dir && dir.trim()) {
    await db.execute(
      "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [DIR_KEY, dir.trim()],
    );
  } else {
    await db.execute("DELETE FROM config WHERE key = $1", [DIR_KEY]);
  }
  if (dir?.trim()) localStorage.setItem("lernen_backup_dir", dir.trim());
  else localStorage.removeItem("lernen_backup_dir");
}

// ---- Export ---------------------------------------------------------------
export async function exportBackup(
  kind: BackupKind = "manual",
): Promise<{ entry: BackupEntry; total: number; counts: BackupCounts }> {
  const dir = await readBackupDir();
  // Snapshot seluruh tabel dibaca Rust dalam satu transaksi, bukan SELECT
  // terpisah yang bisa mencampur state sebelum/sesudah jawaban.
  const tables = await invoke<Record<string, Record<string, unknown>[]>>("backup_export_snapshot");
  const counts: BackupCounts = {};
  let total = 0;
  for (const table of TABLES) {
    const rows = tables[table] ?? [];
    counts[table] = rows.length;
    total += rows.length;
  }

  const payload: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exported_at: nowIso(),
    app: "Lernen 0.1.0",
    tables,
  };
  const entry = await invoke<BackupEntry>("backup_write", {
    name: fileName(kind),
    content: JSON.stringify(payload, null, 2),
    dir,
  });
  return { entry, total, counts };
}

export async function listBackups(): Promise<BackupEntry[]> {
  const dir = await readBackupDir();
  return invoke<BackupEntry[]>("backup_list", { dir });
}

export async function backupFolder(): Promise<string> {
  const dir = await readBackupDir();
  return invoke<string>("backup_dir_path", { dir });
}

export async function openBackupFolder(): Promise<string> {
  const dir = await readBackupDir();
  return invoke<string>("backup_open_folder", { dir });
}

// ---- Baca + verifikasi -----------------------------------------------------
export function summarize(data: unknown, name = "?"): BackupSummary {
  if (!data || typeof data !== "object") throw new Error("File bukan backup JSON yang sah.");
  const file = data as Partial<BackupFile>;
  if (file.format !== FORMAT) throw new Error("Format file tidak dikenali (bukan backup Lernen).");
  if (typeof file.version !== "number" || file.version > VERSION) {
    throw new Error(`Versi backup ${file.version} tidak didukung aplikasi ini.`);
  }
  if (!file.tables || typeof file.tables !== "object") throw new Error("Backup tanpa data tabel.");

  const counts: BackupCounts = {};
  let total = 0;
  for (const table of TABLES) {
    const rows = file.tables[table];
    if (!Array.isArray(rows)) {
      if (OPTIONAL_TABLES.has(table)) {
        counts[table] = 0;
        continue;
      }
      throw new Error(`Tabel "${table}" tidak ada di file backup — file tidak lengkap.`);
    }
    counts[table] = rows.length;
    total += rows.length;
  }
  return {
    name,
    exportedAt: typeof file.exported_at === "string" ? file.exported_at : "—",
    counts,
    total,
  };
}

export async function readBackup(
  name: string,
): Promise<{ data: BackupFile; summary: BackupSummary }> {
  const dir = await readBackupDir();
  const raw = await invoke<string>("backup_read", { name, dir });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("File backup rusak (JSON tidak valid).");
  }
  const summary = summarize(parsed, name);
  return { data: parsed as BackupFile, summary };
}

// ---- Restore ---------------------------------------------------------------
// Sebelum menimpa, selalu buat backup "pre-restore" agar restore yang gagal
// masih bisa dibatalkan. Verifikasi struktural dilakukan di summarize().
export async function restoreBackup(
  name: string,
  onProgress?: (done: number, total: number) => void,
): Promise<RestoreReport> {
  const { data, summary } = await readBackup(name);
  const pre = await exportBackup("pre-restore");

  const db = await getDb();
  let done: number;
  try {
    done = await invoke<number>("backup_restore_atomic", { tables: data.tables });
  } catch (e) {
    throw new Error(`Restore dibatalkan. Backup pra-restore: ${pre.entry.name}. Detail: ${String(e)}`);
  }

  // Jangan langsung memicu auto-backup lagi setelah restore.
  await db.execute(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [AUTO_KEY, nowIso()],
  );
  if (onProgress) onProgress(done, summary.total);

  return { restored: done, preBackup: pre.entry.name, counts: summary.counts };
}

// ---- Auto backup mingguan --------------------------------------------------
export async function lastAutoBackup(): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM config WHERE key = $1",
    [AUTO_KEY],
  );
  return rows.length ? rows[0].value : null;
}

export async function maybeAutoBackup(): Promise<string | null> {
  const last = await lastAutoBackup();
  const lastMs = last ? new Date(last).getTime() : 0;
  if (lastMs && Date.now() - lastMs < AUTO_EVERY_MS) return null;

  const { entry } = await exportBackup("auto");
  const db = await getDb();
  await db.execute(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [AUTO_KEY, nowIso()],
  );
  return entry.name;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatWhen(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
