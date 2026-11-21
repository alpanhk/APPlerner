// ===== Tipe bersama Lernen =====
// KONTRAK 4a/2a: Game juga diekspor dari sini (definisi asal ada di engine/story).
export type { Game } from "./engine/story";

export type CharId =
  | "player"
  | "tutor"
  | "mia"
  | "pos"
  | "tetangga"
  | "petugas-stasiun"
  | "eva"
  | "pendatang-baru";
export type SpeakerId = CharId | "narator" | "pengumuman";
export type Expression = "neutral" | "smile" | "question" | "think";
export type Side = "left" | "right" | "center";
export type BgId =
  | "kamar"
  | "jendela"
  | "pintu"
  | "jalan"
  | "judul"
  | "ruang-warga"
  | "peron"
  | "stasiun"
  | "ambang-rumah";
export type OverlayId = "note" | "envelope" | "letter" | "ticket" | "board" | "calendar" | "postcard" | null;
export type SfxId = "knock" | "hinge" | "bell" | "paper" | "tram" | "peron-chime" | "telepon" | "kertas";
export type HairStyle = "short" | "bob" | "long" | "curly";

// ----- Papan keberangkatan & tiket (Bab 11) -----
export interface BoardState {
  ziel: string;
  gleis: string;
  abfahrt: string;
  verspaetung: string;
  /** false = papan masih memakai data lama; angka baru belum boleh bocor (U05). */
  fresh: boolean;
}
export interface TicketState {
  ziel: string;
  abfahrt: string;
  ankunft: string;
  gleis: string;
}
/** Kalender Bab 12: hari sibuk vs bebas, dan hasil kesepakatan bila ada. */
export interface CalendarState {
  busy: string;
  free: string;
  agreed?: string;
}

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
  board?: BoardState;
  ticket?: TicketState;
  calendar?: CalendarState;
}

export interface StageState {
  bg: BgId;
  chars: StageChar[];
  overlay: OverlayId;
  ambience: "rumah" | "jalan" | "none";
  board?: BoardState;
  ticket?: TicketState;
  calendar?: CalendarState;
}

// ----- Kurikulum / tujuan -----
export type ObjectiveId =
  | "greet"
  | "introduce"
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
export type ResultLevel = "belum" | "petunjuk" | "mandiri";

/** Bagaimana percobaan dilakukan (pemisahan bukti jurnal, Mandat §1.5). */
export type AttemptMode = "cerita" | "latihan" | "simulasi";
/** Keterampilan yang dilatih pada percobaan. */
export type SkillId = "hoeren" | "lesen" | "schreiben" | "sprechen" | "umum";

export interface Attempt {
  objective: ObjectiveId;
  where: string; // tutor | mia | tetangga | pos | petugas-stasiun | eva | ...
  text: string;
  hintsUsed: number;
  full: boolean; // kalimat perkenalan lengkap (bukan nama saja)
  at: number;
  /** Jalur percobaan; percobaan prolog lama dibaca sebagai "cerita". */
  mode?: AttemptMode;
  /** Keterampilan; percobaan lama dibaca sebagai "umum". */
  skill?: SkillId;
  /** Dijawab lewat rekaman lisan (bukan mengetik). */
  spoken?: boolean;
  /** Rekaman lisan tanpa penilai teruji ditandai menunggu telaah. */
  reviewStatus?: "menunggu-telaah";
  /** Transkrip dibuka saat tugas menyimak — bukti menjadi dibaca, bukan menyimak. */
  transcriptUsed?: boolean;
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
  /**
   * Ujaran yang benar-benar dibunyikan bila berbeda dari teks yang ditampilkan.
   * Dipakai untuk tugas menyimak: panel menampilkan deskripsi netral (teks),
   * audio membunyikan kalimat Jerman (spokenText) supaya peron baru tidak
   * bocor lewat teks dialog (Mandat §6.B / U05). Riwayat menyimpan spokenText.
   */
  spokenText?: string;
  next: string;
}

export interface ChoiceOption {
  label: string;
  next: string;
  hideIf?: (flags: Flags) => boolean;
  setFlags?: Flags;
  resetHints?: string;
  sfx?: SfxId;
  /** Bukti tujuan bila pilihan ini adalah jawaban tugas (U05: hasil pertama tersimpan). */
  record?: { objective: ObjectiveId; full: boolean };
}

export interface ChoiceNode extends NodeBase {
  kind: "choice";
  prompt?: string;
  options: ChoiceOption[];
}

export interface InputHandler {
  intents: Intent[];
  next: string;
  record?: { objective: ObjectiveId; full: boolean };
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
  skip?: { label: string; next: string }; // keluar dari giliran tanpa menjawab (encounter opsional)
  /** Giliran menulis panjang (pesan Bab 12): textarea, bukan satu baris. */
  multiline?: boolean;
  /** Giliran lisan: rekam jawaban ATAU gunakan teks (Mandat §6.B, U07). */
  mic?: {
    objective: ObjectiveId;
    /** Node tujuan bila jawaban lisan dikirim (rekaman tidak dinilai otomatis). */
    next: string;
    /** Teks contoh yang dibunyikan tombol "Dengar contoh". */
    modelText?: string;
  };
  /** Klip contoh suara avatar pemain (pola {avatar}) sebagai model dengar. */
  modelAudio?: string;
  /**
   * Penilai khusus untuk jawaban bebas (mis. pesan Bab 12). null = jawaban
   * belum diterima (kirim unknownHint). Hasil tanpa `next` berarti tetap di
   * node untuk revisi; `feedback` menyasar informasi yang salah (U08).
   */
  evaluate?: (text: string, ctx: StoryContext) => EvalResult | null;
}

export interface EvalResult {
  /** Node tujuan bila jawaban diterima; tanpa ini = revisi di tempat. */
  next?: string;
  record?: { objective: ObjectiveId; full: boolean };
  setFlags?: Flags;
  feedback?: string;
  /** Pertahankan teks yang sudah diketik saat revisi. */
  keepDraft?: boolean;
  /** Bantuan transkrip dipakai pada percobaan menyimak ini. */
  transcriptUsed?: boolean;
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
export type PlayerCharacterId = "player-01" | "player-02" | "player-03" | "player-04";

export interface PlayerProfile {
  name: string;
  hair: HairStyle;
  hairColor: string;
  outfit: string;
  skin: string;
  /** Avatar produksi (jaket indigo/kardigan terakota/mantel zaitun/kemeja oker).
   *  Profil lama tanpa characterId tetap memakai tampilan swatch lama. */
  characterId?: PlayerCharacterId;
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
  /** Draf jawaban yang sedang diketik — dipulihkan saat muat ulang (U09). */
  draft?: string;
  /** Rekaman lisan milik pemain (base64); bisa dihapus dari jurnal (U07). */
  recordings?: Record<string, { mime: string; data: string; at: number }>;
  /** Misi "Peron berubah" berjalan terpisah dari progres cerita (Mandat §1.3). */
  missionCompleted?: boolean;
}
