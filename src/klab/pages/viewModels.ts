// Shared view models for KLAB pages (Agent 4a). All fields are data supplied by
// the controller (1a); pages never compute progress, scores or rewards.
import type { Preferences, SaveState } from '../contracts';

export type LoadState = 'loading' | 'ready' | 'failed';

export type AgendaCardData = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  actionLabel?: string;
  image?: string;
  ribbon?: string;
  done?: number;
  total?: number;
};

export type QuickLinkData = {
  id: string;
  label: string;
  icon?: 'today' | 'explore' | 'notes' | 'profile' | 'book' | 'play';
  meta?: string;
};

export type LevelCodeView = 'A1' | 'A2' | 'B1' | 'B2';

export type UnitItemData = {
  unitNo: number;
  title: string;
  meta?: string;
  /** Level eksplisit. Bila kosong, halaman membacanya dari meta untuk kompatibilitas. */
  level?: LevelCodeView;
  status: 'locked' | 'available' | 'active' | 'done';
};

export type BookItemData = {
  id: string;
  title: string;
  meta?: string;
  label?: string;
  image?: string;
  /** Kalimat pembuka asli dari teks. Dipakai BookPreview; fallback hanya bila tidak ada. */
  lead?: string;
  level?: LevelCodeView;
};

export type VocabularyItemData = {
  id?: string;
  word: string;
  translation: string;
  due?: number;
  level?: LevelCodeView;
};

export type PracticeLinkData = {
  id: string;
  label: string;
  meta?: string;
};

export type NoteItemData = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  color?: 'yellow' | 'blue' | 'red' | null;
  sourceLabel?: string;
  orphaned?: boolean;
};

export type StatsNextStep = {
  id: string;
  label: string;
  detail: string;
  unitNo?: number;
  section?: string;
};

export type StatsSummary = {
  cardsReviewed?: number;
  streakDays?: number;
  lessonsCompleted?: number;
  wordsKnown?: number;
  note?: string;
  /** Tindakan dari data aplikasi (1a); dirender apa adanya, bukan klaim kemampuan. */
  nextSteps?: StatsNextStep[];
};

export type PreferencesView = Omit<Preferences, 'version'>;

export type NoteDraft = { title: string; body: string; saveState: SaveState };

export type ExploreSection = 'materials' | 'vocabulary' | 'reading' | 'practice';
export type ProfileSection = 'overview' | 'stats' | 'settings' | 'recordings' | 'recovery' | 'legacy-tools';
