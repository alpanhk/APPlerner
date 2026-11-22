// Inventaris tujuan A1 dan bank soal transfer per tujuan.
// Unit yang punya policy dan bank lengkap memakai checkpoint per tujuan:
// 3 soal baru per tujuan dari bank minimal 5, minimal 2 benar per tujuan.
import a1ObjectivesRaw from "../data/lessons/a1_objectives.json";
import a1Unit1BankRaw from "../data/lessons/a1_unit1_bank.json";
import a1Unit2BankRaw from "../data/lessons/a1_unit2_bank.json";
import a1Unit3BankRaw from "../data/lessons/a1_unit3_bank.json";
import a1Unit4BankRaw from "../data/lessons/a1_unit4_bank.json";
import a1Unit5BankRaw from "../data/lessons/a1_unit5_bank.json";
import a1Unit6BankRaw from "../data/lessons/a1_unit6_bank.json";
import a1Unit7BankRaw from "../data/lessons/a1_unit7_bank.json";
import a1Unit8BankRaw from "../data/lessons/a1_unit8_bank.json";
import a1Unit9BankRaw from "../data/lessons/a1_unit9_bank.json";
import a1Unit10BankRaw from "../data/lessons/a1_unit10_bank.json";
import a1Unit11BankRaw from "../data/lessons/a1_unit11_bank.json";
import a1Unit12BankRaw from "../data/lessons/a1_unit12_bank.json";
import type { DrillCode, DrillItem } from "../drills/items";
import { makeAttemptSeed, mulberry32, shuffleChoiceOptions, shuffleWith, type Rng } from "./optionOrder";

export type ObjectiveCoverage = "covered" | "partial";
export type ObjectiveReview = "reviewed" | "not-reviewed";

export type A1Objective = {
  id: string;
  unit: number;
  title: string;
  canDo: string;
  lessonNos: number[];
  prerequisites: string[];
  coverage: ObjectiveCoverage;
  review: ObjectiveReview;
  evidence: string[];
  remedy: string;
};

export type ObjectivePolicy = {
  unit: number;
  itemsPerObjective: number;
  perObjectiveMin: number;
  pass: number;
  poolPerObjective: number;
};

export type ObjectiveBankItem = {
  id: string;
  objectiveId: string;
  code: DrillCode;
  prompt: string;
  sub: string;
  mode: "choice" | "type" | "order";
  options?: string[];
  tokens?: string[];
  answer: string;
  altAnswers?: string[];
  wrongFeedback?: Record<string, string>;
  hintOnWrong?: string;
  explanation: string;
};

type ObjectivesFile = {
  level: string;
  reviewed: boolean;
  note: string;
  objectives: A1Objective[];
  policies: ObjectivePolicy[];
};

type BankFile = {
  level: string;
  unit: number;
  reviewed: boolean;
  source: string;
  items: ObjectiveBankItem[];
};

const OBJECTIVES_FILE = a1ObjectivesRaw as ObjectivesFile;
const BANKS: BankFile[] = [
  a1Unit1BankRaw as BankFile,
  a1Unit2BankRaw as BankFile,
  a1Unit3BankRaw as BankFile,
  a1Unit4BankRaw as BankFile,
  a1Unit5BankRaw as BankFile,
  a1Unit6BankRaw as BankFile,
  a1Unit7BankRaw as BankFile,
  a1Unit8BankRaw as BankFile,
  a1Unit9BankRaw as BankFile,
  a1Unit10BankRaw as BankFile,
  a1Unit11BankRaw as BankFile,
  a1Unit12BankRaw as BankFile,
];

export const A1_OBJECTIVES: A1Objective[] = OBJECTIVES_FILE.objectives;
export const A1_OBJECTIVES_REVIEWED = OBJECTIVES_FILE.reviewed;
export const A1_OBJECTIVES_NOTE = OBJECTIVES_FILE.note;

export function objectivesOfUnit(unitNo: number): A1Objective[] {
  return A1_OBJECTIVES.filter((objective) => objective.unit === unitNo);
}

export function objectivePolicy(unitNo: number): ObjectivePolicy | undefined {
  return OBJECTIVES_FILE.policies.find((policy) => policy.unit === unitNo);
}

function bankForUnit(unitNo: number): BankFile | undefined {
  return BANKS.find((bank) => bank.level === OBJECTIVES_FILE.level && bank.unit === unitNo);
}

export type ObjectiveReadinessStatus = "ready" | "insufficient" | "unavailable";

export type ObjectiveReadiness = {
  unitNo: number;
  status: ObjectiveReadinessStatus;
  missing: { objectiveId: string; have: number; need: number }[];
};

// Kesiapan bank tanpa membaca UI. Unit tanpa policy/kisi-kisi = "unavailable"
// (bukan checkpoint per tujuan). Policy ada tetapi bank kurang = "insufficient";
// unit seperti ini tidak boleh menghasilkan kelulusan checkpoint.
export function evaluateReadiness(
  objectives: readonly A1Objective[],
  policy: ObjectivePolicy | undefined,
  countsByObjective: ReadonlyMap<string, number>,
): { status: ObjectiveReadinessStatus; missing: { objectiveId: string; have: number; need: number }[] } {
  if (!policy || objectives.length === 0) return { status: "unavailable", missing: [] };
  const missing = objectives
    .map((objective) => ({
      objectiveId: objective.id,
      have: countsByObjective.get(objective.id) ?? 0,
      need: policy.itemsPerObjective,
    }))
    .filter((entry) => entry.have < entry.need);
  return { status: missing.length === 0 ? "ready" : "insufficient", missing };
}

export function objectiveReadiness(unitNo: number): ObjectiveReadiness {
  const policy = objectivePolicy(unitNo);
  const bank = bankForUnit(unitNo);
  const objectives = objectivesOfUnit(unitNo);
  const counts = new Map<string, number>();
  for (const item of bank?.items ?? []) {
    counts.set(item.objectiveId, (counts.get(item.objectiveId) ?? 0) + 1);
  }
  const { status, missing } = evaluateReadiness(objectives, policy, counts);
  return { unitNo, status, missing };
}

function toDrillItem(unitNo: number, item: ObjectiveBankItem, rng: Rng): DrillItem {
  let tokens = item.tokens ? shuffleWith(item.tokens, rng) : undefined;
  if (tokens && tokens.join(" ") === item.answer) {
    tokens = [...tokens.slice(1), tokens[0]];
  }
  const base: DrillItem = {
    code: item.code,
    checkpoint: true,
    objectiveId: item.objectiveId,
    key: `A1:${unitNo}:${item.id}`,
    prompt: item.prompt,
    sub: item.sub,
    mode: item.mode,
    options: item.options,
    tokens,
    answer: item.answer,
    altAnswers: item.altAnswers,
    wrongFeedback: item.wrongFeedback,
    hintOnWrong: item.hintOnWrong,
    explanation: item.explanation,
  };
  // Kunci dan id tidak berubah; hanya urutan tombol yang diacak per percobaan.
  return shuffleChoiceOptions(base, rng);
}

export type ObjectiveScore = { correct: number; total: number };

export type ObjectivePassResult = {
  score: number;
  overallPass: boolean;
  objectivesPass: boolean;
  pass: boolean;
};

// Aturan kelulusan tunggal untuk checkpoint per tujuan. Dipakai runner dan
// tes agar 73 persen dengan satu tujuan gagal tidak pernah dilaporkan lulus.
export function evaluateObjectiveResult(
  policy: Pick<ObjectivePolicy, "pass" | "perObjectiveMin">,
  perObjective: readonly ObjectiveScore[],
  correct: number,
  total: number,
): ObjectivePassResult {
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const overallPass = total >= 2 && score >= policy.pass;
  const objectivesPass =
    perObjective.length > 0 &&
    perObjective.every((entry) => entry.total > 0 && entry.correct >= policy.perObjectiveMin);
  return { score, overallPass, objectivesPass, pass: overallPass && objectivesPass };
}

export type ObjectiveCheckpointPlan = {
  unitNo: number;
  items: DrillItem[];
  objectives: A1Objective[];
  policy: ObjectivePolicy;
  pool: DrillItem[];
};

// Apakah unit ini punya kisi-kisi dan bank yang cukup untuk checkpoint per tujuan.
export function objectiveCheckpointAvailable(unitNo: number): boolean {
  return objectiveReadiness(unitNo).status === "ready";
}

// Ambil `itemsPerObjective` soal per tujuan. Bila `excludeKeys` diberikan,
// soal yang sudah dipakai pada percobaan sebelumnya didahulukan untuk dilewati.
export function buildObjectiveCheckpoint(
  unitNo: number,
  excludeKeys: ReadonlySet<string> = new Set<string>(),
  rng: Rng = mulberry32(makeAttemptSeed()),
): ObjectiveCheckpointPlan | null {
  if (!objectiveCheckpointAvailable(unitNo)) return null;
  const policy = objectivePolicy(unitNo);
  const bank = bankForUnit(unitNo);
  const objectives = objectivesOfUnit(unitNo);
  if (!policy || !bank) return null;

  const pool = bank.items
    .filter((item) => objectives.some((objective) => objective.id === item.objectiveId))
    .map((item) => toDrillItem(unitNo, item, rng));

  // P3: tujuan yang punya soal produksi (mode type/order) wajib menguji
  // produksi. Happy path tidak diubah: ambil `itemsPerObjective` pertama dari
  // `candidates` yang sudah fresh-first. Bila pilihan itu tidak memuat
  // produksi, ganti item terakhir dengan produksi pertama di `candidates`.
  // Karena `candidates` fresh-first, produksi segar didahulukan; bila itu
  // habis, satu produksi lama dipakai sebagai satu-satunya yang tersedia.
  const isProduction = (item: DrillItem) => item.mode === "type" || item.mode === "order";

  const selected: DrillItem[] = [];
  for (const objective of objectives) {
    const own = pool.filter((item) => item.objectiveId === objective.id);
    const fresh = shuffleWith(own.filter((item) => !excludeKeys.has(item.key)), rng);
    const used = shuffleWith(own.filter((item) => excludeKeys.has(item.key)), rng);
    const candidates = [...fresh, ...used];
    const picked = candidates.slice(0, policy.itemsPerObjective);
    if (!picked.some(isProduction)) {
      const production = candidates.find(isProduction);
      if (production) picked[picked.length - 1] = production;
    }
    selected.push(...picked);
  }

  return { unitNo, items: shuffleWith(selected, rng), objectives, policy, pool };
}

// Remedial memakai soal bank yang belum dipakai pada percobaan checkpoint.
export function buildRemedialItems(
  plan: ObjectiveCheckpointPlan,
  failedObjectiveIds: readonly string[],
  usedKeys: ReadonlySet<string>,
  rng: Rng = mulberry32(makeAttemptSeed()),
): DrillItem[] {
  const failed = new Set(failedObjectiveIds);
  const perObjective = Math.max(1, plan.policy.itemsPerObjective - 1);
  const items: DrillItem[] = [];
  for (const objective of plan.objectives) {
    if (!failed.has(objective.id)) continue;
    const unused = shuffleWith(
      plan.pool.filter((item) => item.objectiveId === objective.id && !usedKeys.has(item.key)),
      rng,
    );
    items.push(...unused.slice(0, perObjective));
  }
  return shuffleWith(items, rng);
}
