import type { CheckpointGrade } from '../lessons/checkpointResult';
import type { DrillItem } from '../drills/items';

// Boundary contracts only. Native/database adapters belong to the backend owners.
export type Failure = {
  code: 'not-ready' | 'invalid' | 'not-found' | 'conflict' | 'storage-full' |
        'save-failed' | 'unsupported' | 'permission-denied' | 'audio-missing' | 'interrupted';
  message: string;
  retryable: boolean;
};
export type Result<T> = { ok: true; value: T } | { ok: false; error: Failure };
export type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'failed';
export type Preferences = {
  version: 1;
  theme: 'system' | 'light' | 'dark';
  learningMode: 'ordered' | 'free';
  textScale: 1 | 1.125 | 1.25;
  reducedMotion: 'system' | 'on';
  reactions: boolean;
  reactionSound: boolean;
  reactionVolume: number;
  quietMode: boolean;
  onboardingCompleted: boolean;
};
export interface PreferencesRepository {
  load(): Promise<Result<Preferences>>;
  patch(change: Partial<Omit<Preferences, 'version'>>): Promise<Result<Preferences>>;
}
export type SourceRef =
  | { kind: 'lesson'; unitNo: number; lessonNo: number; blockId: string }
  | { kind: 'reading'; textId: number; blockId: string };
export type Anchor = {
  source: SourceRef; contentVersion: string;
  quote: string; prefix: string; suffix: string; start: number; end: number;
};
export type Note = {
  id: string; revision: number; title: string; body: string;
  anchor: Anchor | null; color: 'yellow' | 'blue' | 'red' | null; updatedAt: string;
};
export interface NotesRepository {
  list(source?: SourceRef): Promise<Result<Note[]>>;
  save(note: Note, expectedRevision: number): Promise<Result<Note>>;
  remove(id: string, expectedRevision: number): Promise<Result<void>>;
}
export type QuizSession = {
  version: 1; id: string; kind: 'checkpoint' | 'remedial' | 'drill'; revision: number;
  contentKey: string; contentVersion: string; roundId: string | null;
  status: 'active' | 'paused' | 'completed'; items: DrillItem[]; index: number;
  answers: Array<{ itemKey: string; chosen: string; correct: boolean }>;
  optionOrders: Record<string, string[]>; seenKeys: string[];
};
export interface QuizSessions {
  load(id: string): Promise<Result<QuizSession>>;
  create(session: QuizSession): Promise<Result<QuizSession>>;
  answer(id: string, expectedRevision: number, itemKey: string, chosen: string): Promise<Result<QuizSession>>;
  advance(id: string, expectedRevision: number): Promise<Result<QuizSession>>;
  pause(id: string, expectedRevision: number): Promise<Result<QuizSession>>;
}
export type CompletionReceipt = {
  sessionId: string; roundId: string | null; stored: true; passed: boolean;
  firstPassInRound: boolean; countedPasses: number; legacyEverPassed: boolean; awardedXp: number;
};
export interface UnitRounds {
  begin(unitNo: number, operationId: string): Promise<Result<{ roundId: string }>>;
  complete(sessionId: string, grade: CheckpointGrade, operationId: string): Promise<Result<CompletionReceipt>>;
}
export type AudioRequest =
  | { role: 'lesson' | 'reaction'; text: string; rate?: number }
  | { role: 'recording'; recordingId: string };
export interface AudioService {
  capability(text: string): 'bundle' | 'piper' | 'missing';
  play(request: AudioRequest): Promise<Result<{ source: 'bundle' | 'piper' | 'recording' }>>;
  stop(): void;
  release(): Promise<void>;
}
export type RecordingState = 'idle' | 'requesting' | 'recording' | 'preview' | 'saving' | 'saved' | 'error';
export type RecordingPreview = { id: string; mime: string; durationMs: number; bytes: number };
export interface Recorder {
  start(): Promise<Result<void>>;
  stop(): Promise<Result<RecordingPreview>>;
  save(id: string, source: SourceRef | null): Promise<Result<{ id: string }>>;
  discard(id: string): Promise<Result<void>>;
  dispose(): Promise<void>;
}
export interface BackendPorts {
  preferences: PreferencesRepository;
  notes: NotesRepository;
  quizzes: QuizSessions;
  rounds: UnitRounds;
  audio: AudioService;
  recorder: Recorder;
}
