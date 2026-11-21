// Aturan awal pilot. Tidak menaikkan level otomatis: hanya mengevaluasi bukti
// yang memiliki provenance lengkap, bukan data historis yang tak dapat diverifikasi.
export type Evidence = { stimulus: string; context: string; at: number; first: boolean; correct: boolean; support: "none" | "hint" | "transcript"; kind: "receptive" | "productive"; reviewed?: boolean; scores?: number[] };
export function readiness(items: Evidence[], kind: Evidence["kind"]): boolean {
  const seen = new Set<string>();
  const first = [...items].sort((a,b)=>a.at-b.at).filter(e=>{
    if (e.kind!==kind || !e.stimulus || !e.context || !Number.isFinite(e.at) || !e.first || seen.has(e.stimulus)) return false;
    seen.add(e.stimulus); return true;
  });
  const valid = first.filter(e=>e.correct && e.support==="none" && (kind === "receptive" || (e.reviewed === true && !!e.scores && e.scores.length >= 4 && e.scores.every(n=>n>=2 && n<=3))));
  if (kind === "receptive" && (first.length < 5 || first.slice(0,5).filter(e=>valid.includes(e)).length < 4)) return false;
  if (kind === "productive" && valid.length < 2) return false;
  const candidates = kind === "receptive" ? first.slice(0,5).filter(e=>valid.includes(e)) : valid;
  return new Set(candidates.map(e=>e.context)).size >= 2 && new Set(candidates.map(e=>new Date(e.at).toDateString())).size >= 2;
}
