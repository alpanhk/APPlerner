import type { Attempt, Game } from "@/story/types";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
}

export interface ProgressRow {
  chapterId: string;
  status: "aktif" | "selesai";
  state: Game | null;
  notes: string[];
}

export interface ProfileData {
  profile: Profile;
  progress: ProgressRow[];
  attempts: Attempt[];
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : "Terjadi gangguan. Coba lagi.";
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  create: (name: string, avatar: string) => call<{ profile: Profile }>("/api/profiles", { method: "POST", body: JSON.stringify({ name, avatar }) }),
  load: (id: string) => call<ProfileData>(`/api/profiles/${id}`),
  remove: (id: string) => call<{ ok: boolean }>(`/api/profiles/${id}`, { method: "DELETE" }),
  saveProgress: (id: string, g: Game) =>
    call<{ ok: boolean }>(`/api/profiles/${id}/progress`, {
      method: "PUT",
      keepalive: true,
      body: JSON.stringify({ chapterId: g.chapterId, state: g.done ? null : g, notes: g.notes, done: g.done }),
    }),
  saveAttempt: (id: string, a: Attempt) => call<{ ok: boolean }>(`/api/profiles/${id}/attempts`, { method: "POST", keepalive: true, body: JSON.stringify(a) }),
};

// Profil yang pernah dibuat di perangkat ini.
const KEY_IDS = "lernen.profiles";
const KEY_ACTIVE = "lernen.active";

export const device = {
  ids(): string[] {
    try {
      const v: unknown = JSON.parse(localStorage.getItem(KEY_IDS) ?? "[]");
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  },
  add(id: string) {
    localStorage.setItem(KEY_IDS, JSON.stringify([...new Set([...device.ids(), id])]));
    localStorage.setItem(KEY_ACTIVE, id);
  },
  forget(id: string) {
    localStorage.setItem(KEY_IDS, JSON.stringify(device.ids().filter((x) => x !== id)));
    if (localStorage.getItem(KEY_ACTIVE) === id) localStorage.removeItem(KEY_ACTIVE);
  },
  active: () => localStorage.getItem(KEY_ACTIVE),
  setActive(id: string | null) {
    if (id) localStorage.setItem(KEY_ACTIVE, id);
    else localStorage.removeItem(KEY_ACTIVE);
  },
};
