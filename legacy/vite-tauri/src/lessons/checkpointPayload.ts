// Validasi payload checkpoint pada batas baca. CheckpointRunner tidak boleh
// membaca bentuk JSON mentah; parser ini memastikan item, posisi, jawaban,
// hasil, dan remedial cukup lengkap untuk dirender. Data opsional yang rusak
// dinormalisasi dan ditandai recovered, bukan membuat layar berhenti.
import type { DrillItem } from "../drills/items";
import type { CheckpointGrade, ObjectiveGrade } from "./checkpointResult";
import { isDrillItem, parseDrillDraftValue, type DrillDraft } from "./drillDraft";

export type CheckpointSessionData = {
  unitNo: number;
  items: DrillItem[];
  answers: Array<{ key: string; correct: boolean }>;
  index: number;
  correct: boolean | null;
  correctCount: number;
  result: CheckpointGrade | null;
  saved: boolean;
  remedial: DrillItem[] | null;
  remedialDone: { correct: number; total: number } | null;
  remedialDraft: DrillDraft | null;
  remedialSessionId: string | null;
};

export type ParseOutcome<T> = {
  value: T | null;
  invalid: boolean;
  recovered: boolean;
  reason?: string;
};

const invalid = <T>(reason: string): ParseOutcome<T> => ({ value: null, invalid: true, recovered: false, reason });
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function uniqueItems(value: unknown): DrillItem[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every(isDrillItem)) return null;
  const keys = new Set(value.map((item) => item.key));
  return keys.size === value.length ? value : null;
}

function parseObjectiveGrade(value: unknown): ObjectiveGrade | null {
  if (!object(value) || !object(value.objective)) return null;
  const objective = value.objective;
  if (typeof objective.id !== "string" || typeof objective.title !== "string" ||
    typeof objective.remedy !== "string") return null;
  if (!finite(value.correct) || !finite(value.total) || typeof value.pass !== "boolean") return null;
  const missed = Array.isArray(value.missed) && value.missed.every(isDrillItem) ? value.missed : [];
  return {
    objective: objective as unknown as ObjectiveGrade["objective"],
    correct: value.correct,
    total: value.total,
    pass: value.pass,
    missed,
  };
}

export function parseCheckpointGrade(value: unknown): CheckpointGrade | null {
  if (!object(value)) return null;
  if (!finite(value.correct) || !finite(value.total) || !finite(value.score) ||
    typeof value.pass !== "boolean" || !Array.isArray(value.objectiveResults)) return null;
  const objectiveResults: ObjectiveGrade[] = [];
  for (const entry of value.objectiveResults) {
    const parsed = parseObjectiveGrade(entry);
    if (!parsed) return null;
    objectiveResults.push(parsed);
  }
  return {
    correct: value.correct,
    total: value.total,
    score: value.score,
    pass: value.pass,
    objectiveResults,
  };
}

export function parseCheckpointSessionValue(value: unknown): ParseOutcome<CheckpointSessionData> {
  if (!object(value)) return invalid("payload sesi bukan objek");
  if (!Number.isInteger(value.unitNo) || (value.unitNo as number) <= 0) {
    return invalid("unitNo sesi tidak valid");
  }
  const items = uniqueItems(value.items);
  if (!items) return invalid("items sesi hilang/tidak valid/duplikat");

  let recovered = false;
  const rawIndex = value.index;
  let index = Number.isInteger(rawIndex) ? (rawIndex as number) : 0;
  if (index < 0 || index >= items.length) {
    index = clamp(index, 0, items.length - 1);
    recovered = true;
  }

  const answers: Array<{ key: string; correct: boolean }> = [];
  const answerKeys = new Set<string>();
  if (Array.isArray(value.answers)) {
    for (const entry of value.answers) {
      if (!object(entry) || typeof entry.key !== "string" || typeof entry.correct !== "boolean") {
        recovered = true;
        continue;
      }
      if (!items.some((item) => item.key === entry.key) || answerKeys.has(entry.key)) {
        recovered = true;
        continue;
      }
      answerKeys.add(entry.key);
      answers.push({ key: entry.key, correct: entry.correct });
    }
  } else {
    recovered = true;
  }

  const correct = value.correct === null || typeof value.correct === "boolean" ? value.correct : null;
  if (correct === null && value.correct !== null) recovered = true;

  let correctCount = Number.isInteger(value.correctCount) ? (value.correctCount as number) : NaN;
  if (!Number.isInteger(correctCount) || correctCount < 0 || correctCount > items.length) {
    correctCount = answers.filter((answer) => answer.correct).length;
    recovered = true;
  }

  const result = value.result === null || value.result === undefined ? null : parseCheckpointGrade(value.result);
  if (result === null && value.result !== null && value.result !== undefined) recovered = true;

  const saved = typeof value.saved === "boolean" ? value.saved : false;
  if (typeof value.saved !== "boolean") recovered = true;

  let remedial: DrillItem[] | null = null;
  if (value.remedial !== null && value.remedial !== undefined) {
    remedial = uniqueItems(value.remedial);
    if (!remedial) recovered = true;
  }

  let remedialDone: { correct: number; total: number } | null = null;
  if (object(value.remedialDone)) {
    const done = value.remedialDone;
    if (Number.isInteger(done.correct) && Number.isInteger(done.total) &&
      (done.correct as number) >= 0 && (done.total as number) >= 0 &&
      (done.correct as number) <= (done.total as number)) {
      remedialDone = { correct: done.correct as number, total: done.total as number };
    } else {
      recovered = true;
    }
  } else if (value.remedialDone !== null && value.remedialDone !== undefined) {
    recovered = true;
  }

  let remedialDraft: DrillDraft | null = null;
  if (value.remedialDraft !== null && value.remedialDraft !== undefined) {
    const parsed = parseDrillDraftValue(value.remedialDraft);
    if (parsed && remedial && parsed.items.length === remedial.length &&
      parsed.items.every((item, position) => item.key === remedial[position].key)) {
      remedialDraft = parsed;
    } else {
      recovered = true;
    }
  }

  let remedialSessionId: string | null = null;
  if (typeof value.remedialSessionId === "string" && value.remedialSessionId.length > 0) {
    remedialSessionId = value.remedialSessionId;
  } else if (value.remedialSessionId !== null && value.remedialSessionId !== undefined) {
    recovered = true;
  }

  return {
    value: {
      unitNo: value.unitNo as number,
      items,
      answers,
      index,
      correct,
      correctCount,
      result,
      saved,
      remedial,
      remedialDone,
      remedialDraft,
      remedialSessionId,
    },
    invalid: false,
    recovered,
  };
}

// Draft jawaban boleh datang dari format lama yang terbungkus envelope sesi
// ({version,key,sessionId,revision,data}). Hanya buka satu tingkat bila data
// dalamnya lolos validator draft yang sama.
export function parseStoredAttemptDraft(raw: string | null): ParseOutcome<DrillDraft> {
  if (raw === null) return { value: null, invalid: false, recovered: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return invalid("draft bukan JSON");
  }
  const direct = parseDrillDraftValue(parsed);
  if (direct) return { value: direct, invalid: false, recovered: false };
  if (object(parsed) && parsed.data !== undefined) {
    const inner = parseDrillDraftValue(parsed.data);
    if (inner) {
      const sessionId = typeof parsed.sessionId === "string" && parsed.sessionId.length > 0
        ? parsed.sessionId
        : inner.sessionId;
      return {
        value: sessionId ? { ...inner, sessionId } : inner,
        invalid: false,
        recovered: true,
      };
    }
  }
  return invalid("draft tidak memiliki items/posisi yang sah");
}
