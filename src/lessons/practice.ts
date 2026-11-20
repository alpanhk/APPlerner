import type { DrillItem } from "../drills/items";
import type { Lesson } from "./units";
import practiceRaw from "../data/lessons/a1_lesson_practice.json";
import { makeAttemptSeed, mulberry32, shuffleChoiceOptions, shuffleWith, type Rng } from "./optionOrder";

type LessonPracticeItem = {
  id: string;
  unit: number;
  lesson: number;
  objectiveId: string;
  code: DrillItem["code"];
  mode: "choice" | "type" | "order";
  prompt: string;
  sub: string;
  options?: string[];
  tokens?: string[];
  answer: string;
  altAnswers?: string[];
  wrongFeedback?: Record<string, string>;
  hintOnWrong?: string;
  explanation: string;
};

const LESSON_PRACTICE = (practiceRaw as { items: LessonPracticeItem[] }).items;

// Check comprehension of the lesson examples. This is not a grammar exam.
// Opsi diacak per percobaan; kunci dan key tidak berubah sehingga draft
// sesi yang tersimpan tetap memakai urutan yang sama saat resume.
export function lessonExamples(lesson: Lesson, rng: Rng = mulberry32(makeAttemptSeed())): DrillItem[] {
  const examples = lesson.slides.filter((s) => s.example_de?.trim() && s.example_id?.trim());
  const uniqueMeanings = [...new Set(examples.map((s) => s.example_id!.trim()))];
  if (uniqueMeanings.length < 2) return [];
  return examples.map((slide, index) => {
    const answer = slide.example_id!.trim();
    const distractors = shuffleWith(
      uniqueMeanings.filter((meaning) => meaning !== answer),
      rng,
    ).slice(0, 3);
    const item: DrillItem = {
      code: lesson.drill.code,
      lessonExample: true,
      key: `lesson-example:${lesson.title}:${index}:${slide.example_de}`,
      prompt: slide.example_de!.trim(),
      sub: `Pilih arti contoh dari materi “${slide.title}”.`,
      mode: "choice" as const,
      options: [answer, ...distractors],
      answer,
      explanation: `Terjemahan contoh: ${answer}`,
    };
    return shuffleChoiceOptions(item, rng);
  });
}

// Latihan penerapan untuk pelajaran yang tidak punya drill kosakata D1-D3.
// Soal berasal dari a1_lesson_practice.json (bukan salinan contoh slide),
// terhubung ke tujuan unit, dan opsinya diacak per percobaan.
export function lessonApplicationItems(
  unitNo: number,
  lessonNo: number,
  rng: Rng = mulberry32(makeAttemptSeed()),
): DrillItem[] {
  return LESSON_PRACTICE.filter((item) => item.unit === unitNo && item.lesson === lessonNo).map((item) => {
    let tokens = item.tokens ? shuffleWith(item.tokens, rng) : undefined;
    if (tokens && tokens.join(" ") === item.answer) tokens = [...tokens.slice(1), tokens[0]];
    const base: DrillItem = {
      code: item.code,
      lessonApplication: true,
      objectiveId: item.objectiveId,
      key: `A1LP:${unitNo}:${lessonNo}:${item.id}`,
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
    return shuffleChoiceOptions(base, rng);
  });
}

// Titik masuk untuk LessonRunner: pakai latihan penerapan bila tersedia,
// jika tidak jatuh ke pemahaman contoh (perilaku lama).
export function lessonPracticeItems(
  unitNo: number,
  lesson: Lesson,
  rng: Rng = mulberry32(makeAttemptSeed()),
): DrillItem[] {
  const application = lessonApplicationItems(unitNo, lesson.no, rng);
  return application.length > 0 ? application : lessonExamples(lesson, rng);
}
