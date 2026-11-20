import type { ComponentType } from "react";
import type { PageDef } from "../Layout";
import HariIni from "./HariIni";
import Kurikulum from "./Kurikulum";
import Drill from "./Drill";
import Kosakata from "./Kosakata";
import Membaca from "./Membaca";
import Latihan from "./Latihan";
import UjiTiruan from "./UjiTiruan";
import Statistik from "./Statistik";
import Pengaturan from "./Pengaturan";

// Urutan navigasi mengikuti PRD §10.
export const ALL_PAGES: PageDef[] = [
  { id: "hari-ini", label: "Hari Ini", hint: "Antrian hari ini" },
  { id: "kurikulum", label: "Kurikulum", hint: "Level & unit" },
  { id: "drill", label: "Drill", hint: "D1-D10" },
  { id: "kosakata", label: "Kosakata", hint: "Deck & kartu" },
  { id: "membaca", label: "Membaca", hint: "Teks berjenjang" },
  { id: "latihan", label: "Latihan", hint: "Hören & Schreiben" },
  { id: "uji-a1", label: "Uji A1", hint: "Uji tiruan" },
  { id: "statistik", label: "Statistik", hint: "Progres & streak" },
  { id: "pengaturan", label: "Pengaturan", hint: "Preferensi" },
];

export const PAGE_COMPONENTS: Record<string, ComponentType> = {
  "hari-ini": HariIni,
  kurikulum: Kurikulum,
  drill: Drill,
  kosakata: Kosakata,
  membaca: Membaca,
  latihan: Latihan,
  "uji-a1": UjiTiruan,
  statistik: Statistik,
  pengaturan: Pengaturan,
};
