// Daftar klip audio lokal. Semua URL lokal/ter-embed; tidak ada URL eksternal.
// PILOT-AGENT-1: klip prolog + bab 11-12 (berlisensi Supertonic), pratinjau
// avatar, dan SFX berkas digabung dari story-media.generated.ts.
import contoh from "../assets/audio/a1-u01-srs-12-contoh.wav";
import budi from "../assets/audio/u01-budi-perkenalan.wav";
import anna from "../assets/audio/bacaan-hallo-ich-bin-anna.wav";
import ambience from "../assets/audio/im-cafe-ruang-tenang.opus";
import idle from "../assets/audio/idle-jelajah-felt-70bpm.opus";
import {
  AVATAR_HALLO, PLAYER_RESPONSE, PROLOG_AUDIO, STORY_AUDIO, STORY_SFX,
} from "./story-media.generated";

export type AudioAsset = { id: string; src: string; kind: "speech" | "ambience" | "music" | "sfx" };

const BASE: Record<string, AudioAsset> = {
  "speech:ich-heisse-alex": { id: "speech:ich-heisse-alex", src: contoh, kind: "speech" },
  "speech:hallo-ich-heisse-budi": { id: "speech:hallo-ich-heisse-budi", src: budi, kind: "speech" },
  "speech:bacaan-anna": { id: "speech:bacaan-anna", src: anna, kind: "speech" },
  "ambience:ruang-tenang": { id: "ambience:ruang-tenang", src: ambience, kind: "ambience" },
  "music:idle-jelajah": { id: "music:idle-jelajah", src: idle, kind: "music" },
};

const MERGED: Record<string, AudioAsset> = { ...BASE };
for (const [key, clip] of Object.entries(PROLOG_AUDIO)) {
  MERGED[`prolog:${key}`] = { id: `prolog:${key}`, src: clip.src, kind: "speech" };
}
for (const [key, clip] of Object.entries(STORY_AUDIO)) {
  MERGED[key] = { id: key, src: clip.src, kind: "speech" };
}
for (const [pid, src] of Object.entries(AVATAR_HALLO)) {
  MERGED[`avatar:${pid}:hallo`] = { id: `avatar:${pid}:hallo`, src, kind: "speech" };
}
for (const [pidWord, src] of Object.entries(PLAYER_RESPONSE)) {
  MERGED[`avatar:${pidWord}`] = { id: `avatar:${pidWord}`, src, kind: "speech" };
}
for (const [sfxId, src] of Object.entries(STORY_SFX)) {
  MERGED[`sfx:${sfxId}`] = { id: `sfx:${sfxId}`, src, kind: "sfx" };
}

export const AUDIO: Record<string, AudioAsset> = MERGED;
export const AUDIO_FILES = Object.values(AUDIO).map((asset) => asset.id);

/**
 * Id klip pemain memakai pola ".player-{avatar}" (variasi per avatar produksi).
 * Fungsi ini menggantikan {avatar} dengan characterId pemain; profil lama tanpa
 * characterId memakai player-01 sebagai baku (Mandat §5.3: suara sesuai ID).
 */
export function resolveAudio(asset: string | undefined, characterId?: string): string | undefined {
  if (!asset) return undefined;
  if (!asset.includes("{avatar}")) return asset;
  const id = characterId ?? "player-01";
  return asset.replace(/\{avatar\}/g, id);
}
