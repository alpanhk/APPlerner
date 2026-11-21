// ===== Manifest media =====
// Agen gambar/audio dapat mengganti aset dengan mengubah entri di sini.
// status: "github" = aset asli repo APPlerner, "generated" = ilustrasi pengganti,
// "synth" = efek disintesis WebAudio, "tts" = suara browser de-DE.

import { STORY_BG } from "./story-media.generated";
import bgKamar from "../assets/bg/kamar.jpg";
import bgJendela from "../assets/bg/jendela.jpg";
import bgPintu from "../assets/bg/pintu.jpg";
import bgJalan from "../assets/bg/jalan.jpg";
import bgJudul from "../assets/bg/judul.jpg";

import clipIchHeisseAlex from "../assets/audio/a1-u01-srs-12-contoh.wav";
import clipBudi from "../assets/audio/u01-budi-perkenalan.wav";
import clipAnna from "../assets/audio/bacaan-hallo-ich-bin-anna.wav";
import ambRuang from "../assets/audio/im-cafe-ruang-tenang.opus";
import musikIdle from "../assets/audio/idle-jelajah-felt-70bpm.opus";

import sceneU01 from "../assets/scenes/u01-perkenalan.webp";
import sceneU02a from "../assets/scenes/u02-jadwal.webp";
import sceneU02b from "../assets/scenes/u02-pasar.webp";
import sceneU03 from "../assets/scenes/u03-keluarga.webp";
import sceneU04 from "../assets/scenes/u04-makan.webp";
import sceneU05 from "../assets/scenes/u05-toko.webp";
import sceneU06 from "../assets/scenes/u06-rumah.webp";
import sceneU07 from "../assets/scenes/u07-kota-arah.webp";
import sceneU08 from "../assets/scenes/u08-hari-kerja.webp";
import sceneU09 from "../assets/scenes/u09-klinik.webp";
import sceneU10 from "../assets/scenes/u10-renang.webp";
import sceneU11 from "../assets/scenes/u11-stasiun.webp";
import sceneU12 from "../assets/scenes/u12-telepon-pesan.webp";

import c1 from "../assets/covers/cover-1.webp";
import c2 from "../assets/covers/cover-2.webp";
import c3 from "../assets/covers/cover-3.webp";
import c4 from "../assets/covers/cover-4.webp";
import c6 from "../assets/covers/cover-6.webp";
import c7 from "../assets/covers/cover-7.webp";
import c8 from "../assets/covers/cover-8.webp";
import c9 from "../assets/covers/cover-9.webp";
import c10 from "../assets/covers/cover-10.webp";
import c11 from "../assets/covers/cover-11.webp";
import c12 from "../assets/covers/cover-12.webp";
import c13 from "../assets/covers/cover-13.webp";
import c14 from "../assets/covers/cover-14.webp";
import c15 from "../assets/covers/cover-15.webp";
import c16 from "../assets/covers/cover-16.webp";
import c17 from "../assets/covers/cover-17.webp";
import c18 from "../assets/covers/cover-18.webp";
import c19 from "../assets/covers/cover-19.webp";

export type AssetStatus = "github" | "generated" | "synth" | "tts";
export type AssetKind = "background" | "speech" | "music" | "ambience" | "sfx" | "scene" | "cover";

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  src: string;
  status: AssetStatus;
  source?: string; // jalur asli di repo
  sentence?: string;
  speaker?: string;
  note?: string;
}

export const MEDIA: Record<string, MediaAsset> = {
  "bg:kamar": { id: "bg:kamar", kind: "background", src: bgKamar, status: "generated", note: "Kamar dengan catatan, jadwal trem, jendela" },
  "bg:jendela": { id: "bg:jendela", kind: "background", src: bgJendela, status: "generated", note: "Pemandangan jalan dari jendela" },
  "bg:pintu": { id: "bg:pintu", kind: "background", src: bgPintu, status: "generated", note: "Ambang pintu apartemen" },
  "bg:jalan": { id: "bg:jalan", kind: "background", src: bgJalan, status: "generated", note: "Jalan permukiman: fasad, sepeda, kotak surat, pot bunga" },
  "bg:judul": { id: "bg:judul", kind: "background", src: bgJudul, status: "generated", note: "Panorama kota untuk layar judul" },

  "speech:ich-heisse-alex": {
    id: "speech:ich-heisse-alex",
    kind: "speech",
    src: clipIchHeisseAlex,
    status: "github",
    source: "public/audio/tuturan/a1-u01-srs-12-contoh.wav",
    sentence: "Ich heiße Alex.",
    speaker: "Tutor",
  },
  "speech:hallo-ich-heisse-budi": {
    id: "speech:hallo-ich-heisse-budi",
    kind: "speech",
    src: clipBudi,
    status: "github",
    source: "public/audio/tuturan/u01-budi-perkenalan.wav",
    sentence: "Hallo, ich heiße Budi.",
    speaker: "Budi",
  },
  "speech:bacaan-anna": {
    id: "speech:bacaan-anna",
    kind: "speech",
    src: clipAnna,
    status: "github",
    source: "public/audio/pratinjau/bacaan-hallo-ich-bin-anna.wav",
    sentence: "Hallo, ich bin Anna (pratinjau bacaan)",
    speaker: "Anna",
  },
  "ambience:ruang-tenang": {
    id: "ambience:ruang-tenang",
    kind: "ambience",
    src: ambRuang,
    status: "github",
    source: "public/audio/ambience/im-cafe-ruang-tenang.opus",
    note: "Dipakai sebagai suasana rumah & jalan (pengganti; ambience permukiman belum tersedia)",
  },
  "music:idle-jelajah": {
    id: "music:idle-jelajah",
    kind: "music",
    src: musikIdle,
    status: "github",
    source: "public/audio/idle/idle-jelajah-felt-70bpm.opus",
    note: "Musik latar pelan",
  },
  "sfx:knock": { id: "sfx:knock", kind: "sfx", src: "", status: "synth", note: "Dua ketukan pintu" },
  "sfx:hinge": { id: "sfx:hinge", kind: "sfx", src: "", status: "synth", note: "Engsel pintu" },
  "sfx:bell": { id: "sfx:bell", kind: "sfx", src: "", status: "synth", note: "Bel sepeda" },
  "sfx:paper": { id: "sfx:paper", kind: "sfx", src: "", status: "synth", note: "Kertas dibuka" },
  "sfx:tram": { id: "sfx:tram", kind: "sfx", src: "", status: "synth", note: "Trem lewat di kejauhan" },
};

/** Ilustrasi situasi per unit A1 dari repo (public/media/scenes). */
export const UNIT_SCENES: Record<number, { src: string; title: string }[]> = {
  1: [{ src: sceneU01, title: "Anna dan Budi berkenalan" }],
  2: [
    { src: sceneU02a, title: "Jam dan jadwal kursus bahasa" },
    { src: sceneU02b, title: "Berbelanja di pasar mingguan" },
  ],
  3: [{ src: sceneU03, title: "Keluarga kecil di rumah" }],
  4: [{ src: sceneU04, title: "Menyiapkan makan malam di rumah" }],
  5: [{ src: sceneU05, title: "Toko pakaian" }],
  6: [{ src: sceneU06, title: "Letak benda di ruang tamu" }],
  7: [{ src: sceneU07, title: "Tempat dan arah di kota" }],
  8: [{ src: sceneU08, title: "Percakapan rekan kerja di kantor" }],
  9: [{ src: sceneU09, title: "Pemeriksaan singkat di klinik" }],
  10: [{ src: sceneU10, title: "Merencanakan ke kolam renang" }],
  11: [{ src: sceneU11, title: "Peron dan informasi stasiun" }],
  12: [{ src: sceneU12, title: "Menelepon dan membuat janji" }],
};

/** Sampul khusus per textId (dari public/klab/sampul). */
export const COVER_SRC: Record<number, string> = {
  1: c1, 2: c2, 3: c3, 4: c4, 6: c6, 7: c7, 8: c8, 9: c9, 10: c10, 11: c11,
  12: c12, 13: c13, 14: c14, 15: c15, 16: c16, 17: c17, 18: c18, 19: c19,
};

export function bgSrc(id: string): string {
  // PILOT-AGENT-1: latar bab produksi (ruang-warga/peron/stasiun/ambang-rumah)
  // datang dari story-media.generated; latar lama tetap dari MEDIA.
  return MEDIA["bg:" + id]?.src ?? STORY_BG[id] ?? "";
}
