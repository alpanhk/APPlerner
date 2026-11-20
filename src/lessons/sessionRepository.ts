// Kontrak persistensi sesi kecil untuk checkpoint/latihan.
// - Satu writer per key (antrean serial), revision optimistis.
// - Payload disimpan di lesson_drafts; backup/restore sudah mencakup tabel itu.
// - Session ID mencegah writer sesi lama menimpa sesi baru.
import getDb, { nowIso } from "../stores/db";

export type SessionError = {
  code: "conflict" | "storage";
  message: string;
};

export type SessionEnvelope<T> = {
  version: 1;
  key: string;
  sessionId: string;
  revision: number;
  updatedAt: string;
  data: T;
};

export type SessionWrite<T> =
  | { ok: true; envelope: SessionEnvelope<T> }
  | { ok: false; error: SessionError };

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

async function readRaw<T>(key: string): Promise<SessionEnvelope<T> | null> {
  const db = await getDb();
  const rows = await db.select<{ payload: string }[]>("SELECT payload FROM lesson_drafts WHERE key = $1", [key]);
  if (!rows.length) return null;
  try {
    const value = JSON.parse(rows[0].payload) as SessionEnvelope<T>;
    if (!value || value.version !== 1 || value.key !== key || typeof value.sessionId !== "string" ||
      !Number.isInteger(value.revision) || value.revision < 0) return null;
    return value;
  } catch {
    return null;
  }
}

export async function loadSession<T>(key: string): Promise<SessionEnvelope<T> | null> {
  const result = await loadSessionChecked<T>(key, (data) => data as T);
  return result.envelope;
}

export type SessionLoad<T> = {
  envelope: SessionEnvelope<T> | null;
  invalid: boolean;
  raw: string | null;
};

// Baca envelope lalu validasi data di batas baca. Payload mentah dikembalikan
// agar pemanggil dapat menyalinnya ke key pemulihan sebelum menimpa sesi.
export function loadSessionChecked<T>(
  key: string,
  validate: (data: unknown) => T | null,
): Promise<SessionLoad<T>> {
  return enqueue(key, async () => {
    const db = await getDb();
    const rows = await db.select<{ payload: string }[]>("SELECT payload FROM lesson_drafts WHERE key = $1", [key]);
    if (!rows.length) return { envelope: null, invalid: false, raw: null };
    const raw = rows[0].payload;
    try {
      const value = JSON.parse(raw) as SessionEnvelope<unknown>;
      if (!value || value.version !== 1 || value.key !== key || typeof value.sessionId !== "string" ||
        !Number.isInteger(value.revision) || value.revision < 0) {
        return { envelope: null, invalid: true, raw };
      }
      const data = validate(value.data);
      if (data === null) return { envelope: null, invalid: true, raw };
      return { envelope: { ...value, data }, invalid: false, raw };
    } catch {
      return { envelope: null, invalid: true, raw };
    }
  });
}

export function writeSession<T>(
  key: string,
  sessionId: string,
  expectedRevision: number,
  data: T,
): Promise<SessionWrite<T>> {
  return enqueue(key, async () => {
    const current = await readRaw<T>(key);
    if (current && current.sessionId !== sessionId) {
      return { ok: false, error: { code: "conflict", message: "Sesi sudah diganti; hasil sesi lama tidak ditulis." } };
    }
    const revision = current?.revision ?? 0;
    if (revision !== expectedRevision) {
      return {
        ok: false,
        error: {
          code: "conflict",
          message: `Revisi sesi berubah (${revision} != ${expectedRevision}); muat ulang state terbaru.`,
        },
      };
    }
    const envelope: SessionEnvelope<T> = {
      version: 1,
      key,
      sessionId,
      revision: revision + 1,
      updatedAt: nowIso(),
      data,
    };
    try {
      const db = await getDb();
      await db.execute(
        "INSERT INTO lesson_drafts (key,payload,updated_at) VALUES ($1,$2,$3) " +
          "ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
        [key, JSON.stringify(envelope), envelope.updatedAt],
      );
      return { ok: true, envelope };
    } catch (e) {
      return { ok: false, error: { code: "storage", message: String(e) } };
    }
  });
}

export type DeleteSessionResult = {
  deleted: boolean;
  sourceChanged: boolean;
  error: string | null;
};

// Versi aman untuk jalur pemulihan: hapus hanya bila payload masih sama dengan
// salinan yang dibaca. Writer lain yang menulis lebih baru tidak boleh hilang
// hanya karena pemulihan lama sedang berjalan.
export function deleteSessionIfUnchanged(key: string, expectedRaw: string): Promise<DeleteSessionResult> {
  return enqueue(key, async () => {
    const db = await getDb();
    const rows = await db.select<{ payload: string }[]>("SELECT payload FROM lesson_drafts WHERE key = $1", [key]);
    const current = rows.length ? rows[0].payload : null;
    if (current === null || current !== expectedRaw) {
      return { deleted: false, sourceChanged: true, error: null };
    }
    try {
      await db.execute("DELETE FROM lesson_drafts WHERE key = $1 AND payload = $2", [key, expectedRaw]);
      return { deleted: true, sourceChanged: false, error: null };
    } catch (e) {
      return { deleted: false, sourceChanged: false, error: String(e) };
    }
  });
}

// Dipakai hanya untuk reset eksplisit (percobaan baru) yang memang ingin
// membuang sesi lama apa pun isinya.
export function deleteSession(key: string): Promise<void> {
  return enqueue(key, async () => {
    const db = await getDb();
    await db.execute("DELETE FROM lesson_drafts WHERE key = $1", [key]);
  });
}
