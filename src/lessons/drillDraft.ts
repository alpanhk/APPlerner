import type { DrillItem } from "../drills/items";

export type DrillDraft = {
  items: DrillItem[];
  index: number;
  correct: boolean | null;
  correctCount: number;
  // Sesi yang menulis attempt atomik; dipakai untuk rekonsiliasi tepat.
  sessionId?: string;
};

// Validator dipakai bersama oleh draft layar dan payload sesi. Bentuk item
// harus cukup lengkap untuk dirender MiniDrill tanpa melempar error.
export function isDrillItem(value: unknown): value is DrillItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.key !== "string" || item.key.length === 0) return false;
  if (typeof item.prompt !== "string" || item.prompt.length === 0) return false;
  if (typeof item.answer !== "string") return false;
  if (typeof item.explanation !== "string") return false;
  if (!["choice", "type", "order"].includes(String(item.mode))) return false;
  if (item.sub !== undefined && typeof item.sub !== "string") return false;
  if (item.objectiveId !== undefined && typeof item.objectiveId !== "string") return false;
  if (item.code !== undefined && typeof item.code !== "string") return false;
  if (item.mode === "choice") {
    if (!Array.isArray(item.options) || item.options.length === 0) return false;
    if (!item.options.every((option) => typeof option === "string")) return false;
  }
  if (item.mode === "order") {
    if (!Array.isArray(item.tokens) || item.tokens.length === 0) return false;
    if (!item.tokens.every((token) => typeof token === "string")) return false;
  }
  return true;
}

export function parseDrillDraftValue(value: unknown): DrillDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Record<string, unknown>;
  if (!Array.isArray(draft.items) || draft.items.length === 0) return null;
  if (!draft.items.every(isDrillItem)) return null;
  const keys = new Set(draft.items.map((item) => item.key));
  if (keys.size !== draft.items.length) return null;
  if (!Number.isInteger(draft.index) || (draft.index as number) < 0 || (draft.index as number) >= draft.items.length) return null;
  if (!(draft.correct === null || typeof draft.correct === "boolean")) return null;
  if (!Number.isInteger(draft.correctCount) || (draft.correctCount as number) < 0) return null;
  if ((draft.correctCount as number) > (draft.index as number) + (draft.correct === null ? 0 : 1)) return null;
  if (draft.sessionId !== undefined && (typeof draft.sessionId !== "string" || draft.sessionId.length === 0)) return null;
  return draft as DrillDraft;
}

export function parseDrillDraft(raw: string | null): DrillDraft | null {
  if (!raw) return null;
  try {
    return parseDrillDraftValue(JSON.parse(raw));
  } catch {
    return null;
  }
}
