import type { Attempt, Flags, HistoryItem, PlayerProfile, SfxId, StageState, StoryContext, StoryNode, CharId } from "../types";
import { PROLOG_NODES } from "../data/story/prolog";
import { fillTemplate } from "./matchers";

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
}

export type Effect =
  | { type: "sfx"; id: SfxId }
  | { type: "speak"; char: CharId | null; text: string; asset?: string; key: string };

export const INITIAL_STAGE: StageState = { bg: "kamar", chars: [], overlay: null, ambience: "none" };

export function nodeOf(id: string): StoryNode {
  const n = PROLOG_NODES[id];
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
      const translation = n.translation ? fillTemplate(n.translation, g.player.name) : undefined;
      g.history.push({ speaker: n.speaker, text, lang: n.lang, translation, audio: n.audio });
      if (n.lang === "de") {
        effects.push({ type: "speak", char: n.speaker === "narator" ? null : n.speaker, text, asset: n.audio, key: `${id}#${g.visit}` });
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
