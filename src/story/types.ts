// ===== Tipe bersama Lernen =====
// Satu model cerita untuk SEMUA bab: prolog dan Bab 1–12 memakai node yang sama.

export type Lang = "de" | "id";
export type Expr = "neutral" | "smile" | "question" | "think";
export type Sfx = "knock" | "door" | "bell" | "paper" | "tram" | "ring";
export type Flags = Record<string, boolean>;

/** Lima langkah Pola Prolog. Setiap node tahu ia berada di langkah mana. */
export type Beat = 1 | 2 | 3 | 4 | 5;
export type BeatKind = "opening" | "lesson" | "encounter" | "hub" | "payoff";

export interface Overlay {
  kind: "note" | "letter" | "envelope" | "sign" | "ticket" | "phone";
  text: string;
  sub?: string;
}

export interface StageChar {
  id: string;
  side: "left" | "right";
  expr?: Expr;
}

export interface StageState {
  bg: string;
  chars: StageChar[];
}

interface Base {
  id: string;
  beat: Beat;
  stage?: Partial<StageState>;
  sfx?: Sfx;
  setFlags?: Flags;
}

export interface LineNode extends Base {
  kind: "line";
  speaker: string; // id pemeran | "narator"
  lang: Lang;
  text: string;
  tr?: string;
  keep?: boolean; // masuk buku catatan
  overlay?: Overlay;
  next: string;
}

export interface ChoiceOption {
  label: string;
  next: string;
  show?: (f: Flags) => boolean;
  setFlags?: Flags;
  resetHints?: string;
  sfx?: Sfx;
}

export interface ChoiceNode extends Base {
  kind: "choice";
  prompt?: string;
  options: ChoiceOption[];
}

export interface Rule {
  when: string[]; // pola jawaban, lihat match.ts
  next: string;
  record?: { full: boolean };
  setFlags?: Flags;
}

export interface InputNode extends Base {
  kind: "input";
  speaker: string;
  where: string; // kunci pertemuan, untuk hitungan petunjuk
  guided: boolean; // true = latihan bersama tutor (tidak dihitung bukti mandiri)
  objective: string;
  prompt: string;
  chips: string[];
  hints: string[]; // selalu 3 tingkat: makna → awal kalimat → contoh lengkap
  model: string;
  rules: Rule[];
  miss: string;
  skip?: { label: string; next: string; hint?: boolean };
}

export interface EndNode extends Base {
  kind: "end";
}

export type StoryNode = LineNode | ChoiceNode | InputNode | EndNode;

export interface Objective {
  id: string;
  title: string;
  phrase: string;
}

export interface OutlineItem {
  kind: BeatKind;
  beat: Beat;
  label: string;
  objs: string[];
  reviewObjs?: string[];
}

export interface Chapter {
  id: string;
  no: number; // 0 = prolog
  unit: number;
  title: string;
  tagline: string;
  cover: string;
  place: string;
  objectives: Objective[];
  next: string; // ajakan langkah berikutnya di layar hasil
  start: string;
  nodes: Record<string, StoryNode>;
  outline: OutlineItem[];
}

export interface Attempt {
  objective: string;
  chapterId: string;
  who: string;
  text: string;
  hintsUsed: number;
  full: boolean;
  guided: boolean;
}

export interface HistoryItem {
  speaker: string;
  text: string;
  lang: Lang;
  tr?: string;
}

export interface Game {
  chapterId: string;
  nodeId: string;
  stage: StageState;
  overlay: Overlay | null;
  flags: Flags;
  hintCounts: Record<string, number>; // per pertemuan
  hintLevels: Record<string, number>; // per giliran
  fails: Record<string, number>;
  history: HistoryItem[];
  notes: string[]; // id node kalimat contoh yang sudah didengar
  visit: number;
  done: boolean;
}
