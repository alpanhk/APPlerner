export const REVIEW_INTERVALS = [3, 7, 21] as const;
/** Hitung tanggal setempat, bukan kelipatan 24 jam (aman saat zona berubah DST). */
export function reviewDueAt(completedAt: number, days: number): number {
  const due = new Date(completedAt);
  due.setDate(due.getDate() + days);
  return due.getTime();
}
export function reviewAvailable(completedAt: number, days: number, now: number): boolean {
  return Number.isFinite(completedAt) && Number.isFinite(now) && now >= reviewDueAt(completedAt, days);
}
