// Rekonsiliasi draft tampilan dengan attempt yang sudah COMMIT.
// Attempt adalah ledger otoritatif: draft sesi tidak boleh menampilkan verdict
// benar/salah yang belum tercatat di attempts untuk sesi yang sama.
import type { DrillItem } from "../drills/items";
import type { DrillDraft } from "./drillDraft";

export function reconcileDraft(
  draft: DrillDraft,
  answers: ReadonlyMap<string, boolean>,
  items: readonly DrillItem[],
): DrillDraft {
  const correctCount = items.reduce(
    (sum, item) => sum + (answers.get(item.key) === true ? 1 : 0),
    0,
  );
  const current = items[draft.index];
  const committed = current ? answers.get(current.key) : undefined;
  return {
    ...draft,
    correctCount,
    correct: committed === undefined ? null : committed,
  };
}

// Snapshot sesi dapat sudah maju ke soal berikutnya sementara draft atomik
// masih di soal yang baru dijawab. Jangan mundur: posisi terbesar menang.
export function chooseDraftIndex(
  snapshotIndex: number,
  attemptIndex: number,
  itemCount: number,
): number {
  return Math.min(Math.max(0, itemCount - 1), Math.max(snapshotIndex, attemptIndex));
}

// Draft attempt hanya boleh memengaruhi posisi bila terikat ke sesi snapshot.
// Draft lama tanpa sessionId tetap dibaca sebagai data, tetapi tidak dipakai
// untuk memundurkan/menggeser posisi.
export function canUseAttemptDraft(
  attemptSessionId: string | undefined,
  snapshotSessionId: string,
): boolean {
  return Boolean(attemptSessionId) && attemptSessionId === snapshotSessionId;
}
