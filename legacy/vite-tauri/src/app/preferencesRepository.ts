// Preferensi UI nyata di config key ui_preferences_v1. Store config lama
// (volume, SRS, dll.) tetap dipakai domain masing-masing; ini hanya preferensi
// tampilan KLAB sesuai kontrak 4a.
import getDb from "../stores/db";
import type { Preferences } from "../klab/contracts";

const KEY = "ui_preferences_v1";

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  theme: "system",
  learningMode: "ordered",
  textScale: 1,
  reducedMotion: "system",
  reactions: true,
  reactionSound: false,
  reactionVolume: 0.3,
  quietMode: false,
  onboardingCompleted: false,
};

function valid(value: unknown): value is Preferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return p.version === 1 &&
    ["system", "light", "dark"].includes(String(p.theme)) &&
    ["ordered", "free"].includes(String(p.learningMode)) &&
    [1, 1.125, 1.25].includes(Number(p.textScale)) &&
    ["system", "on"].includes(String(p.reducedMotion)) &&
    typeof p.reactions === "boolean" && typeof p.reactionSound === "boolean" &&
    typeof p.reactionVolume === "number" && p.reactionVolume >= 0 && p.reactionVolume <= 1 &&
    typeof p.quietMode === "boolean" && typeof p.onboardingCompleted === "boolean";
}

export async function loadPreferences(): Promise<Preferences> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [KEY]);
  if (!rows.length) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(rows[0].value) as unknown;
    return valid(parsed) ? parsed : DEFAULT_PREFERENCES;
  } catch { return DEFAULT_PREFERENCES; }
}

export async function patchPreferences(change: Partial<Omit<Preferences, "version">>): Promise<Preferences> {
  const current = await loadPreferences();
  const next: Preferences = { ...current, ...change, version: 1 };
  if (!valid(next)) return current;
  const db = await getDb();
  await db.execute(
    "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [KEY, JSON.stringify(next)],
  );
  return next;
}

export function effectiveTheme(preferences: Preferences, systemDark: boolean): "light" | "dark" {
  if (preferences.theme === "system") return systemDark ? "dark" : "light";
  return preferences.theme;
}

export function effectiveReducedMotion(preferences: Preferences, systemReduced: boolean): boolean {
  return preferences.reducedMotion === "on" || systemReduced;
}
