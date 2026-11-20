// Penyimpanan catatan nyata using config key klab_notes_v1. Writer diserialkan
// per proses; revisi diperiksa saat simpan/hapus agar effect lama tidak menimpa.
import getDb, { nowIso } from "../stores/db";
import type { Note } from "../klab/contracts";

const KEY = "klab_notes_v1";
type Store = { version: 1; notes: Note[] };

const DEFAULT_PREFERENCES_FALLBACK: Note[] = [];
let chain: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.catch(() => undefined).then(task);
  chain = run.then(() => undefined, () => undefined);
  return run;
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const note = value as Record<string, unknown>;
  return typeof note.id === "string" && Number.isInteger(note.revision) &&
    typeof note.title === "string" && typeof note.body === "string" &&
    typeof note.updatedAt === "string";
}

async function readStore(): Promise<Store> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [KEY]);
  if (!rows.length) return { version: 1, notes: DEFAULT_PREFERENCES_FALLBACK };
  try {
    const parsed = JSON.parse(rows[0].value) as Partial<Store>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.notes)) return { version: 1, notes: [] };
    return { version: 1, notes: parsed.notes.filter(isNote) };
  } catch { return { version: 1, notes: [] }; }
}

async function writeStore(store: Store): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [KEY, JSON.stringify(store)],
  );
}

export async function listNotes(): Promise<Note[]> {
  return serialize(async () => (await readStore()).notes);
}

export async function saveNote(note: Note, expectedRevision: number): Promise<Note> {
  return serialize(async () => {
    const store = await readStore();
    const index = store.notes.findIndex((item) => item.id === note.id);
    const current = index >= 0 ? store.notes[index] : null;
    if (current && current.revision !== expectedRevision) {
      throw new Error("Catatan berubah di perangkat lain; muat ulang sebelum menyimpan.");
    }
    const next: Note = { ...note, revision: (current?.revision ?? expectedRevision) + 1, updatedAt: nowIso() };
    const notes = [...store.notes];
    if (index >= 0) notes[index] = next;
    else notes.unshift(next);
    await writeStore({ version: 1, notes });
    return next;
  });
}

export async function removeNote(id: string, expectedRevision: number): Promise<void> {
  return serialize(async () => {
    const store = await readStore();
    const current = store.notes.find((item) => item.id === id);
    if (!current || current.revision !== expectedRevision) {
      throw new Error("Catatan tidak ditemukan atau sudah berubah.");
    }
    await writeStore({ version: 1, notes: store.notes.filter((item) => item.id !== id) });
  });
}
