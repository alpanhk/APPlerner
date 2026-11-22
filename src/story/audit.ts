import { CAST } from "./cast";
import { fill, findRule, norm } from "./match";
import type { Chapter, StoryNode } from "./types";

// ===== Auditor Pola Prolog =====
// Memeriksa secara otomatis bahwa setiap bab membawakan materi seperti prolog.
// Dijalankan di halaman /pola dan lewat /api/audit — bab yang melanggar langsung terlihat.

export interface Check {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface ChapterAudit {
  id: string;
  title: string;
  nodes: number;
  inputs: number;
  checks: Check[];
  ok: boolean;
}

const TEST_NAME = "Rina";

function targets(n: StoryNode): string[] {
  if (n.kind === "line") return [n.next];
  if (n.kind === "choice") return n.options.map((o) => o.next);
  if (n.kind === "input") return [...n.rules.map((r) => r.next), ...(n.skip ? [n.skip.next] : [])];
  return [];
}

export function auditChapter(ch: Chapter, earlierObjectives: string[]): ChapterAudit {
  const all = Object.values(ch.nodes);
  const inputs = all.filter((n) => n.kind === "input");
  const lines = all.filter((n) => n.kind === "line");
  const checks: Check[] = [];
  const add = (id: string, label: string, bad: string[]) => checks.push({ id, label, ok: bad.length === 0, detail: bad.slice(0, 4).join(" · ") || undefined });

  // 1. Urutan lima langkah
  const kinds = ch.outline.map((o) => o.kind);
  const shape: string[] = [];
  if (kinds[0] !== "opening") shape.push("tidak dibuka dengan Tiba");
  if (kinds[kinds.length - 1] !== "payoff") shape.push("tidak ditutup dengan Temuan");
  if (kinds[kinds.length - 2] !== "hub") shape.push("tidak ada Menjelajah sebelum Temuan");
  if (!kinds.includes("lesson")) shape.push("tidak ada Belajar");
  if (!kinds.includes("encounter")) shape.push("tidak ada Bertemu");
  add("shape", "Lima langkah berurutan: Tiba → Belajar → Bertemu → Menjelajah → Temuan", shape);

  // 2. Diajarkan sebelum diuji
  const taught = new Set<string>(earlierObjectives); // materi bab sebelumnya sudah dikenal
  const untaught: string[] = [];
  for (const o of ch.outline) {
    if (o.kind === "lesson") o.objs.forEach((x) => taught.add(x));
    else for (const x of o.objs) if (!taught.has(x)) untaught.push(`${x} diuji sebelum diajarkan`);
  }
  add("taught", "Setiap kalimat dimodelkan Frau Lehmann sebelum dipakai kepada tokoh", untaught);

  // 3. Setiap tujuan punya latihan terbimbing DAN pertemuan nyata
  const coverage: string[] = [];
  for (const obj of ch.objectives) {
    const rel = inputs.filter((n) => n.objective === obj.id);
    if (!ch.outline.some((o) => o.kind === "lesson" && o.objs.includes(obj.id))) coverage.push(`${obj.id}: tanpa pelajaran`);
    if (!rel.some((n) => !n.guided)) coverage.push(`${obj.id}: tanpa pertemuan nyata`);
  }
  add("coverage", "Setiap tujuan punya pelajaran bersama tutor dan pembuktian dalam pertemuan", coverage);

  // 4. Pertemuan pilihan mengulang materi yang sudah dikenal
  const known = new Set([...earlierObjectives, ...ch.objectives.map((o) => o.id)]);
  const review = ch.outline.flatMap((o) => o.reviewObjs ?? []).filter((x) => !known.has(x));
  add("review", "Pertemuan pilihan hanya mengulang materi yang sudah dikenal", review);

  // 5. Petunjuk tiga tingkat, diakhiri contoh lengkap
  add(
    "hints",
    "Petunjuk tiga tingkat: makna → awal kalimat → contoh lengkap",
    inputs.filter((n) => n.hints.length !== 3 || !n.hints[2].includes(n.model)).map((n) => n.id),
  );

  // 6. Contoh lengkap diterima oleh giliran itu sendiri
  add(
    "model",
    "Contoh lengkap setiap giliran diterima sebagai jawaban utuh",
    inputs.filter((n) => findRule(n.rules, fill(n.model, TEST_NAME), TEST_NAME) !== n.rules[0]).map((n) => `${n.id}: „${n.model}“`),
  );

  // 7. Kepingan kata cukup untuk menyusun contoh lengkap
  add(
    "chips",
    "Kepingan kata cukup untuk menyusun contoh lengkap",
    inputs.flatMap((n) => {
      const have = new Set(n.chips.map((c) => norm(fill(c, TEST_NAME))));
      const missing = norm(fill(n.model, TEST_NAME)).split(" ").filter((w) => !have.has(w));
      return missing.length ? [`${n.id}: kurang „${missing.join(" ")}“`] : [];
    }),
  );

  // 8. Bahasa: tokoh berbahasa Jerman, semua kalimat Jerman punya arti
  add(
    "lang",
    "Tokoh berbicara bahasa Jerman dan setiap kalimat Jerman punya arti",
    lines.flatMap((n) => {
      const bad: string[] = [];
      if (n.lang === "de" && !n.tr) bad.push(`${n.id}: tanpa arti`);
      if (n.speaker !== "tutor" && n.speaker !== "narator" && n.lang !== "de") bad.push(`${n.id}: tokoh tidak berbahasa Jerman`);
      if (n.speaker !== "narator" && !CAST[n.speaker]) bad.push(`${n.id}: pemeran „${n.speaker}“ tidak dikenal`);
      return bad;
    }),
  );

  // 9. Alur utuh: tidak ada tautan putus atau node tak terjangkau
  const seen = new Set<string>([ch.start]);
  const queue = [ch.start];
  const broken: string[] = [];
  while (queue.length) {
    const node = ch.nodes[queue.pop() as string];
    for (const t of targets(node)) {
      if (!ch.nodes[t]) broken.push(`${node.id} → ${t} (tidak ada)`);
      else if (!seen.has(t)) {
        seen.add(t);
        queue.push(t);
      }
    }
  }
  for (const n of all) if (!seen.has(n.id)) broken.push(`${n.id} tak terjangkau`);
  if (!seen.has(`${ch.id}.end`)) broken.push("akhir bab tak terjangkau");
  add("graph", "Alur utuh: tanpa tautan putus, semua adegan terjangkau", broken);

  return { id: ch.id, title: ch.title, nodes: all.length, inputs: inputs.length, checks, ok: checks.every((c) => c.ok) };
}

export function auditAll(chapters: Chapter[]): ChapterAudit[] {
  const earlier: string[] = [];
  return chapters.map((ch) => {
    const res = auditChapter(ch, [...earlier]);
    earlier.push(...ch.objectives.map((o) => o.id));
    return res;
  });
}
