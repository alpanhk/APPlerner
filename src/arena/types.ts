// ===== Tipe bersama Lernen =====

export type CharId = "player" | "tutor" | "mia" | "pos" | "tetangga" | "penjual-pasar" | "penjual-mandiri-ch02" | "barista" | "penjual-pakaian" | "kasir" | "tamu-kota";
export type SpeakerId = CharId | "narator";
export type Expression = "neutral" | "smile" | "question" | "think";
export type Side = "left" | "right" | "center";
export type BgId = string;
export type OverlayId = "note" | "envelope" | "letter" | null;
export type SfxId = "knock" | "hinge" | "bell" | "paper" | "tram";
export type HairStyle = "short" | "bob" | "long" | "curly";

export interface StageChar {
  id: CharId;
  side: Side;
  expr?: Expression;
  prop?: "envelope";
}

export interface StagePatch {
  bg?: BgId;
  chars?: StageChar[];
  overlay?: OverlayId;
  ambience?: "rumah" | "jalan" | "none";
}

export interface StageState {
  bg: BgId;
  chars: StageChar[];
  overlay: OverlayId;
  ambience: "rumah" | "jalan" | "none";
}

// ----- Kurikulum / tujuan -----
export type ObjectiveId =
  | "greet"
  | "introduce"
  | "numbers"
  | "time"
  | "price"
  | "job"
  | "habit"
  | "travel"
  | "plans"
  | "a1-u1-o3"
  | "a1-u1-o4"
  | "a1-u1-o5"
  | "a1-u11-o1"
  | "a1-u11-o2"
  | "a1-u11-o3"
  | "a1-u11-o4"
  | "a1-u11-o5"
  | "a1-u12-o1"
  | "a1-u12-o2"
  | "a1-u12-o3"
  | "a1-u12-o4"
  | "a1-u12-o5";
export type Skill = "hoeren" | "lesen" | "schreiben" | "sprechen";
export type ResultLevel = "belum" | "petunjuk" | "mandiri";

export interface Attempt {
  objective: ObjectiveId;
  where: string; // tutor | mia | tetangga | pos | stasiun | ...
  text: string;
  hintsUsed: number;
  full: boolean; // kalimat perkenalan lengkap (bukan nama saja)
  at: number;
  skill?: Skill;
  mode?: "choice" | "text" | "speech";
  support?: "none" | "hint" | "transcript" | "example" | "text-fallback";
  reviewStatus?: "auto" | "pending-review";
  stimulusId?: string;
}

// ----- Cerita -----
export type Intent =
  | "empty"
  | "greet"
  | "intro_full"
  | "intro_other"
  | "name_only"
  | "ja"
  | "nein"
  | "unknown";

export type Flags = Record<string, boolean>;

interface NodeBase {
  id: string;
  stage?: StagePatch;
  sfx?: SfxId;
  setFlags?: Flags;
}

export interface LineNode extends NodeBase {
  kind: "line";
  speaker: SpeakerId;
  text: string;
  lang: "de" | "id";
  translation?: string;
  audio?: string; // id aset di manifest; jika kosong & lang de → TTS
  next: string;
}

export interface ChoiceOption {
  label: string;
  next: string;
  hideIf?: (flags: Flags) => boolean;
  setFlags?: Flags;
  resetHints?: string;
  sfx?: SfxId;
}

export interface ChoiceNode extends NodeBase {
  kind: "choice";
  prompt?: string;
  options: ChoiceOption[];
}

export interface InputHandler {
  intents: Intent[];
  next: string;
  record?: {
    objective: ObjectiveId;
    full: boolean;
    skill?: Skill;
    mode?: "choice" | "text" | "speech";
    support?: "none" | "hint" | "transcript" | "example" | "text-fallback";
    reviewStatus?: "auto" | "pending-review";
    stimulusId?: string;
  };
  setFlags?: Flags;
  when?: (ctx: StoryContext) => boolean;
}

export interface InputNode extends NodeBase {
  kind: "input";
  speaker: SpeakerId; // siapa yang bertanya
  where: string; // kelompok encounter untuk hitung petunjuk
  prompt: string;
  chips: string[]; // kata untuk menyusun jawaban
  hints: string[]; // petunjuk bertahap (makna → awal kalimat → contoh lengkap)
  handlers: InputHandler[];
  unknownHint?: string;
  invalidHint?: string;
  validate?: (text: string, ctx: StoryContext) => boolean;
  skip?: { label: string; next: string }; // keluar dari giliran tanpa menjawab (encounter opsional)
}

export interface BranchNode extends NodeBase {
  kind: "branch";
  pick: (ctx: StoryContext) => string;
}

export interface EndNode extends NodeBase {
  kind: "end";
}

export type StoryNode = LineNode | ChoiceNode | InputNode | BranchNode | EndNode;

export interface StoryContext {
  flags: Flags;
  name: string;
  hintCounts: Record<string, number>;
}

// ----- Pemain & progres -----
export interface PlayerProfile {
  portrait?: string;
  name: string;
  hair: HairStyle;
  hairColor: string;
  outfit: string;
  skin: string;
}

export interface HistoryItem {
  speaker: SpeakerId | "player";
  text: string;
  lang: "de" | "id";
  translation?: string;
  audio?: string;
  isPlayer?: boolean;
}

export interface Settings {
  textSize: "normal" | "besar" | "sangat-besar";
  soundOn: boolean;
  volDialog: number;
  volMusic: number;
  volAmbience: number;
  volSfx: number;
  reducedMotion: boolean;
}

export interface Progress {
  version: number;
  player: PlayerProfile;
  nodeId: string;
  stage: StageState;
  flags: Flags;
  hintCounts: Record<string, number>;
  attempts: Attempt[];
  history: HistoryItem[];
  prologCompleted: boolean;
  updatedAt: number;
}
