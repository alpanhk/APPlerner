// Sesi drill D1–D5 (Zustand): katalog item → jawab → feedback + attempts DB.
import { create } from "zustand";
import { buildDrillSession, DRILL_META, type DrillCode, type DrillItem } from "./items";
import getDb from "../stores/db";
import { scheduleAgain } from "../srs/review";
import { checkWord } from "../srs/answers";
import { choiceMatches } from "../lessons/answerMatch";
import { recordAttempt } from "./attempts";

function newSessionId(): string {
  const c = globalThis.crypto;
  try {
    if (c && "randomUUID" in c) return c.randomUUID();
  } catch { /* WebView bisa menolak randomUUID di konteks non-secure */ }
  return `drill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Tiga kali salah berurutan pada item yang sama menjadwalkan kartu terkait.
// Kartu dicari dari entryId bila ada; bila tidak, dari teks Jerman item.
async function scheduleWeakItem(item: DrillItem): Promise<boolean> {
  try {
    const db = await getDb();
    let rows: { id: number }[] = [];
    if (item.entryId) {
      rows = await db.select<{ id: number }[]>(
        "SELECT id FROM cards WHERE entry_id = $1 AND type = 'recog' LIMIT 1",
        [item.entryId],
      );
    }
    if (!rows.length) {
      const de = (item.say ?? item.answer ?? "").trim();
      if (de) rows = await db.select<{ id: number }[]>("SELECT id FROM cards WHERE de = $1 LIMIT 1", [de]);
    }
    if (!rows.length) return false;
    await scheduleAgain(rows[0].id);
    return true;
  } catch (error) {
    console.error("Penjadwalan ulang kartu gagal:", error);
    return false;
  }
}

// Hitung salah berurutan dari attempts nyata untuk item yang sama, lintas
// sesi. State session.ts saja direset setiap start(), sehingga tidak cukup
// untuk menjanjikan "tiga kali salah" pada item yang sama.
async function consecutiveWrongFor(item: DrillItem): Promise<number> {
  try {
    const db = await getDb();
    const rows = await db.select<{ correct: number }[]>(
      "SELECT correct FROM attempts WHERE item_key = $1 ORDER BY id DESC LIMIT 3",
      [item.key],
    );
    let count = 0;
    for (const row of rows) {
      if (row.correct !== 0) break;
      count += 1;
    }
    return count;
  } catch (error) {
    console.error("Gagal membaca riwayat jawaban:", error);
    return 0;
  }
}

// Penjadwalan SRS bersifat persisten lintas start()/reset(); catatan di dalam
// state sesi saja dihapus tiap sesi baru dan menyebabkan duplikat.
const srsScheduledEver = new Set<string>();

// Patch bersama untuk seluruh jalur jawaban (choice/type/order/timeout).
function wrongnessPatch(
  state: DrillSession,
  item: DrillItem,
  canonical: boolean,
  consecutive: number,
): Pick<DrillSession, "correctCount" | "wrongCount" | "wrongKeys" | "consecutiveWrong" | "srsScheduledKeys"> {
  const consecutiveWrong = canonical ? 0 : consecutive;
  if (canonical) srsScheduledEver.delete(item.key);
  const shouldSchedule = !canonical && consecutiveWrong === 3 && !srsScheduledEver.has(item.key);
  if (shouldSchedule) srsScheduledEver.add(item.key);
  return {
    correctCount: state.correctCount + (canonical ? 1 : 0),
    wrongCount: state.wrongCount + (canonical ? 0 : 1),
    wrongKeys: canonical ? state.wrongKeys : [...state.wrongKeys, item.key],
    consecutiveWrong: { ...state.consecutiveWrong, [item.key]: consecutiveWrong },
    srsScheduledKeys: shouldSchedule ? [...state.srsScheduledKeys, item.key] : state.srsScheduledKeys,
  };
}

export type DrillPhase = "idle" | "question" | "submitting" | "feedback" | "done";

type DrillSession = {
  code: DrillCode | null;
  items: DrillItem[];
  index: number;
  phase: DrillPhase;
  input: string;
  selected: string | null;
  order: number[];
  correct: boolean | null;
  explanation: string;
  correctCount: number;
  wrongCount: number;
  wrongKeys: string[];
  consecutiveWrong: Record<string, number>;
  srsScheduledKeys: string[];
  startedAt: number;
  itemStartedAt: number;
  totalMs: number;
  sessionId: string;
  generation: number;

  start: (code: DrillCode) => Promise<void>;
  setInput: (v: string) => void;
  choose: (opt: string) => Promise<void>;
  submitTyped: () => Promise<void>;
  pickToken: (index: number) => void;
  unpickToken: (pos: number) => void;
  submitOrder: () => Promise<void>;
  timeout: () => Promise<void>;
  next: () => void;
  reset: () => void;
};

export const useDrillSession = create<DrillSession>((set, get) => ({
  code: null,
  items: [],
  index: 0,
  phase: "idle",
  input: "",
  selected: null,
  order: [],
  correct: null,
  explanation: "",
  correctCount: 0,
  wrongCount: 0,
  wrongKeys: [],
  consecutiveWrong: {},
  srsScheduledKeys: [],
  startedAt: 0,
  itemStartedAt: 0,
  totalMs: 0,
  sessionId: "",
  generation: 0,

  async start(code) {
    const generation = get().generation + 1;
    const sessionId = newSessionId();
    // Klaim generasi sebelum await agar hasil build lama tidak dianggap sesi
    // aktif dan tidak membuat phase tertahan di idle.
    set({ generation, sessionId });
    const items = await buildDrillSession(code, 8);
    if (get().generation !== generation) return;
    if (items.length === 0) {
      set({ code, items: [], phase: "done", correctCount: 0, wrongCount: 0, totalMs: 0, sessionId, generation });
      return;
    }
    set({
      code,
      items,
      index: 0,
      phase: "question",
      input: "",
      selected: null,
      order: [],
      correct: null,
      explanation: "",
      correctCount: 0,
      wrongCount: 0,
      wrongKeys: [],
      consecutiveWrong: {},
      srsScheduledKeys: [],
      startedAt: Date.now(),
      itemStartedAt: Date.now(),
      totalMs: 0,
      sessionId,
      generation,
    });
  },

  setInput(v) {
    set({ input: v });
  },

  async choose(opt) {
    const { items, index, generation, sessionId } = get();
    const item = items[index];
    if (!item || get().phase !== "question") return;
    const correct = choiceMatches(opt, item);
    let canonical = correct;
    const ms = Date.now() - get().itemStartedAt;
    set({ phase: "submitting" });
    try {
      const result = await recordAttempt(item, correct, ms, { sessionId });
      canonical = result.correct;
    }
    catch (e) {
      if (get().generation === generation) set({ phase: "question" });
      throw e;
    }
    // Sesi bisa berganti saat await; hasil lama tidak boleh mengubah sesi baru.
    if (get().generation !== generation) return;

    const current = get();
    const consecutive = await consecutiveWrongFor(item);
    const verdict = wrongnessPatch(current, item, canonical, consecutive);
    if (verdict.srsScheduledKeys.length > current.srsScheduledKeys.length) {
      await scheduleWeakItem(item);
    }
    if (get().generation !== generation) return;
    set({
      phase: "feedback",
      selected: opt,
      correct: canonical,
      explanation: item.explanation,
      ...verdict,
      totalMs: get().totalMs + ms,
    });
  },

  async submitTyped() {
    const { items, index, input, generation, sessionId } = get();
    const item = items[index];
    if (!item || get().phase !== "question") return;
    const expected = [item.answer, ...(item.altAnswers ?? [])];
    const correct = input.trim().length > 0 && expected.some((a) => checkWord(input, a));
    let canonical = correct;
    const ms = Date.now() - get().itemStartedAt;
    set({ phase: "submitting" });
    try {
      const result = await recordAttempt(item, correct, ms, { sessionId });
      canonical = result.correct;
    }
    catch (e) {
      if (get().generation === generation) set({ phase: "question" });
      throw e;
    }
    if (get().generation !== generation) return;
    const current = get();
    const consecutive = await consecutiveWrongFor(item);
    const verdict = wrongnessPatch(current, item, canonical, consecutive);
    if (verdict.srsScheduledKeys.length > current.srsScheduledKeys.length) {
      await scheduleWeakItem(item);
    }
    if (get().generation !== generation) return;
    set({
      phase: "feedback",
      selected: input,
      correct: canonical,
      explanation: item.explanation,
      ...verdict,
      totalMs: get().totalMs + ms,
    });
  },

  pickToken(index) {
    const { items, index: current, order, phase } = get();
    const item = items[current];
    if (!item || phase !== "question" || !item.tokens) return;
    if (index < 0 || index >= item.tokens.length || order.includes(index)) return;
    set({ order: [...order, index] });
  },

  unpickToken(pos) {
    const { order } = get();
    if (pos < 0 || pos >= order.length) return;
    set({ order: order.filter((_, i) => i !== pos) });
  },

  async submitOrder() {
    const { items, index, order, generation, sessionId } = get();
    const item = items[index];
    if (!item || get().phase !== "question" || !item.tokens) return;
    if (order.length !== item.tokens.length) return;
    const answer = order.map((i) => item.tokens?.[i] ?? "").join(" ");
    const expected = [item.answer, ...(item.altAnswers ?? [])];
    const correct = expected.some((a) => checkWord(answer, a));
    let canonical = correct;
    const ms = Date.now() - get().itemStartedAt;
    set({ phase: "submitting" });
    try {
      const result = await recordAttempt(item, correct, ms, { sessionId });
      canonical = result.correct;
    }
    catch (e) {
      if (get().generation === generation) set({ phase: "question" });
      throw e;
    }
    if (get().generation !== generation) return;
    const current = get();
    const consecutive = await consecutiveWrongFor(item);
    const verdict = wrongnessPatch(current, item, canonical, consecutive);
    if (verdict.srsScheduledKeys.length > current.srsScheduledKeys.length) {
      await scheduleWeakItem(item);
    }
    if (get().generation !== generation) return;
    set({
      phase: "feedback",
      selected: answer,
      correct: canonical,
      explanation: item.explanation,
      ...verdict,
      totalMs: get().totalMs + ms,
    });
  },

  async timeout() {
    const { items, index, generation, sessionId } = get();
    const item = items[index];
    if (!item || get().phase !== "question") return;
    let canonical = false;
    const ms = Date.now() - get().itemStartedAt;
    set({ phase: "submitting" });
    try {
      const result = await recordAttempt(item, false, ms, { sessionId });
      canonical = result.correct;
    }
    catch (e) {
      if (get().generation === generation) set({ phase: "question" });
      throw e;
    }
    if (get().generation !== generation) return;
    const current = get();
    const consecutive = await consecutiveWrongFor(item);
    const verdict = wrongnessPatch(current, item, canonical, consecutive);
    if (verdict.srsScheduledKeys.length > current.srsScheduledKeys.length) {
      await scheduleWeakItem(item);
    }
    if (get().generation !== generation) return;
    set({
      phase: "feedback",
      selected: null,
      correct: canonical,
      explanation: `Waktu habis. ${item.explanation}`,
      ...verdict,
      totalMs: get().totalMs + ms,
    });
  },

  next() {
    const { index, items } = get();
    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      set({ phase: "done" });
      return;
    }
    set({
      index: nextIndex,
      phase: "question",
      input: "",
      selected: null,
      order: [],
      correct: null,
      explanation: "",
      itemStartedAt: Date.now(),
    });
  },

  reset() {
    set({
      code: null,
      items: [],
      index: 0,
      phase: "idle",
      input: "",
      selected: null,
      order: [],
      correct: null,
      explanation: "",
      correctCount: 0,
      wrongCount: 0,
      wrongKeys: [],
      consecutiveWrong: {},
      startedAt: 0,
      itemStartedAt: 0,
      totalMs: 0,
      sessionId: "",
      generation: get().generation + 1,
    });
  },
}));

export function nextDrillRecommendation(code: DrillCode | null): DrillCode {
  if (!code) return "D1";
  const order: DrillCode[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D9", "D10"];
  const i = order.indexOf(code);
  return order[(i + 1) % order.length];
}

export function drillTitle(code: DrillCode): string {
  return `${code} — ${DRILL_META[code].nama}`;
}
