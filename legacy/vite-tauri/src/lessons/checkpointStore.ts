// DB-02: simpan hasil checkpoint (lesson_progress + snapshot per tujuan)
// melalui satu perintah Rust transaksional.
import { invoke } from "@tauri-apps/api/core";
import type { CheckpointGrade } from "./checkpointResult";

export type CheckpointSnapshot = {
  ts: string;
  unit: number;
  score: number;
  pass: boolean;
  correct: number;
  total: number;
  objectives: Array<{ id: string; title: string; correct: number; total: number; pass: boolean }>;
  best_score: number;
  ever_passed: boolean;
};

export type CheckpointSaveResult = { best_score: number; ever_passed: boolean };

export async function saveCheckpointResult(
  unitNo: number,
  lessonNo: number,
  grade: CheckpointGrade,
  finishedAt: string,
): Promise<CheckpointSaveResult> {
  const snapshot: CheckpointSnapshot = {
    ts: finishedAt,
    unit: unitNo,
    score: grade.score,
    pass: grade.pass,
    correct: grade.correct,
    total: grade.total,
    objectives: grade.objectiveResults.map((entry) => ({
      id: entry.objective.id,
      title: entry.objective.title,
      correct: entry.correct,
      total: entry.total,
      pass: entry.pass,
    })),
    // Nilai awal; perintah Rust menaikkan ke best historis dan pernah-lulus.
    best_score: grade.score,
    ever_passed: grade.pass,
  };
  return invoke<CheckpointSaveResult>("save_checkpoint_result", {
    payload: {
      unit_no: unitNo,
      lesson_no: lessonNo,
      state: grade.pass ? "done" : "failed",
      score: grade.score,
      finished_at: finishedAt,
      snapshot_json: JSON.stringify(snapshot),
    },
  });
}
