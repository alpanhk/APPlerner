import { nameOf } from "./cast";
import type { Beat, BeatKind, Chapter, Expr, Flags, InputNode, Lang, Objective, OutlineItem, Overlay, Rule, Sfx, StageChar, StageState, StoryNode } from "./types";

// ===== Pola Prolog sebagai pembangun bab =====
// Prolog mengajar dengan lima langkah. Dulu hanya prolog yang mengikutinya; bab lain
// ditulis node demi node sehingga polanya hilang. Sekarang penulis materi TIDAK menulis
// node. Ia mengisi lima cetakan di bawah, dan cetakan itulah yang menjamin:
//   1. opening   — Tiba: narasi + benda berbahasa Jerman yang bisa diperiksa
//   2. lesson    — Belajar: Frau Lehmann memodelkan, memberi kiat, lalu latihan terbimbing
//   3. encounter — Bertemu: kalimat yang sama dipakai kepada orang sungguhan
//   4. hub       — Menjelajah: satu pertemuan pilihan (ulangan bab lama) + satu misi berkelok
//   5. payoff    — Temuan: benda cerita yang menarik ke bab berikutnya
// Petunjuk selalu tiga tingkat (makna → awal kalimat → contoh lengkap), tokoh selalu
// bereaksi dalam bahasa Jerman, dan Frau Lehmann selalu menjelaskan dalam bahasa Indonesia.

export interface L {
  s: string;
  lang: Lang;
  t: string;
  tr?: string;
  e?: Expr;
  overlay?: Overlay;
  bg?: string;
  sfx?: Sfx;
  keep?: boolean;
}
type X = Partial<Pick<L, "overlay" | "bg" | "sfx">>;

/** Narasi (Indonesia). */
export const n = (t: string, x: X = {}): L => ({ s: "narator", lang: "id", t, ...x });
/** Tulisan Jerman di lingkungan: catatan, papan, pesan. */
export const nd = (t: string, tr: string, x: X = {}): L => ({ s: "narator", lang: "de", t, tr, ...x });
/** Frau Lehmann menjelaskan (Indonesia). */
export const tu = (t: string, e: Expr = "smile"): L => ({ s: "tutor", lang: "id", t, e });
/** Frau Lehmann memodelkan kalimat (Jerman) — masuk buku catatan. */
export const td = (t: string, tr: string): L => ({ s: "tutor", lang: "de", t, tr, e: "neutral", keep: true });
/** Tokoh berbicara (Jerman). */
export const d = (s: string, t: string, tr: string, e: Expr = "neutral", x: X = {}): L => ({ s, lang: "de", t, tr, e, ...x });
export const paper = (kind: Overlay["kind"], text: string, sub?: string): Overlay => ({ kind, text, sub });

export interface Part {
  when: string[];
  say?: L[];
  accept?: boolean; // dipahami tetapi belum kalimat utuh: tercatat, pemain boleh mencoba lagi
  to?: "next"; // reaksi tokoh sekaligus menjadi pertanyaan giliran berikutnya
}

export interface Turn {
  obj: string;
  ask?: L[];
  prompt?: string;
  chips: string;
  hints: [string, string];
  model: string;
  ok: string[];
  part?: Part[];
  miss?: string;
  then?: L[];
  end?: boolean; // jawaban utuh di sini langsung menutup pertemuan
}

export interface Enc {
  who: string;
  bg?: string;
  intro?: L[];
  open?: L[];
  turns: Turn[];
  close?: L[];
}

interface Ctx {
  ch: string;
  nodes: StoryNode[];
}

export interface BeatDef extends OutlineItem {
  build: (ctx: Ctx, p: string, exit: string) => string;
}

const P: StageChar = { id: "player", side: "left" };

interface ChainOpt {
  beat: Beat;
  player: boolean;
  solo?: boolean;
}

function chain(ctx: Ctx, p: string, lines: L[], exit: string, o: ChainOpt): string {
  lines.forEach((l, i) => {
    const stage: Partial<StageState> = {};
    if (l.bg) stage.bg = l.bg;
    if (l.s === "narator") {
      if (o.solo) stage.chars = [];
    } else {
      stage.chars = [...(o.player ? [P] : []), { id: l.s, side: "right", expr: l.e ?? "neutral" }];
    }
    ctx.nodes.push({
      id: `${p}${i}`,
      kind: "line",
      beat: o.beat,
      speaker: l.s,
      lang: l.lang,
      text: l.t,
      tr: l.tr,
      keep: l.keep,
      overlay: l.overlay,
      sfx: l.sfx,
      stage,
      next: i === lines.length - 1 ? exit : `${p}${i + 1}`,
    });
  });
  return lines.length ? `${p}0` : exit;
}

function setBg(ctx: Ctx, id: string, bg?: string) {
  if (!bg) return;
  const node = ctx.nodes.find((x) => x.id === id);
  if (node) node.stage = { ...node.stage, bg };
}

interface TurnOpt {
  who: string;
  where: string;
  beat: Beat;
  guided: boolean;
  okExit: string;
  endExit: string;
  nextInput?: string;
  done?: Flags;
  leave?: InputNode["skip"];
}

function turn(ctx: Ctx, p: string, t: Turn, o: TurnOpt): string {
  const inId = `${p}.in`;
  const co: ChainOpt = { beat: o.beat, player: !o.guided };
  const thenId = chain(ctx, `${p}.ok`, t.then ?? [], t.end ? o.endExit : o.okExit, co);
  const rules: Rule[] = [{ when: t.ok, next: thenId, record: { full: true }, setFlags: o.done }];

  (t.part ?? []).forEach((pt, j) => {
    const pp = `${p}.p${j}`;
    if (pt.accept) {
      const say = pt.say ?? [tu(`${nameOf(o.who)} memahami maksudmu. Kamu bisa mencoba kalimat lengkap, atau melanjutkan percakapan.`, "neutral")];
      ctx.nodes.push({
        id: `${pp}.c`,
        kind: "choice",
        beat: o.beat,
        prompt: "Apa yang ingin kamu lakukan?",
        options: [
          { label: "Coba kalimat lengkap", next: inId },
          { label: "Lanjutkan percakapan", next: thenId, setFlags: o.done },
        ],
      });
      rules.push({ when: pt.when, next: chain(ctx, `${pp}.s`, say, `${pp}.c`, co), record: { full: false } });
    } else {
      const target = pt.to === "next" && o.nextInput ? o.nextInput : inId;
      rules.push({ when: pt.when, next: chain(ctx, `${pp}.s`, pt.say ?? [], target, co) });
    }
  });

  let skip = o.leave;
  if (!o.guided && !skip) {
    const helpId = chain(ctx, `${p}.help`, [tu(`${t.hints[1]} Contoh: „${t.model}“`)], inId, co);
    skip = { label: "Minta bantuan Frau Lehmann", next: helpId, hint: true };
  }

  ctx.nodes.push({
    id: inId,
    kind: "input",
    beat: o.beat,
    speaker: o.who,
    where: o.where,
    guided: o.guided,
    objective: t.obj,
    prompt: t.prompt ?? (o.guided ? "Latihan bersama Frau Lehmann. Ketik atau susun kalimatnya." : `Giliranmu. ${nameOf(o.who)} menunggu jawabanmu.`),
    chips: t.chips.split(/\s+/).filter(Boolean),
    hints: [t.hints[0], t.hints[1], `Contoh lengkap: „${t.model}“`],
    model: t.model,
    rules,
    miss: t.miss ?? `Belum pas. ${t.hints[1]}`,
    skip,
    stage: { chars: o.guided ? [{ id: "tutor", side: "right", expr: "question" }] : [P, { id: o.who, side: "right", expr: "question" }] },
  });
  return chain(ctx, `${p}.q`, t.ask ?? [], inId, co);
}

interface EncOpt {
  beat: Beat;
  exit: string;
  done?: Flags;
  leave?: { label: string; lines: L[] };
}

function encounterNodes(ctx: Ctx, p: string, enc: Enc, o: EncOpt): string {
  const closeId = chain(ctx, `${p}.z`, enc.close ?? [], o.exit, { beat: o.beat, player: true });
  const leave = o.leave ? { label: o.leave.label, next: chain(ctx, `${p}.l`, o.leave.lines, o.exit, { beat: o.beat, player: false, solo: true }) } : undefined;
  let nextEntry = closeId;
  let nextInput: string | undefined;
  for (let k = enc.turns.length - 1; k >= 0; k--) {
    const t = enc.turns[k];
    const last = k === enc.turns.length - 1;
    nextEntry = turn(ctx, `${p}.t${k}`, t, {
      who: enc.who,
      where: p,
      beat: o.beat,
      guided: false,
      okExit: nextEntry,
      endExit: closeId,
      nextInput,
      done: last || t.end ? o.done : undefined,
      leave,
    });
    nextInput = `${p}.t${k}.in`;
  }
  const openId = chain(ctx, `${p}.o`, enc.open ?? [], nextEntry, { beat: o.beat, player: true });
  const entry = chain(ctx, `${p}.i`, enc.intro ?? [], openId, { beat: o.beat, player: false, solo: true });
  setBg(ctx, entry, enc.bg);
  return entry;
}

// ---------- 1 · Tiba ----------
export function opening(s: { bg: string; lines: L[]; prompt: string; look: { label: string; lines: L[] }[]; go: string }): BeatDef {
  return {
    kind: "opening",
    beat: 1,
    label: "Tiba",
    objs: [],
    build(ctx, p, exit) {
      const hubId = `${p}.hub`;
      const seen = s.look.map((_, j) => `${p}.seen${j}`);
      ctx.nodes.push({
        id: hubId,
        kind: "choice",
        beat: 1,
        stage: { bg: s.bg, chars: [] },
        prompt: s.prompt,
        options: [
          ...s.look.map((lk, j) => ({
            label: lk.label,
            next: chain(ctx, `${p}.k${j}.`, lk.lines, hubId, { beat: 1, player: false, solo: true }),
            setFlags: { [seen[j]]: true },
          })),
          // Seperti di prolog: pemain mengamati dulu sebelum cerita berjalan.
          { label: s.go, next: exit, show: (f: Flags) => seen.some((k) => f[k]) },
        ],
      });
      const entry = chain(ctx, `${p}.i`, s.lines, hubId, { beat: 1, player: false, solo: true });
      setBg(ctx, entry, s.bg);
      return entry;
    },
  };
}

// ---------- 2 · Belajar ----------
export function lesson(s: {
  obj: string;
  also?: string[];
  bg?: string;
  intro: L[];
  models: L[];
  tip: string;
  practice: Omit<Turn, "obj" | "then" | "end">;
  praise: string;
  go: string;
}): BeatDef {
  return {
    kind: "lesson",
    beat: 2,
    label: "Belajar",
    objs: [s.obj, ...(s.also ?? [])],
    build(ctx, p, exit) {
      const co: ChainOpt = { beat: 2, player: false };
      const m0 = `${p}.m0`;
      ctx.nodes.push({
        id: `${p}.c`,
        kind: "choice",
        beat: 2,
        prompt: "Siap memakainya?",
        options: [
          { label: "Dengar penjelasan sekali lagi", next: m0 },
          { label: s.go, next: exit },
        ],
      });
      const praiseId = chain(ctx, `${p}.g`, [tu(s.praise)], `${p}.c`, co);
      const practiceId = turn(ctx, `${p}.t`, { ...s.practice, obj: s.obj }, { who: "tutor", where: p, beat: 2, guided: true, okExit: praiseId, endExit: praiseId });
      const tipId = chain(ctx, `${p}.tip`, [tu(s.tip, "neutral")], practiceId, co);
      chain(ctx, `${p}.m`, s.models, tipId, co);
      const entry = chain(ctx, `${p}.a`, s.intro, m0, co);
      setBg(ctx, entry, s.bg);
      return entry;
    },
  };
}

// ---------- 3 · Bertemu ----------
export function encounter(enc: Enc): BeatDef {
  return {
    kind: "encounter",
    beat: 3,
    label: "Bertemu",
    objs: [...new Set(enc.turns.map((t) => t.obj))],
    build: (ctx, p, exit) => encounterNodes(ctx, p, enc, { beat: 3, exit }),
  };
}

// ---------- 4 · Menjelajah ----------
export function hub(s: {
  bg: string;
  intro: L[];
  prompt: string;
  side: { label: string; leave: string; enc: Enc };
  main: { label: string; enc: Enc };
  exit: string;
}): BeatDef {
  return {
    kind: "hub",
    beat: 4,
    label: "Menjelajah",
    objs: [...new Set(s.main.enc.turns.map((t) => t.obj))],
    reviewObjs: [...new Set(s.side.enc.turns.map((t) => t.obj))],
    build(ctx, p, exit) {
      const hubId = `${p}.hub`;
      const sideDone = `${p}.side`;
      const mainDone = `${p}.main`;
      const sideEntry = encounterNodes(ctx, `${p}.s`, s.side.enc, {
        beat: 4,
        exit: hubId,
        done: { [sideDone]: true },
        leave: { label: "Lanjutkan perjalanan", lines: [n(s.side.leave)] },
      });
      const mainEntry = encounterNodes(ctx, `${p}.m`, s.main.enc, { beat: 4, exit: hubId, done: { [mainDone]: true } });
      ctx.nodes.push({
        id: hubId,
        kind: "choice",
        beat: 4,
        stage: { bg: s.bg, chars: [] },
        prompt: s.prompt,
        options: [
          { label: s.side.label, next: sideEntry, show: (f) => !f[sideDone], resetHints: `${p}.s` },
          { label: s.main.label, next: mainEntry, show: (f) => !f[mainDone], resetHints: `${p}.m` },
          // Mengulang misi tanpa petunjuk adalah cara meraih bukti mandiri.
          { label: `Ulangi: ${s.main.label}`, next: mainEntry, show: (f) => !!f[mainDone], resetHints: `${p}.m` },
          { label: s.exit, next: exit, show: (f) => !!f[mainDone] },
        ],
      });
      const entry = chain(ctx, `${p}.i`, s.intro, hubId, { beat: 4, player: false, solo: true });
      setBg(ctx, entry, s.bg);
      return entry;
    },
  };
}

// ---------- 5 · Temuan ----------
export function payoff(s: { bg?: string; lines: L[] }): BeatDef {
  return {
    kind: "payoff",
    beat: 5,
    label: "Temuan",
    objs: [],
    build(ctx, p, exit) {
      const entry = chain(ctx, `${p}.`, s.lines, exit, { beat: 5, player: false, solo: true });
      setBg(ctx, entry, s.bg);
      return entry;
    },
  };
}

export function chapter(s: {
  id: string;
  no: number;
  unit: number;
  title: string;
  tagline: string;
  cover: string;
  place: string;
  objectives: Objective[];
  next: string;
  beats: BeatDef[];
}): Chapter {
  const ctx: Ctx = { ch: s.id, nodes: [] };
  const endId = `${s.id}.end`;
  ctx.nodes.push({ id: endId, kind: "end", beat: 5 });
  let entry = endId;
  for (let i = s.beats.length - 1; i >= 0; i--) entry = s.beats[i].build(ctx, `${s.id}.${i}`, entry);
  const nodes: Record<string, StoryNode> = {};
  for (const node of ctx.nodes) {
    if (nodes[node.id]) throw new Error(`Node ganda: ${node.id}`);
    nodes[node.id] = node;
  }
  const outline: OutlineItem[] = s.beats.map(({ kind, beat, label, objs, reviewObjs }) => ({ kind, beat, label, objs, reviewObjs }));
  const { beats: _beats, ...meta } = s;
  void _beats;
  return { ...meta, start: entry, nodes, outline };
}

export const BEAT_LABELS: Record<BeatKind, string> = {
  opening: "Tiba",
  lesson: "Belajar",
  encounter: "Bertemu",
  hub: "Menjelajah",
  payoff: "Temuan",
};
