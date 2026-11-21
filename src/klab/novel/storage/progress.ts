// CLONE PERSIS / Task 2 — ProgressStore referensi di atas SQLite produksi.
// Antarmuka sinkron dipertahankan apa adanya untuk komponen referensi; tulisan
// diteruskan ke persister async yang memakai `novelStore` (tabel config SQLite).
// Tidak ada reset, tidak ada localStore, tidak ada field yang dibuang.
import { novelStore as sqliteStore } from "../../../app/novelProgress";
import type {
  Progress, Settings, PlayerProfile,
} from "../types";

export const PROGRESS_KEY = "lernen.progress.v1";
export const SETTINGS_KEY = "lernen.settings.v1";
export const PROGRESS_VERSION = 1;

/** Kontrak referensi (sinkron di sisi komponen). */
export interface ProgressStore {
  loadProgress(): Progress | null;
  saveProgress(p: Progress): void;
  clearProgress(): void;
  loadSettings(): Settings;
  saveSettings(s: Settings): void;
}

export const DEFAULT_SETTINGS: Settings = {
  textSize: "normal",
  // Mandat clone persis: default MATI (referensi memakai true).
  soundOn: false,
  volDialog: 1, volMusic: 0.5, volAmbience: 0.6, volSfx: 0.8,
  reducedMotion: false,
};

export const DEFAULT_PLAYER: PlayerProfile = {
  name: "", hair: "short", hairColor: "#2f2520", outfit: "#2c3e6b", skin: "#e6b48f",
};

/** Penulisan nyata ke SQLite; bisa diganti stub di tes. */
export type NovelPersister = {
  saveProgress: (progress: Progress) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  clearProgress?: () => Promise<void>;
};

const sqlitePersister: NovelPersister = {
  async saveProgress(progress) {
    await sqliteStore.saveProgress({
      version: progress.version,
      player: progress.player,
      nodeId: progress.nodeId,
      stage: progress.stage,
      flags: progress.flags,
      hintCounts: progress.hintCounts,
      attempts: progress.attempts,
      history: progress.history,
      prologCompleted: progress.prologCompleted,
      updatedAt: progress.updatedAt,
      // PILOT-AGENT-1: draf + rekaman + status misi ikut dipulihkan (U07/U09).
      ...(progress.draft !== undefined ? { draft: progress.draft } : {}),
      ...(progress.recordings ? { recordings: progress.recordings } : {}),
      ...(progress.missionCompleted ? { missionCompleted: progress.missionCompleted } : {}),
    });
  },
  async saveSettings(settings) {
    await sqliteStore.saveSettings(settings);
  },
  async clearProgress() {
    await sqliteStore.clearProgress();
  },
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * State awal deterministik dari seed yang dibaca async saat bootstrap, lalu
 * dipakai komponen secara sinkron. Semua field Progress dipertahankan utuh.
 */
export function createNovelLocalStore(
  seed: { progress: Progress | null; settings: Settings },
  persister: NovelPersister = sqlitePersister,
): ProgressStore {
  let current: Progress | null = seed.progress ? clone(seed.progress) : null;
  let settings: Settings = clone(seed.settings ?? DEFAULT_SETTINGS);
  let disposed = false;

  const persist = (task: Promise<void> | undefined, label: string) => {
    if (!task) return;
    void task.catch((error: unknown) => {
      if (!disposed) console.warn(`novelStore: gagal ${label}:`, error);
    });
  };

  return {
    loadProgress() {
      return current ? clone(current) : null;
    },
    saveProgress(progress) {
      // Simpan dulu di memori (sinkron, deep-equal saat dibaca kembali),
      // baru tulis ke SQLite tanpa menghalangi render.
      current = clone(progress);
      persist(persister.saveProgress(clone(progress)), "menyimpan progres");
    },
    clearProgress() {
      current = null;
      persist(persister.clearProgress?.(), "menghapus progres");
    },
    loadSettings() {
      return clone(settings);
    },
    saveSettings(next) {
      settings = clone(next);
      persist(persister.saveSettings(clone(next)), "menyimpan pengaturan");
    },
  };
}

/** Seed async dari SQLite produksi untuk dipakai Task 4 saat bootstrap. */
export async function readNovelSeed(): Promise<{ progress: Progress | null; settings: Settings }> {
  const [progress, settings] = await Promise.all([
    sqliteStore.loadProgress(),
    sqliteStore.loadSettings(),
  ]);
  return {
    progress: progress ? ({
      version: progress.version,
      player: progress.player,
      nodeId: progress.nodeId,
      stage: progress.stage,
      flags: progress.flags,
      hintCounts: progress.hintCounts,
      attempts: progress.attempts,
      history: progress.history,
      prologCompleted: progress.prologCompleted,
      updatedAt: progress.updatedAt,
      draft: progress.draft,
      recordings: progress.recordings,
      missionCompleted: progress.missionCompleted,
    } as Progress) : null,
    settings: settings as Settings,
  };
}

/**
 * Seed slot misi "Peron berubah" (config novel.mission.v1) — terpisah dari
 * progres cerita; memilih latihan tidak menandai Bab 01-10 selesai.
 */
export async function readNovelMissionSeed(): Promise<Progress | null> {
  const mission = await sqliteStore.loadMission();
  if (!mission) return null;
  return {
    version: mission.version,
    player: mission.player,
    nodeId: mission.nodeId,
    stage: mission.stage,
    flags: mission.flags,
    hintCounts: mission.hintCounts,
    attempts: mission.attempts,
    history: mission.history,
    prologCompleted: mission.prologCompleted,
    updatedAt: mission.updatedAt,
    draft: mission.draft,
    recordings: mission.recordings,
    missionCompleted: mission.missionCompleted,
  } as Progress;
}

/** Penulisan slot misi (idempoten; bisa diganti stub di tes). */
export async function writeNovelMission(progress: Progress): Promise<void> {
  await sqliteStore.saveMission({
    version: progress.version,
    player: progress.player,
    nodeId: progress.nodeId,
    stage: progress.stage,
    flags: progress.flags,
    hintCounts: progress.hintCounts,
    attempts: progress.attempts,
    history: progress.history,
    prologCompleted: progress.prologCompleted,
    updatedAt: progress.updatedAt,
    ...(progress.draft !== undefined ? { draft: progress.draft } : {}),
    ...(progress.recordings ? { recordings: progress.recordings } : {}),
    ...(progress.missionCompleted ? { missionCompleted: progress.missionCompleted } : {}),
  });
}
