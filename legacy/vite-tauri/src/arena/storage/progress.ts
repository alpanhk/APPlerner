// ===== Penyimpanan progres & preferensi =====
// Antarmuka ProgressStore memungkinkan penggantian localStorage → SQLite
// pada aplikasi Windows tanpa mengubah komponen UI.

import { profileKey } from "./profiles";
import type { Progress, Settings, PlayerProfile } from "../types";

export const PROGRESS_KEY = "lernen.progress.v1";
export const SETTINGS_KEY = "lernen.settings.v1";
export const PROGRESS_VERSION = 1;

export interface ProgressStore {
  loadProgress(): Progress | null;
  saveProgress(p: Progress): void;
  clearProgress(): void;
  loadSettings(): Settings;
  saveSettings(s: Settings): void;
}

export const DEFAULT_SETTINGS: Settings = {
  textSize: "normal",
  soundOn: true,
  volDialog: 1,
  volMusic: 0.5,
  volAmbience: 0.6,
  volSfx: 0.8,
  reducedMotion: false,
};

export const DEFAULT_PLAYER: PlayerProfile = {
  name: "",
  hair: "short",
  hairColor: "#2f2520",
  outfit: "#2c3e6b",
  skin: "#e6b48f",
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const localStore: ProgressStore = {
  loadProgress() {
    const p = safeParse<Progress>(localStorage.getItem(profileKey(PROGRESS_KEY)));
    if (!p || p.version !== PROGRESS_VERSION || !p.player?.name) return null;
    return p;
  },
  saveProgress(p: Progress) {
    try {
      localStorage.setItem(profileKey(PROGRESS_KEY), JSON.stringify({ ...p, updatedAt: Date.now() }));
    } catch {
      /* penyimpanan penuh / dinonaktifkan: lanjutkan tanpa simpan */
    }
  },
  clearProgress() {
    localStorage.removeItem(profileKey(PROGRESS_KEY));
  },
  loadSettings() {
    const s = safeParse<Partial<Settings>>(localStorage.getItem(SETTINGS_KEY));
    return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
  },
  saveSettings(s: Settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {
      /* abaikan */
    }
  },
};
