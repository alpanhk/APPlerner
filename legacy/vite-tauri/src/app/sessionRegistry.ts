// Sambungkan posisi tersimpan ke data nyata. Hanya membaca envelope yang sudah
// divalidasi pemiliknya; payload rusak dilewati (karantina tetap di storage).
import getDb from "../stores/db";
import type { Route } from "../klab/routes";

export type ContinueTarget = {
  route: Route;
  label: string;
  detail: string;
};

type DraftRow = { key: string; payload: string; updated_at?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function envelopeData(raw: string, expectedKey: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1 || parsed.key !== expectedKey ||
      typeof parsed.sessionId !== "string" || !parsed.sessionId) return null;
    return isRecord(parsed.data) ? parsed.data : null;
  } catch { return null; }
}

function lessonTarget(row: DraftRow): ContinueTarget | null {
  const match = /^lernen_lesson_(\d+)_(\d+)$/.exec(row.key);
  if (!match) return null;
  let data: unknown;
  try { data = JSON.parse(row.payload); } catch { return null; }
  if (!isRecord(data) || !Number.isInteger(data.step) || (data.step as number) < 0) return null;
  const unitNo = Number(match[1]);
  const lessonNo = Number(match[2]);
  const step = data.step as number;
  // Detail posisi nyata: draft KLAB menyimpan stage/exerciseIndex; draft lama
  // tetap memakai format langkah 5 langkah.
  const detail = data.klab === true
    ? data.stage === "payment" && Number.isInteger(data.exerciseIndex) && (data.exerciseIndex as number) > 0
      ? `Lanjutkan latihan · Soal ${(data.exerciseIndex as number) + 1}`
      : data.stage === "order" || (data.stage === undefined && Array.isArray(data.answers) && data.answers.length > 0)
        ? "Lanjutkan latihan · Soal 1"
        : `Lanjutkan materi · Bagian ${step + 1}`
    : `Lanjutkan dari langkah ${step + 1}/5`;
  return {
    route: { name: "lesson", unitNo, lessonNo, sessionId: `resume:${row.key}` },
    label: `A1 · Unit ${unitNo} · Pelajaran ${lessonNo}`,
    detail,
  };
}

function checkpointTarget(row: DraftRow): ContinueTarget | null {
  const match = /^checkpoint_session:(\d+)$/.exec(row.key);
  if (!match) return null;
  const data = envelopeData(row.payload, row.key);
  if (!data || !Number.isInteger(data.unitNo) || !Array.isArray(data.items) || data.items.length === 0) return null;
  const unitNo = data.unitNo as number;
  const index = Number.isInteger(data.index) ? (data.index as number) : 0;
  const saved = data.result !== null && data.result !== undefined
    ? "hasil tersimpan" : "belum selesai";
  return {
    route: { name: "checkpoint", unitNo, sessionId: `resume:${row.key}` },
    label: `Checkpoint Unit ${unitNo}`,
    detail: `Soal ${Math.min(index + 1, data.items.length)}/${data.items.length} · ${saved}`,
  };
}

function sameRoute(a: Route, b: Route): boolean {
  const keys = Object.keys(a) as Array<keyof Route>;
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

// Urutan: sesi pelajaran aktif, then checkpoint aktif. Tidak menampilkan angka
// atau status fiktif bila tidak ada data.
export async function loadContinueTargets(): Promise<ContinueTarget[]> {
  const db = await getDb();
  const rows = await db.select<DraftRow[]>(
    "SELECT d.key,d.payload,d.updated_at FROM lesson_drafts d WHERE NOT EXISTS (" +
      "SELECT 1 FROM lesson_progress p WHERE d.key = 'lernen_lesson_' || p.unit_no || '_' || p.lesson_no " +
      "AND p.state = 'done' AND p.finished_at >= d.updated_at) ORDER BY d.updated_at DESC LIMIT 80",
  );
  const targets: ContinueTarget[] = [];
  for (const kind of [lessonTarget, checkpointTarget]) {
    for (const row of rows) {
      const target = kind(row);
      if (target && !targets.some((existing) => sameRoute(existing.route, target.route))) targets.push(target);
    }
  }
  return targets;
}
