// Navigasi antar-layar dari dalam konten (mis. "latih kelemahan ini" di Statistik).
import { create } from "zustand";
import type { DrillCode } from "../drills/items";

type NavState = {
  page: string;
  pendingDrill: DrillCode | null;
  setPage: (page: string) => void;
  startDrill: (code: DrillCode) => void;
  takePendingDrill: () => DrillCode | null;
};

export const useNav = create<NavState>((set, get) => ({
  page: "hari-ini",
  pendingDrill: null,
  setPage: (page) => set({ page }),
  startDrill: (code) => set({ page: "drill", pendingDrill: code }),
  takePendingDrill: () => {
    const pending = get().pendingDrill;
    if (pending) set({ pendingDrill: null });
    return pending;
  },
}));
