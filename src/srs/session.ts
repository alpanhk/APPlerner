// Sesi review SRS (Zustand): antrian → kartu depan/belakang → grade → DB.
import { create } from "zustand";
import { buildDailyQueue, type CardType, type QueueItem } from "./queue";
import { gradeQueueItem, type GradeOutcome } from "./review";
import type { GradeKey } from "./fsrs";

export type Phase = "idle" | "front" | "back" | "done";

export type SessionStats = {
  total: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
  minutes: number;
  nextDuePreview: string | null;
};

type SrsSession = {
  phase: Phase;
  queue: QueueItem[];
  index: number;
  startedAt: number;
  itemStartedAt: number;
  grades: Record<GradeKey, number>;
  lastOutcome: GradeOutcome | null;
  minutes: number;

  start: () => Promise<void>;
  reveal: () => void;
  grade: (g: GradeKey, msSpent: number) => Promise<void>;
  reset: () => void;
};

let grading = false;

const EMPTY_GRADES: Record<GradeKey, number> = { again: 0, hard: 0, good: 0, easy: 0 };

export const useSrsSession = create<SrsSession>((set, get) => ({
  phase: "idle",
  queue: [],
  index: 0,
  startedAt: 0,
  itemStartedAt: 0,
  grades: { ...EMPTY_GRADES },
  lastOutcome: null,
  minutes: 0,

  async start() {
    const q = await buildDailyQueue();
    if (q.items.length === 0) {
      set({ phase: "done", queue: [], index: 0, minutes: q.minutesToday, grades: { ...EMPTY_GRADES } });
      return;
    }
    set({
      phase: "front",
      queue: q.items,
      index: 0,
      startedAt: Date.now(),
      itemStartedAt: Date.now(),
      grades: { ...EMPTY_GRADES },
      lastOutcome: null,
      minutes: 0,
    });
  },

  reveal() {
    if (get().phase === "front") set({ phase: "back" });
  },

  async grade(g, msSpent) {
    if (grading || get().phase !== "back") return;
    const { queue, index, grades, startedAt } = get();
    const item = queue[index];
    if (!item) return;
    grading = true;
    let outcome: GradeOutcome;
    try { outcome = await gradeQueueItem(item, g, msSpent); } finally { grading = false; }
    if (get().phase !== "back" || get().index !== index || get().startedAt !== startedAt) return;

    const nextGrades = { ...grades, [g]: grades[g] + 1 };
    // Kartu "Lupa" muncul kembali kosong di sesi yang sama (PRD F1).
    const requeued = g === "again" ? [...queue, item] : queue;
    const nextIndex = index + 1;

    if (nextIndex >= requeued.length) {
      const minutes = Math.round((Date.now() - get().startedAt) / 60000);
      set({ phase: "done", queue: requeued, index: nextIndex, grades: nextGrades, lastOutcome: outcome, minutes });
      return;
    }
    set({
      queue: requeued,
      index: nextIndex,
      phase: "front",
      grades: nextGrades,
      lastOutcome: outcome,
      itemStartedAt: Date.now(),
    });
  },

  reset() {
    set({ phase: "idle", queue: [], index: 0, grades: { ...EMPTY_GRADES }, lastOutcome: null, minutes: 0 });
  },
}));

export function currentItem(): QueueItem | null {
  const { queue, index, phase } = useSrsSession.getState();
  if (phase === "idle" || phase === "done" || !queue[index]) return null;
  return queue[index];
}

export function currentCardType(item: QueueItem | null): CardType | null {
  return item ? item.type : null;
}
