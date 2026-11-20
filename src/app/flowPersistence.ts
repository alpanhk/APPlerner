// Jembatan callback alur belajar 2a -> penyimpanan produksi nyata.
// Tidak menulis skor/verdict fiktif; hasil yang tidak tersedia dari kontrak 2a
// tidak direkam sebagai attempt.
import getDb, { nowIso } from "../stores/db";
import { loadDraftRaw, saveDraft } from "../lessons/persistence";
import { getUnit } from "../lessons/units";
import { ensureCards } from "../srs/cards";
import { saveCheckpointResult } from "../lessons/checkpointStore";
import { CHECKPOINT_LESSON_NO } from "../lessons/units";
import { objectivesOfUnit } from "../lessons/objectives";
import type { CheckpointGrade } from "../lessons/checkpointResult";
import type { LessonProgress, CheckpointResult } from "../klab/learning";

// Satu jawaban final per soal: bila peserta mengulang soal yang sama, jawaban
// terakhir yang menang. Tanpa dedup, skor bisa dihitung dari jawaban usang.
export function dedupeAnswers(answers: LessonProgress["answers"]): LessonProgress["answers"] {
  const byId = new Map<string, LessonProgress["answers"][number]>();
  for (const answer of answers) byId.set(answer.id, answer);
  return [...byId.values()];
}

export type EnqueuedWord = {
  itemKey: string;
  objectiveId: string | null;
  entryId: number;
  cardTypes: string[];
};

// PRD:382 — kosakata baru 8-10 kata dicatat sebagai kartu baru di SRS saat
// pelajaran selesai. Kata hanya diambil dari entri nyata (seed/suntingan pengguna);
// tidak ada entri/arti fiktif yang dibuat di sini.
export async function enqueueLessonVocab(unitNo: number, lessonNo: number): Promise<EnqueuedWord[]> {
  const unit = getUnit(unitNo);
  const lesson = unit?.lessons.find((item) => item.no === lessonNo);
  if (!unit || !lesson || !lesson.vocab.length) return [];
  const objective = objectivesOfUnit(unitNo).find((entry) => entry.lessonNos.includes(lessonNo));
  const objectiveId = objective?.id ?? null;
  const db = await getDb();
  const words: EnqueuedWord[] = [];
  for (const de of lesson.vocab) {
    const rows = await db.select<{ id: number }[]>("SELECT id FROM entries WHERE de = $1", [de]);
    if (!rows.length) continue; // kata belum ada di data nyata -> jangan mengarang
    words.push({
      itemKey: `A1:U${unitNo}:L${lessonNo}:${de}`,
      objectiveId,
      entryId: rows[0].id,
      cardTypes: [],
    });
  }
  if (!words.length) return [];
  await ensureCards(db);
  for (const word of words) {
    const cards = await db.select<{ type: string }[]>(
      "SELECT type FROM cards WHERE entry_id = $1 ORDER BY type", [word.entryId],
    );
    word.cardTypes = cards.map((card) => card.type);
  }
  // Metadata jejak: memberi item_key/objectiveId yang dapat diaudit tanpa
  // menulis attempt/review palsu. Upsert membuat Selesai berulang idempoten.
  await db.execute(
    "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [`klab_lesson_enqueue:${unitNo}:${lessonNo}`, JSON.stringify({
      version: 1, unitNo, lessonNo, objectiveId, words, at: nowIso(),
    })],
  );
  return words;
}

export type LessonFlowState = {
  answers: LessonProgress["answers"];
  step: number;
  // Posisi latihan disimpan bila 2a menyertakannya di progress; field opsional
  // agar kontrak LessonProgress lama tetap kompatibel.
  stage?: "lesson" | "order" | "payment";
  exerciseIndex?: number;
  score: number | null;
  state: string | null;
};

type StoredLessonProgress = LessonProgress & {
  stage?: LessonFlowState["stage"];
  exerciseIndex?: number;
};

export async function saveLessonFlowProgress(progress: LessonProgress, finished: boolean): Promise<void> {
  const key = `lernen_lesson_${progress.unitNo}_${progress.lessonNo}`;
  const answers = dedupeAnswers(progress.answers ?? []);
  const stored = progress as StoredLessonProgress;
  await saveDraft(key, {
    step: Math.max(0, progress.page),
    stage: stored.stage,
    exerciseIndex: stored.exerciseIndex,
    slide: 0,
    drillScore: null,
    answers,
    klab: true,
    updatedAt: nowIso(),
  });
  if (!finished) return;
  const correct = answers.filter((answer) => answer.correct).length;
  const score = answers.length ? Math.round((correct / answers.length) * 100) : 100;
  const db = await getDb();
  await db.execute(
    "INSERT INTO lesson_progress (unit_no,lesson_no,state,score,finished_at) VALUES ($1,$2,'done',$3,$4) " +
      "ON CONFLICT(unit_no,lesson_no) DO UPDATE SET state='done', score=excluded.score, finished_at=excluded.finished_at",
    [progress.unitNo, progress.lessonNo, score, nowIso()],
  );
  await enqueueLessonVocab(progress.unitNo, progress.lessonNo);
}

// Baca ulang dari SQLite setelah restart. Kedua jawaban dan skor harus bisa
// dibuktikan berasal dari penyimpanan, bukan dari state React yang masih hidup.
export async function loadLessonFlowState(unitNo: number, lessonNo: number): Promise<LessonFlowState | null> {
  const key = `lernen_lesson_${unitNo}_${lessonNo}`;
  const [raw, db] = await Promise.all([loadDraftRaw(key), getDb()]);
  const rows = await db.select<{ state: string; score: number | null }[]>(
    "SELECT state,score FROM lesson_progress WHERE unit_no = $1 AND lesson_no = $2",
    [unitNo, lessonNo],
  );
  const progress = rows.length ? rows[0] : null;
  if (raw === null && !progress) return null;
  let answers: LessonProgress["answers"] = [];
  let step = 0;
  let stage: LessonFlowState["stage"];
  let exerciseIndex: number | undefined;
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      step = Number.isInteger(parsed.step) ? Math.max(0, parsed.step as number) : 0;
      if (parsed.stage === "lesson" || parsed.stage === "order" || parsed.stage === "payment") {
        stage = parsed.stage;
      }
      if (stage === "payment" && Number.isInteger(parsed.exerciseIndex) &&
        (parsed.exerciseIndex as number) > 0) {
        exerciseIndex = parsed.exerciseIndex as number;
      }
      if (Array.isArray(parsed.answers)) {
        answers = dedupeAnswers(parsed.answers.filter((answer) =>
          Boolean(answer) && typeof answer === "object" &&
          typeof (answer as { id?: unknown }).id === "string" &&
          typeof (answer as { picked?: unknown }).picked === "string" &&
          typeof (answer as { correct?: unknown }).correct === "boolean",
        ) as LessonProgress["answers"]);
      }
    } catch { /* draft rusak -> abaikan, progres tetap dibaca */ }
  }
  return {
    answers,
    step,
    stage,
    exerciseIndex,
    score: progress?.score ?? null,
    state: progress?.state ?? null,
  };
}

export async function saveCheckpointFlowResult(result: CheckpointResult): Promise<void> {
  const catalogue = objectivesOfUnit(result.unitNo);
  const objectiveResults = result.perObjective.map((per) => {
    const known = catalogue.find((objective) => objective.id === per.id);
    const objective = known ?? {
      id: per.id, unit: result.unitNo, title: per.id, canDo: per.id,
      lessonNos: [], prerequisites: [], coverage: "partial",
      review: "not-reviewed", evidence: [], remedy: "Pelajari materi tujuan ini.",
    };
    return { objective, correct: per.correct, total: per.total, pass: per.pass, missed: [] };
  });
  const total = result.perObjective.reduce((sum, per) => sum + per.total, 0);
  const correct = result.perObjective.reduce((sum, per) => sum + per.correct, 0);
  const grade: CheckpointGrade = {
    correct,
    total,
    score: result.score,
    pass: result.pass,
    objectiveResults,
  };
  await saveCheckpointResult(result.unitNo, CHECKPOINT_LESSON_NO, grade, nowIso());
}

export function initialLessonPage(answers: unknown): number {
  return Array.isArray(answers) && answers.length > 0 ? 0 : 0;
}
