// DB-03: draft/posisi sesi disimpan di SQLite (bukan hanya localStorage).
// Draft lama tetap dibaca sekali lalu dimigrasikan agar pengguna tidak
// kehilangan progres setelah upgrade.
import getDb, { nowIso } from "../stores/db";

const queues = new Map<string, Promise<void>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const run = previous.catch(() => {}).then(task);
  const tail = run.then(() => {}, () => {});
  queues.set(key, tail);
  return run.finally(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
}

export async function loadDraftRaw(key: string): Promise<string | null> {
  // Tunggu penulisan terakhir untuk key ini agar pembaca tidak melihat state lama.
  await (queues.get(key) ?? Promise.resolve()).catch(() => {});
  const db = await getDb();
  const rows = await db.select<{ payload: string }[]>("SELECT payload FROM lesson_drafts WHERE key = $1", [key]);
  return rows.length ? rows[0].payload : null;
}

export async function loadDraft<T>(key: string): Promise<T | null> {
  const raw = await loadDraftRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// Hasil karantina pada batas storage. `sourceChanged` berarti payload sumber
// sudah berubah sejak pembacaan (writer lain menang); pemanggil TIDAK boleh
// menimpa sumber dan harus membaca ulang/muat ulang. `error` berarti salinan
// gagal dibuat, sehingga sumber sengaja dipertahankan.
export type QuarantineOutcome = {
  recoveryKey: string | null;
  sourceRemoved: boolean;
  sourceChanged: boolean;
  error: string | null;
};

async function readPayload(db: Awaited<ReturnType<typeof getDb>>, key: string): Promise<string | null> {
  const rows = await db.select<{ payload: string }[]>("SELECT payload FROM lesson_drafts WHERE key = $1", [key]);
  return rows.length ? rows[0].payload : null;
}

// P8: pindahkan HANYA versi payload yang dibaca pemanggil. Seluruh operasi
// berada pada antrean `key` yang sama dengan saveDraft/deleteDraft, dan
// penghapusan memakai predicate `payload = raw` sehingga writer dari modul
// lain (antrean berbeda) tidak bisa kehilangan penulisan barunya.
export function quarantineDraftChecked(key: string, raw: string): Promise<QuarantineOutcome> {
  return enqueue(key, async () => {
    const failed = (error: string | null, sourceChanged = false): QuarantineOutcome =>
      ({ recoveryKey: null, sourceRemoved: false, sourceChanged, error });
    let db: Awaited<ReturnType<typeof getDb>>;
    try { db = await getDb(); } catch (e) { return failed(String(e)); }

    let current: string | null;
    try { current = await readPayload(db, key); } catch (e) { return failed(String(e)); }
    if (current === null || current !== raw) {
      // Sumber sudah berubah atau hilang sejak pembacaan. Jangan hapus.
      return failed(null, true);
    }

    const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const target = `${key}:recovery:${stamp}:${Math.random().toString(36).slice(2, 8)}`;
    try {
      await db.execute(
        "INSERT INTO lesson_drafts (key,payload,updated_at) VALUES ($1,$2,$3)",
        [target, raw, nowIso()],
      );
    } catch (e) {
      // Salin gagal -> payload sumber dipertahankan utuh.
      return failed(String(e));
    }

    // Compare-and-delete: hapus hanya baris yang payload-nya masih sama persis
    // dengan salinan yang baru dibuat.

    try {
      await db.execute("DELETE FROM lesson_drafts WHERE key = $1 AND payload = $2", [key, raw]);
    } catch {
      return { recoveryKey: target, sourceRemoved: false, sourceChanged: false, error: null };
    }
    let after: string | null;
    try { after = await readPayload(db, key); } catch { after = raw; }
    if (after === null) return { recoveryKey: target, sourceRemoved: true, sourceChanged: false, error: null };
    // Masih ada baris:writer lain menang atau penghapusan tidak terjadi.
    return { recoveryKey: target, sourceRemoved: false, sourceChanged: true, error: null };
  });
}

// Kompatibilitas pemanggil lama: mengembalikan key pemulihan bila salinan
// berhasil dibuat, null bila gagal/sumber sudah berubah.
export async function quarantineDraft(key: string, raw: string): Promise<string | null> {
  const outcome = await quarantineDraftChecked(key, raw);
  return outcome.recoveryKey;
}

export function saveDraft(key: string, value: unknown): Promise<void> {
  return enqueue(key, async () => {
    const db = await getDb();
    await db.execute(
      "INSERT INTO lesson_drafts (key,payload,updated_at) VALUES ($1,$2,$3) " +
        "ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
      [key, JSON.stringify(value), nowIso()],
    );
  });
}

export function deleteDraft(key: string): Promise<void> {
  return enqueue(key, async () => {
    const db = await getDb();
    await db.execute("DELETE FROM lesson_drafts WHERE key = $1", [key]);
  });
}

// Baca SQLite; bila kosong, coba localStorage sekali lalu pindahkan.
export async function loadDraftWithLegacy<T>(
  key: string,
  parse: (raw: string) => T | null,
): Promise<T | null> {
  const saved = await loadDraft<T>(key);
  if (saved !== null) return saved;
  let raw: string | null = null;
  try { raw = localStorage.getItem(key); } catch { return null; }
  if (raw === null) return null;
  const legacy = parse(raw);
  if (legacy === null) return null;
  await saveDraft(key, legacy);
  try { localStorage.removeItem(key); } catch { /* storage bisa diblokir */ }
  return legacy;
}
