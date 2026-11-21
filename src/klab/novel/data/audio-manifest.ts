// Daftar klip audio lokal milik 2a. Hanya aset referensi yang sudah disiapkan.
// Semua URL lokal/ter-embed; tidak ada URL eksternal.
import contoh from "../assets/audio/a1-u01-srs-12-contoh.wav";
import budi from "../assets/audio/u01-budi-perkenalan.wav";
import anna from "../assets/audio/bacaan-hallo-ich-bin-anna.wav";
import ambience from "../assets/audio/im-cafe-ruang-tenang.opus";
import idle from "../assets/audio/idle-jelajah-felt-70bpm.opus";

export type AudioAsset = { id: string; src: string; kind: "speech" | "ambience" | "music" };

export const AUDIO: Record<string, AudioAsset> = {
  "speech:ich-heisse-alex": { id: "speech:ich-heisse-alex", src: contoh, kind: "speech" },
  "speech:hallo-ich-heisse-budi": { id: "speech:hallo-ich-heisse-budi", src: budi, kind: "speech" },
  "speech:bacaan-anna": { id: "speech:bacaan-anna", src: anna, kind: "speech" },
  "ambience:ruang-tenang": { id: "ambience:ruang-tenang", src: ambience, kind: "ambience" },
  "music:idle-jelajah": { id: "music:idle-jelajah", src: idle, kind: "music" },
};

export const AUDIO_FILES = Object.values(AUDIO).map((asset) => asset.id);
