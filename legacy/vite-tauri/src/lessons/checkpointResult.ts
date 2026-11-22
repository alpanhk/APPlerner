// Penilaian checkpoint yang murni dan dapat diuji tanpa UI.
// Aturan: hanya jawaban untuk item pada percobaan ini yang dihitung, satu
// jawaban per item (yang pertama), hitungan per tujuan dibatasi jumlah item
// tujuan tersebut, dan semua tujuan harus memenuhi ambang minimal.
import type { DrillItem } from "../drills/items";
import type { A1Objective, ObjectivePolicy } from "./objectives";

export type CheckpointAnswer = { key: string; correct: boolean };

export type ObjectiveGrade = {
  objective: A1Objective;
  correct: number;
  total: number;
  pass: boolean;
  missed: DrillItem[];
};

export type CheckpointGrade = {
  correct: number;
  total: number;
  score: number;
  pass: boolean;
  objectiveResults: ObjectiveGrade[];
};

export function gradeCheckpoint(
  items: readonly DrillItem[],
  objectives: readonly A1Objective[],
  policy: ObjectivePolicy,
  answers: readonly CheckpointAnswer[],
  passThreshold: number,
): CheckpointGrade {
  const current = new Map(items.map((item) => [item.key, item]));
  const counted = new Set<string>();
  const perObjective = new Map<string, { correct: number; missed: DrillItem[] }>();
  for (const answer of answers) {
    const item = current.get(answer.key);
    // Abaikan jawaban sesi lama, item di luar rencana, dan duplikat.
    if (!item || counted.has(answer.key)) continue;
    counted.add(answer.key);
    const bucket = perObjective.get(item.objectiveId ?? "") ?? { correct: 0, missed: [] };
    if (answer.correct) bucket.correct += 1;
    else bucket.missed.push(item);
    perObjective.set(item.objectiveId ?? "", bucket);
  }

  let correct = 0;
  const objectiveResults: ObjectiveGrade[] = objectives.map((objective) => {
    const objectiveItems = items.filter((item) => item.objectiveId === objective.id);
    const bucket = perObjective.get(objective.id) ?? { correct: 0, missed: [] };
    const capped = Math.min(bucket.correct, objectiveItems.length);
    correct += capped;
    return {
      objective,
      correct: capped,
      total: objectiveItems.length,
      pass: objectiveItems.length >= policy.itemsPerObjective && capped >= policy.perObjectiveMin,
      missed: bucket.missed,
    };
  });

  const total = items.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const allObjectivesPass = objectiveResults.length > 0 && objectiveResults.every((entry) => entry.pass);
  return {
    correct,
    total,
    score,
    pass: total >= 2 && score >= passThreshold && allObjectivesPass,
    objectiveResults,
  };
}
