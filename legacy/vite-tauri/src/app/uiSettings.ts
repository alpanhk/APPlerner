// INTERAKSI-LERNEN-01 / 1a: preferensi lintas halaman yang nyata.
// Suara default MATI; gerakan dikurangi aplikasi setara prefers-reduced-motion.
import getDb from "../stores/db";

const KEY = "klab_ui_settings_v1";

export type UiSettings = {
  version: 1;
  soundEnabled: boolean;
  reducedMotion: "system" | "on";
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  version: 1,
  soundEnabled: false,
  reducedMotion: "system",
};

export async function loadUiSettings(): Promise<UiSettings> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [KEY]);
  if (!rows.length) return DEFAULT_UI_SETTINGS;
  try {
    const value = JSON.parse(rows[0].value) as Partial<UiSettings>;
    return {
      version: 1,
      soundEnabled: typeof value.soundEnabled === "boolean" ? value.soundEnabled : false,
      reducedMotion: value.reducedMotion === "on" ? "on" : "system",
    };
  } catch { return DEFAULT_UI_SETTINGS; }
}

export async function saveUiSettings(change: Partial<Omit<UiSettings, "version">>): Promise<UiSettings> {
  const current = await loadUiSettings();
  const next: UiSettings = {
    version: 1,
    soundEnabled: typeof change.soundEnabled === "boolean" ? change.soundEnabled : current.soundEnabled,
    reducedMotion: change.reducedMotion === "on" || change.reducedMotion === "system"
      ? change.reducedMotion : current.reducedMotion,
  };
  const db = await getDb();
  await db.execute(
    "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [KEY, JSON.stringify(next)],
  );
  return next;
}

export function effectiveReducedMotion(settings: UiSettings, systemPrefersReduced: boolean): boolean {
  return settings.reducedMotion === "on" || systemPrefersReduced;
}
