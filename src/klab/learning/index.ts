// Titik masuk komponen alur belajar KLAB untuk integrasi runner (1a).
export { LessonFlow } from './LessonFlow';
export { CafeDialog } from './CafeDialog';
export { StoryFlow } from './StoryFlow';
export { StoryView } from './StoryView';
export type { StoryFlowProps, StoryPanel, NovelStore, NovelProgress } from './StoryFlow';
export { CafeConversation } from './CafeConversation';
export { CafeScene } from './CafeScene';
export type { LessonFlowProps, LessonProgress } from './LessonFlow';
export { CheckpointFlow } from './CheckpointFlow';
export type { CheckpointFlowProps, CheckpointResult } from './CheckpointFlow';
export { ReadingFlow } from './ReadingFlow';
export type { ReadingFlowProps } from './ReadingFlow';
export {
  applyLessonAnswer,
  backTarget,
  allLessons,
  allReadings,
  allUnits,
  audioCoverage,
  ambienceDecision,
  audioMatch,
  buildFallbackCheckpoint,
  CAFE_CORRECTION,
  CAFE_DIALOG,
  CAFE_LAYERS,
  cafeDialogPlan,
  buildLevelCheckpoint,
  buildSimilarPractice,
  clipFor,
  correctionClipFor,
  dialogAvailability,
  cupCueDecision,
  exampleSlideFor,
  exerciseLineView,
  fullscreenDecision,
  generatePractice,
  getLesson,
  grammarGlossaryFor,
  highlightParts,
  getReading,
  gradePractice,
  isLessonComplete,
  lessonAudioPlan,
  lessonScore,
  normalizeSpeech,
  practiceItems,
  readingAudioPlan,
  readingByTitle,
  reasonLines,
  removeLessonAnswer,
  shouldHydrateFromProps,
  similarItemAvailable,
  summaryAnswers,
  translationLabel,
  transferCoverage,
} from './logic';
export { newGame, nodeOf, transition, INITIAL_STAGE } from './story/engine';
export { detectIntents, fillTemplate, resolveInputHandler, normalize as normalizeAnswer } from './story/matchers';
export { objectiveLevel, demonstratedFullSentence, buildSummary, LEVEL_LABEL } from './story/evaluate';
export { PROLOG_START, PROLOG_META, PROLOG_NODES } from './story/prolog';
export { loadOptIn, saveOptIn, soundController, soundPriority } from './soundController';
export type {
  AudioMatch,
  CafeSpeaker,
  LessonAnswer,
  CheckpointPlan,
  ExerciseLineView,
  LessonView,
  PracticeItem,
  ReadingSentence,
  ReadingView,
} from './logic';
export type { SoundRoute, SoundState, SoundController, SpeakingStatus } from './soundController';
