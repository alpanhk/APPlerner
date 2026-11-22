// Pembungkus ts-fsrs: konversi kartu FSRS ↔ baris tabel `srs_state` + grading.
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";

const scheduler = fsrs(generatorParameters());

export const DAY_MS = 86_400_000;

export const GRADES = [
  { rating: Rating.Again, key: "again", label: "Lupa" },
  { rating: Rating.Hard, key: "hard", label: "Sulit" },
  { rating: Rating.Good, key: "good", label: "Baik" },
  { rating: Rating.Easy, key: "easy", label: "Mudah" },
] as const;

export type GradeKey = (typeof GRADES)[number]["key"];

export const RATING_BY_KEY: Record<GradeKey, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export const GRADE_LABEL: Record<number, string> = {
  [Rating.Again]: "Lupa",
  [Rating.Hard]: "Sulit",
  [Rating.Good]: "Baik",
  [Rating.Easy]: "Mudah",
};

const STATE_TO_DB: Record<State, string> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const DB_TO_STATE: Record<string, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

// Baris srs_state (schema v2).
export type SrsRow = {
  card_id: number;
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  last_grade: string | null;
  state: string;
  last_review: string | null;
};

// Rekonstruksi Card dari baris DB tanpa kolom elapsed/scheduled_days —
// disimpulkan dari last_review ↔ due / sekarang.
export function rowToCard(row: SrsRow): Card {
  const last = row.last_review ? new Date(row.last_review) : null;
  const due = new Date(row.due);
  const now = new Date();
  const elapsed = last ? Math.max(0, Math.round((now.getTime() - last.getTime()) / DAY_MS)) : 0;
  const scheduled = last ? Math.max(0, Math.round((due.getTime() - last.getTime()) / DAY_MS)) : 0;
  return {
    due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: elapsed,
    scheduled_days: scheduled,
    reps: row.reps,
    lapses: row.lapses,
    state: DB_TO_STATE[row.state] ?? State.New,
    last_review: last ?? undefined,
    learning_steps: 0,
  };
}

export function cardToRow(card_id: number, card: Card, gradeKey: GradeKey | null): SrsRow {
  return {
    card_id,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    last_grade: gradeKey,
    state: STATE_TO_DB[card.state],
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

// Hasil grading: Card berikutnya + log untuk DB.
export type ReviewResult = {
  next: Card;
  correct: boolean;
};

export function nextCard(card: Card | null, gradeKey: GradeKey, now = new Date()): ReviewResult {
  const base: Card = card ?? (createEmptyCard(now) as Card);
  const out = scheduler.next(base, now, RATING_BY_KEY[gradeKey] as Grade);
  return { next: out.card, correct: gradeKey !== "again" };
}

// Dampak terhadap due jauhnya interval (hari utuh) — untuk teks tombol.
export function intervalDays(card: Card, now = new Date()): number {
  const diff = card.due.getTime() - now.getTime();
  return Math.max(0, diff) / DAY_MS;
}

export function previewInterval(card: Card | null, gradeKey: GradeKey, now = new Date()): string {
  const { next } = nextCard(card, gradeKey, now);
  const days = intervalDays(next, now);
  if (next.state === State.Learning || next.state === State.Relearning) {
    return "menit";
  }
  if (days <= 1) return "besok";
  return `${Math.round(days)} hari`;
}
