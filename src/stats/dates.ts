// Utilitas tanggal lokal (bukan UTC) untuk streak, heatmap, dan forecast.
// Semua "hari" di aplikasi ini adalah hari lokal pengguna, sesuai `progress_daily`.

export const WEEKDAY_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

// Daftar hari (lama → baru) sebanyak `n`, berakhir di `today`.
export function lastDays(n: number, today = dayKey(new Date())): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(shiftDay(today, -i));
  return out;
}

export function dayLabelId(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return WEEKDAY_ID[new Date(y, m - 1, d).getDay()];
}

export function shortDateId(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

// Streak dari kumpulan hari aktif (PRD F5): hari ini boleh belum aktif —
// streak dihitung sampai kemarin agar belum "putus" sebelum hari selesai.
export function computeStreak(
  activeDays: Set<string>,
  today = dayKey(new Date()),
): { current: number; best: number } {
  let current = 0;
  let cursor = activeDays.has(today) ? today : shiftDay(today, -1);
  while (activeDays.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev = "";
  for (const day of [...activeDays].sort()) {
    run = prev && shiftDay(prev, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return { current, best };
}

// Senin = awal minggu (heatmap), sesuai kebiasaan kalender Indonesia.
export function weekdayIndexMondayFirst(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const wd = new Date(y, m - 1, d).getDay(); // 0 = Minggu
  return (wd + 6) % 7;
}
