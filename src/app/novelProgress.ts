// ROMBAK UI/UX / 1a — adapter Progress/Game referensi ke SQLite produksi.
// `localStore` referensi dipakai sebagai KONTRAK, bukan sebagai sumber data:
// semua tulisan masuk ke tabel `config` (satu DB dengan progres belajar, backup,
// dan preferensi). Tidak ada reset otomatis; posisi cerita (nodeId), flag,
// riwayat, dan preferensi dipertahankan lintas restart.
import getDb from "../stores/db";

export const NOVEL_PROGRESS_KEY = "novel.progress.v1";
export const NOVEL_SETTINGS_KEY = "novel.settings.v1";
export const NOVEL_PROGRESS_VERSION = 1;

export type NovelPlayer = {
  name: string;
  hair: "short" | "bob" | "long" | "curly";
  hairColor: string;
  outfit: string;
  skin: string;
};
export type NovelStage = {
  bg: "kamar" | "jendela" | "pintu" | "jalan" | "judul";
  chars: Array<{ id: string; side: "left" | "right" | "center"; expr?: string }>;
  overlay?: string | null;
  ambience?: "rumah" | "jalan" | "none";
};
export type NovelHistoryItem = {
  speaker: string; text: string; lang: "de" | "id"; translation?: string; audio?: string; isPlayer?: boolean;
};
export type NovelAttempt = {
  objective: string; where: string; text: string; hintsUsed: number; full: boolean; at: number;
};
export type NovelProgress = {
  version: number;
  player: NovelPlayer;
  /** Posisi belajar/cerita; jangan pernah ditulis ulang saat startup. */
  nodeId: string;
  stage: NovelStage;
  flags: Record<string, boolean>;
  hintCounts: Record<string, number>;
  attempts: NovelAttempt[];
  history: NovelHistoryItem[];
  prologCompleted: boolean;
  updatedAt: number;
};
export type NovelSettings = {
  textSize: "normal" | "besar" | "sangat-besar";
  /** Default MATI sesuai mandat, bukan nilai referensi (true). */
  soundOn: boolean;
  volDialog: number; volMusic: number; volAmbience: number; volSfx: number;
  reducedMotion: boolean;
};

export const DEFAULT_NOVEL_PLAYER: NovelPlayer = {
  name: "", hair: "short", hairColor: "#2f2520", outfit: "#2c3e6b", skin: "#e6b48f",
};
export const DEFAULT_NOVEL_STAGE: NovelStage = {
  bg: "kamar", chars: [], overlay: null, ambience: "none",
};
export const DEFAULT_NOVEL_SETTINGS: NovelSettings = {
  textSize: "normal", soundOn: false,
  volDialog: 1, volMusic: 0.5, volAmbience: 0.6, volSfx: 0.8,
  reducedMotion: false,
};

async function readConfig(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [key]);
    return rows.length ? rows[0].value : null;
  } catch {
    // Kegagalan baca bukan alasan untuk reset: kembalikan "tidak ada data".
    return null;
  }
}

async function writeConfig(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [key, JSON.stringify(value)],
  );
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function parseProgress(raw: string | null): NovelProgress | null {
  if (!raw) return null;
  try {
    const value = object(JSON.parse(raw));
    if (value.version !== NOVEL_PROGRESS_VERSION) return null;
    const player = object(value.player);
    if (typeof player.name !== "string" || !player.name) return null;
    return {
      version: NOVEL_PROGRESS_VERSION,
      player: { ...DEFAULT_NOVEL_PLAYER, ...player } as NovelPlayer,
      nodeId: typeof value.nodeId === "string" ? value.nodeId : "prolog_start",
      stage: { ...DEFAULT_NOVEL_STAGE, ...object(value.stage) } as NovelStage,
      flags: object(value.flags) as Record<string, boolean>,
      hintCounts: object(value.hintCounts) as Record<string, number>,
      attempts: Array.isArray(value.attempts) ? value.attempts as NovelAttempt[] : [],
      history: Array.isArray(value.history) ? value.history as NovelHistoryItem[] : [],
      prologCompleted: Boolean(value.prologCompleted),
      updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
    };
  } catch { return null; }
}

export const novelStore = {
  /** Posisi/cerita tersimpan dipulihkan apa adanya; never call reset di startup. */
  async loadProgress(): Promise<NovelProgress | null> {
    return parseProgress(await readConfig(NOVEL_PROGRESS_KEY));
  },
  async saveProgress(progress: NovelProgress): Promise<NovelProgress> {
    const next: NovelProgress = { ...progress, version: NOVEL_PROGRESS_VERSION, updatedAt: Date.now() };
    await writeConfig(NOVEL_PROGRESS_KEY, next);
    return next;
  },
  /** Hanya dipanggil eksplisit oleh pengguna; tidak dipanggil saat inisialisasi. */
  async clearProgress(): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM config WHERE key = $1", [NOVEL_PROGRESS_KEY]);
  },
  async loadSettings(): Promise<NovelSettings> {
    let value: Record<string, unknown> = {};
    try {
      const raw = await readConfig(NOVEL_SETTINGS_KEY);
      if (raw) value = object(JSON.parse(raw));
    } catch { /* settings rusak → default, bukan reset progres */ }
    return {
      ...DEFAULT_NOVEL_SETTINGS,
      ...value,
      textSize: ["normal", "besar", "sangat-besar"].includes(String(value.textSize))
        ? value.textSize as NovelSettings["textSize"] : "normal",
      soundOn: typeof value.soundOn === "boolean" ? value.soundOn : false,
    };
  },
  async saveSettings(settings: NovelSettings): Promise<NovelSettings> {
    const next = { ...DEFAULT_NOVEL_SETTINGS, ...settings };
    await writeConfig(NOVEL_SETTINGS_KEY, next);
    return next;
  },
};

/** Status nyata untuk tombol simpan: dipakai UI fallback dan 2a bila mau. */
export type SavePhase = "idle" | "saving" | "saved" | "failed";
