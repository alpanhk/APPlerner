import type { DrillItem } from "../drills/items";
import { normalize } from "../srs/answers";

// Umpan balik spesifik untuk pilihan yang salah; jatuh kembali ke petunjuk
// umum bila pilihan itu belum dipetakan (jangan mengarang diagnosis).
export function feedbackFor(item: DrillItem, correct: boolean, chosen: string): string {
  if (correct) return item.explanation;
  const map = item.wrongFeedback;
  if (map && chosen) {
    if (map[chosen]) return map[chosen];
    const key = Object.keys(map).find((option) => normalize(option) === normalize(chosen));
    if (key) return map[key];
  }
  return item.hintOnWrong ?? item.explanation;
}
