// ROMBAK UI/UX / NOVEL-GAP-01 / 1a — jembatan kontrak 2a -> SQLite 1a.
// StoryFlow menerima `NovelStore` {loadProgress, saveProgress}; adapter ini
// menerjemahkannya ke novelStore (tabel config SQLite). Tidak ada localStore,
// tidak ada reset, dan stage/prologCompleted milik 1a ikut dipertahankan.
import type { NovelStore, NovelProgress as StoryProgress } from "../klab/learning/StoryFlow";
import { nodeOf } from "../klab/learning/story/engine";
import {
  novelStore, DEFAULT_NOVEL_PLAYER, DEFAULT_NOVEL_STAGE,
  type NovelProgress, type NovelSettings,
} from "./novelProgress";

const SPEECH_SRC: Record<string, string> = {
  "speech:ich-heisse-alex": "/audio/tuturan/a1-u01-srs-12-contoh.wav",
  "speech:hallo-ich-heisse-budi": "/audio/tuturan/u01-budi-perkenalan.wav",
};

/** Asset tuturan 2a → URL public yang ikut dist/EXE. Tanpa trek ganda. */
export function storyMediaSrc(assetId: string): string | undefined {
  if (!assetId) return undefined;
  return SPEECH_SRC[assetId];
}

function isEndNode(nodeId: string): boolean {
  try { return nodeOf(nodeId).kind === "end"; } catch { return false; }
}

export const storyStore: NovelStore = {
  async loadProgress() {
    const saved: NovelProgress | null = await novelStore.loadProgress();
    if (!saved) return null;
    return {
      player: saved.player,
      nodeId: saved.nodeId,
      flags: saved.flags,
      hintCounts: saved.hintCounts,
      // Kedua model punya bentuk yang sama; cast menjaga kontrak 2a tetap ketat.
      attempts: saved.attempts as StoryProgress["attempts"],
      history: saved.history as StoryProgress["history"],
      updatedAt: saved.updatedAt,
    };
  },
  async saveProgress(progress: StoryProgress) {
    const current = await novelStore.loadProgress();
    await novelStore.saveProgress({
      version: 1,
      player: { ...DEFAULT_NOVEL_PLAYER, ...progress.player },
      nodeId: progress.nodeId,
      stage: current?.stage ?? DEFAULT_NOVEL_STAGE,
      flags: progress.flags,
      hintCounts: progress.hintCounts,
      attempts: progress.attempts as NovelProgress["attempts"],
      history: progress.history as NovelProgress["history"],
      prologCompleted: isEndNode(progress.nodeId) || Boolean(current?.prologCompleted),
      updatedAt: progress.updatedAt || Date.now(),
    });
  },
  async clearProgress() {
    // Hanya dipanggil eksplisit; tidak ada otomatis saat startup.
    await novelStore.clearProgress();
  },
};

/** Preferensi StoryFlow memakai uiSettings/novelSettings yang sama. */
export async function storySettings(): Promise<NovelSettings> {
  return novelStore.loadSettings();
}
