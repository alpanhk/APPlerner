import type { Attempt } from "./types";

// ===== Penilaian berbasis tindakan nyata =====
// Bukti kemampuan hanya dari kalimat yang ditulis pemain, bukan dari klik "Lanjut".
// "Mandiri" hanya bila kalimat utuh dipakai kepada tokoh (bukan saat latihan bersama
// Frau Lehmann) dan tanpa satu petunjuk pun. Aturan ini sama untuk semua bab.

export type Level = "belum" | "berlatih" | "mandiri";

export const LEVEL_LABEL: Record<Level, string> = {
  belum: "Belum dicoba",
  berlatih: "Sudah berlatih",
  mandiri: "Mandiri",
};

export const isIndependent = (a: Attempt) => a.full && !a.guided && a.hintsUsed === 0;

export function levelOf(attempts: Attempt[], objective: string): Level {
  const rel = attempts.filter((a) => a.objective === objective);
  if (rel.length === 0) return "belum";
  return rel.some(isIndependent) ? "mandiri" : "berlatih";
}

/** Bukti terbaik untuk satu tujuan: mandiri > utuh kepada tokoh > apa pun kepada tokoh > latihan. */
export function bestEvidence(attempts: Attempt[], objective: string): Attempt | null {
  const rel = attempts.filter((a) => a.objective === objective);
  const score = (a: Attempt) => (isIndependent(a) ? 4 : a.full && !a.guided ? 3 : !a.guided ? 2 : 1);
  return rel.reduce<Attempt | null>((best, a) => (!best || score(a) >= score(best) ? a : best), null);
}

export function describeEvidence(a: Attempt, whoName: string): string {
  const how = a.hintsUsed === 0 ? "tanpa petunjuk" : `dengan ${a.hintsUsed} petunjuk`;
  if (a.guided) return `Kamu melatihnya bersama Frau Lehmann, ${how}.`;
  if (!a.full) return `${whoName} memahamimu, ${how} — tetapi belum dengan kalimat utuh.`;
  return `Kamu mengatakannya kepada ${whoName} dengan kalimat utuh, ${how}.`;
}
