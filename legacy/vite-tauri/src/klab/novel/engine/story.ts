import type { Attempt, Flags, HistoryItem, PlayerProfile, SfxId, StageState, StoryContext, StoryNode, CharId } from "../types";
import { PROLOG_NODES } from "../data/story/prolog";
import { CH11_NODES } from "../data/story/bab-11";
import { CH12_NODES } from "../data/story/bab-12";
import { fillTemplate } from "./matchers";
import { resolveAudio } from "../data/audio-manifest";

// ===== Keadaan permainan & transisi murni =====

export interface Game {
  player: PlayerProfile;
  nodeId: string;
  stage: StageState;
  flags: Flags;
  hintCounts: Record<string, number>; // per encounter ("where")
  hintLevels: Record<string, number>; // per node input
  attempts: Attempt[];
  history: HistoryItem[];
  prologCompleted: boolean;
  visit: number; // bertambah setiap transisi, memicu efek samping
  /**
   * PILOT-AGENT-1: "latihan" = misi "Peron berubah" dijalankan langsung dari
   * jalur pengguna biasa; jalur ini TIDAK menandai Bab 01-10 selesai dan
   * buktinya tercatat terpisah di jurnal (Mandat §1.3/§1.5).
   */
  mode?: "cerita" | "latihan";
  /** Rekaman lisan milik pemain (base64), dikelola di luar transisi murni. */
  recordings?: Record<string, { mime: string; data: string; at: number }>;
}

export type Effect =
  | { type: "sfx"; id: SfxId }
  | { type: "speak"; char: CharId | null; text: string; asset?: string; key: string };

export const INITIAL_STAGE: StageState = { bg: "kamar", chars: [], overlay: null, ambience: "none" };

// Registri node gabungan: prolog + Bab 11 + Bab 12 (PILOT-AGENT-1).
const ALL_NODES: Record<string, StoryNode> = { ...PROLOG_NODES, ...CH11_NODES, ...CH12_NODES };

export function nodeOf(id: string): StoryNode {
  const n = ALL_NODES[id];
  if (!n) throw new Error(`Node cerita tidak ditemukan: ${id}`);
  return n;
}

export function ctxOf(g: Game): StoryContext {
  return { flags: g.flags, name: g.player.name, hintCounts: g.hintCounts };
}

export interface TransitionExtra {
  setFlags?: Flags;
  resetHints?: string;
  playerLine?: string; // jawaban pemain untuk riwayat
}

export function transition(g0: Game, targetId: string, extra: TransitionExtra = {}): { g: Game; effects: Effect[] } {
  let g: Game = { ...g0, flags: { ...g0.flags, ...(extra.setFlags ?? {}) }, hintCounts: { ...g0.hintCounts }, history: [...g0.history], visit: g0.visit + 1 };
  if (extra.resetHints) g.hintCounts[extra.resetHints] = 0;
  if (extra.playerLine) g.history.push({ speaker: "player", text: extra.playerLine, lang: "de", isPlayer: true });

  const effects: Effect[] = [];
  let id = targetId;
  // Lewati node cabang
  for (let guard = 0; guard < 20; guard++) {
    const n = nodeOf(id);
    if (n.setFlags) g.flags = { ...g.flags, ...n.setFlags };
    if (n.stage) {
      g.stage = {
        bg: n.stage.bg ?? g.stage.bg,
        chars: n.stage.chars ?? g.stage.chars,
        overlay: n.stage.overlay === undefined ? g.stage.overlay : n.stage.overlay,
        ambience: n.stage.ambience ?? g.stage.ambience,
        board: n.stage.board === undefined ? g.stage.board : n.stage.board,
        ticket: n.stage.ticket === undefined ? g.stage.ticket : n.stage.ticket,
        calendar: n.stage.calendar === undefined ? g.stage.calendar : n.stage.calendar,
      };
    }
    if (n.sfx) effects.push({ type: "sfx", id: n.sfx });
    if (n.kind === "branch") {
      id = n.pick(ctxOf(g));
      continue;
    }
    g.nodeId = id;
    if (n.kind === "line") {
      const text = fillTemplate(n.text, g.player.name);
      const spoken = n.spokenText ? fillTemplate(n.spokenText, g.player.name) : text;
      const translation = n.translation ? fillTemplate(n.translation, g.player.name) : undefined;
      g.history.push({ speaker: n.speaker, text: spoken, lang: n.lang, translation, audio: n.audio });
      if (n.lang === "de") {
        // Pengumuman pengeras suara bersuara tanpa potret: mulut tokoh tidak
        // bergerak (Mandat §5.5). Id klip pemain memakai pola {avatar}.
        const asset = resolveAudio(n.audio, g.player.characterId);
        const char = n.speaker === "narator" || n.speaker === "pengumuman" ? null : n.speaker;
        effects.push({ type: "speak", char, text: spoken, asset, key: `${id}#${g.visit}` });
      }
    }
    if (n.kind === "end") {
      g.prologCompleted = true;
    }
    break;
  }
  return { g, effects };
}

export function newGame(player: PlayerProfile, startId: string): Game {
  return {
    player,
    nodeId: startId,
    stage: INITIAL_STAGE,
    flags: {},
    hintCounts: {},
    hintLevels: {},
    attempts: [],
    history: [],
    prologCompleted: false,
    visit: 0,
  };
}
