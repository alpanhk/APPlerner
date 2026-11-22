import { diagnose, fill, findRule } from "./match";
import type { Attempt, Chapter, ChoiceOption, Flags, Game, InputNode, Sfx, StoryNode } from "./types";

// ===== Keadaan permainan & transisi murni =====

export type Effect = { type: "sfx"; id: Sfx } | { type: "speak"; text: string; speaker: string; key: string };
export interface Step {
  g: Game;
  effects: Effect[];
  attempt?: Attempt;
  feedback?: string;
}

export function nodeOf(ch: Chapter, id: string): StoryNode {
  const node = ch.nodes[id];
  if (!node) throw new Error(`Node cerita tidak ditemukan: ${id}`);
  return node;
}

interface Extra {
  setFlags?: Flags;
  resetHints?: string;
  playerLine?: string;
  sfx?: Sfx;
}

function go(ch: Chapter, g0: Game, target: string, name: string, extra: Extra = {}): Step {
  const g: Game = {
    ...g0,
    flags: { ...g0.flags, ...extra.setFlags },
    hintCounts: { ...g0.hintCounts },
    hintLevels: { ...g0.hintLevels },
    fails: { ...g0.fails },
    history: [...g0.history],
    visit: g0.visit + 1,
  };
  const effects: Effect[] = [];
  if (extra.resetHints) {
    // Masuk ulang ke sebuah pertemuan: hitungan petunjuk mulai dari nol lagi.
    g.hintCounts[extra.resetHints] = 0;
    for (const k of Object.keys(g.hintLevels)) if (k.startsWith(`${extra.resetHints}.`)) delete g.hintLevels[k];
    for (const k of Object.keys(g.fails)) if (k.startsWith(`${extra.resetHints}.`)) delete g.fails[k];
  }
  if (extra.sfx) effects.push({ type: "sfx", id: extra.sfx });
  if (extra.playerLine) g.history.push({ speaker: "player", text: extra.playerLine, lang: "de" });

  const node = nodeOf(ch, target);
  if (node.setFlags) g.flags = { ...g.flags, ...node.setFlags };
  if (node.stage) g.stage = { bg: node.stage.bg ?? g.stage.bg, chars: node.stage.chars ?? g.stage.chars };
  g.overlay = node.kind === "line" ? (node.overlay ?? null) : null;
  if (node.sfx) effects.push({ type: "sfx", id: node.sfx });
  g.nodeId = target;

  if (node.kind === "line") {
    const text = fill(node.text, name);
    g.history.push({ speaker: node.speaker, text, lang: node.lang, tr: node.tr ? fill(node.tr, name) : undefined });
    if (node.keep && !g.notes.includes(node.id)) g.notes = [...g.notes, node.id];
    if (node.lang === "de") effects.push({ type: "speak", text, speaker: node.speaker, key: `${target}#${g.visit}` });
  }
  if (node.kind === "end") g.done = true;
  g.history = g.history.slice(-80);
  return { g, effects };
}

export function startGame(ch: Chapter, name: string, notes: string[] = []): Step {
  const blank: Game = {
    chapterId: ch.id,
    nodeId: ch.start,
    stage: { bg: "kamar", chars: [] },
    overlay: null,
    flags: {},
    hintCounts: {},
    hintLevels: {},
    fails: {},
    history: [],
    notes,
    visit: 0,
    done: false,
  };
  return go(ch, blank, ch.start, name);
}

export function advance(ch: Chapter, g: Game, name: string): Step {
  const node = nodeOf(ch, g.nodeId);
  return node.kind === "line" ? go(ch, g, node.next, name) : { g, effects: [] };
}

export function visibleOptions(ch: Chapter, g: Game): ChoiceOption[] {
  const node = nodeOf(ch, g.nodeId);
  return node.kind === "choice" ? node.options.filter((o) => !o.show || o.show(g.flags)) : [];
}

export function choose(ch: Chapter, g: Game, opt: ChoiceOption, name: string): Step {
  return go(ch, g, opt.next, name, { setFlags: opt.setFlags, resetHints: opt.resetHints, sfx: opt.sfx });
}

function revealHint(g: Game, node: InputNode): Game {
  const level = g.hintLevels[node.id] ?? 0;
  if (level >= node.hints.length) return g;
  return {
    ...g,
    hintLevels: { ...g.hintLevels, [node.id]: level + 1 },
    hintCounts: { ...g.hintCounts, [node.where]: (g.hintCounts[node.where] ?? 0) + 1 },
  };
}

export function hint(ch: Chapter, g: Game): Game {
  const node = nodeOf(ch, g.nodeId);
  return node.kind === "input" ? revealHint(g, node) : g;
}

export function answer(ch: Chapter, g: Game, raw: string, name: string): Step {
  const node = nodeOf(ch, g.nodeId);
  if (node.kind !== "input") return { g, effects: [] };
  const rule = findRule(node.rules, raw, name);
  if (!rule) {
    const fails = (g.fails[node.id] ?? 0) + 1;
    let g2: Game = { ...g, fails: { ...g.fails, [node.id]: fails } };
    let feedback = diagnose(raw, node.model, name) ?? fill(node.miss, name);
    // Setelah tiga kali meleset, satu tingkat petunjuk dibuka sendiri agar pemain tidak buntu.
    if (fails >= 3 && fails % 2 === 1 && (g2.hintLevels[node.id] ?? 0) < node.hints.length) {
      g2 = revealHint(g2, node);
      feedback += " Satu petunjuk dibuka untukmu.";
    }
    return { g: g2, effects: [], feedback };
  }
  const attempt: Attempt | undefined = rule.record
    ? {
        objective: node.objective,
        chapterId: ch.id,
        who: node.speaker,
        text: raw.trim().slice(0, 200),
        hintsUsed: g.hintCounts[node.where] ?? 0,
        full: rule.record.full,
        guided: node.guided,
      }
    : undefined;
  return { ...go(ch, g, rule.next, name, { setFlags: rule.setFlags, playerLine: raw.trim() }), attempt };
}

export function skip(ch: Chapter, g: Game, name: string): Step {
  const node = nodeOf(ch, g.nodeId);
  if (node.kind !== "input" || !node.skip) return { g, effects: [] };
  const g2 = node.skip.hint ? { ...g, hintCounts: { ...g.hintCounts, [node.where]: (g.hintCounts[node.where] ?? 0) + 1 } } : g;
  return go(ch, g2, node.skip.next, name);
}
