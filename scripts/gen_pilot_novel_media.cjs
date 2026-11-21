#!/usr/bin/env node
// PILOT-AGENT-1 · generator media visual novel (peran Media/suara Mandat §3).
// Menyalin HANYA aset produksi yang dipakai kandidat (frame karakter pilihan,
// latar bab 11-12, klip suara berlisensi Supertonic, SFX sintetis) ke
// src/klab/novel/assets, lalu memancarkan manifest TypeScript ter-generate.
// Idempoten; sumber tidak pernah diubah atau dihapus.
//
// Sumber:
//  - lernen-design/outputs/pemeran-visual-novel-a1  (frame pemain & NPC, suara)
//  - lernen-design/outputs/aset-chapter-a1          (karakter bab, latar, SFX)
//  - public/a1-story/audio/a1-ch11|a1-ch12          (klip tuturan bab, MP3 runtime)
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..");
const LD = process.env.LERNEN_DESIGN_OUTPUTS || path.join(root, "..", "lernen-design", "outputs");
const PEMERAN = path.join(LD, "pemeran-visual-novel-a1");
const ASET = path.join(LD, "aset-chapter-a1");
const ASSETS = path.join(REPO, "src/klab/novel/assets");
const DATA = path.join(REPO, "src/klab/novel/data");

const fail = (msg) => { console.error(`GEN GAGAL: ${msg}`); process.exit(1); };
const copy = (from, to) => {
  if (!fs.existsSync(from)) fail(`sumber tidak ada: ${from}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return to;
};

// ---------- 1. Frame karakter ----------
// speakOpen/speakSmall menerima dua penamaan paket: "speak-*" (players-a)
// dan "talk-*" (npcs, players-b, karakter bab) — dipetakan ke fungsi sama.
function framesOf(dir) {
  const probe = (...names) => names.find((n) => fs.existsSync(path.join(dir, n + ".webp")));
  const speakOpen = probe("speak-open", "talk-open");
  const speakSmall = probe("speak-small", "talk-small");
  if (!speakOpen || !speakSmall) fail(`frame bicara tidak ditemukan di ${dir}`);
  return {
    neutral: "neutral", smile: "smile", question: "question",
    speakOpen, speakSmall,
  };
}

const CHAR_SOURCES = [
  ["player-01", path.join(PEMERAN, "players-a/player-01")],
  ["player-02", path.join(PEMERAN, "players-a/player-02")],
  ["player-03", path.join(PEMERAN, "players-b/player-03")],
  ["player-04", path.join(PEMERAN, "players-b/player-04")],
  ["mia", path.join(PEMERAN, "npcs/mia")],
  ["tutor", path.join(PEMERAN, "npcs/tutor")],
  ["tetangga", path.join(PEMERAN, "npcs/tetangga")],
  ["pos", path.join(PEMERAN, "npcs/pos")],
  ["petugas-stasiun", path.join(ASET, "karakter/petugas-stasiun")],
  ["eva", path.join(ASET, "karakter/eva")],
  ["pendatang-baru", path.join(ASET, "karakter/pendatang-baru")],
];

const charImports = [];   // [varName, relPath, key, frame]
for (const [id, dir] of CHAR_SOURCES) {
  const frames = framesOf(dir);
  for (const frame of ["neutral", "smile", "question", "speakOpen", "speakSmall"]) {
    const srcName = frames[frame];
    const rel = `../assets/characters/${id}/${frame}.webp`;
    copy(path.join(dir, srcName + ".webp"), path.join(ASSETS, "characters", id, frame + ".webp"));
    charImports.push([`c_${id.replace(/-/g, "_")}_${frame}`, rel, id, frame]);
  }
}

// ---------- 2. Latar bab 11-12 ----------
const BG_SOURCES = [
  ["ruang-warga", path.join(ASET, "latar/master/ruang-warga.webp")],
  ["peron", path.join(ASET, "latar/master/peron.webp")],
  ["stasiun", path.join(ASET, "latar/master/stasiun.webp")],
  ["ambang-rumah", path.join(ASET, "latar/master/ambang-rumah.webp")],
];
const bgImports = [];
for (const [id, from] of BG_SOURCES) {
  const rel = `../assets/bg-story/${id}.webp`;
  copy(from, path.join(ASSETS, "bg-story", id + ".webp"));
  bgImports.push([`bg_${id.replace(/-/g, "_")}`, rel, id]);
}

// ---------- 3. Suara pemain (pratinjau avatar + respons tetap) ----------
const PLAYER_IDS = ["player-01", "player-02", "player-03", "player-04"];
const avatarHallo = {};
const playerResponse = {};
for (const pid of PLAYER_IDS) {
  const base = path.join(PEMERAN, "voices/runtime", pid);
  const hallo = copy(path.join(base, "respons-hallo.mp3"),
    path.join(ASSETS, "voices/avatar", pid, "respons-hallo.mp3"));
  avatarHallo[pid] = hallo;
  for (const word of ["guten-morgen", "ja", "nein"]) {
    copy(path.join(base, `respons-${word}.mp3`),
      path.join(ASSETS, "voices/avatar", pid, `respons-${word}.mp3`));
    playerResponse[`${pid}:${word}`] = `../assets/voices/avatar/${pid}/respons-${word}.mp3`;
  }
}

// ---------- 4. Klip prolog (runtime MP3, sesuai nama node) ----------
const PROLOG_CLIP_CHARS = ["mia", "pos", "tetangga", "tutor"];
const prologClips = {};
for (const char of PROLOG_CLIP_CHARS) {
  const dir = path.join(PEMERAN, "voices/runtime", char);
  if (!fs.existsSync(dir)) fail(`folder suara prolog tidak ada: ${dir}`);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".mp3")) continue;
    const key = f.replace(/\.mp3$/, "");
    copy(path.join(dir, f), path.join(ASSETS, "voices/prolog", char, f));
    prologClips[key] = { src: `../assets/voices/prolog/${char}/${f}`, char };
  }
}

// ---------- 5. Klip bab 11-12 dari manifest a1-story ----------
const storyClips = {};
for (const chapter of ["a1-ch11", "a1-ch12"]) {
  const manifestPath = path.join(REPO, "public/a1-story/audio", chapter, "manifest.json");
  if (!fs.existsSync(manifestPath)) fail(`manifest bab tidak ada: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const assets = manifest.assets ?? [];
  if (!assets.length) fail(`manifest ${chapter} kosong`);
  for (const a of assets) {
    const rel = a.runtime?.path;
    if (!rel) continue; // aset tanpa runtime (mis. dynamic-unwritten) dilewati
    const from = path.join(REPO, "public/a1-story/audio", rel);
    const to = path.join(ASSETS, "voices/story", rel);
    copy(from, to);
    storyClips[a.assetId] = {
      src: `../assets/voices/story/${rel}`,
      char: a.characterId,
      scene: a.sceneId ?? "",
      transcript: a.transcript ?? "",
    };
  }
}

// ---------- 6. SFX bab (Opus runtime dari sound-design) ----------
const SFX_SOURCES = [
  ["peron-chime", "a1-sfx-peron-chime.opus"],
  ["telepon", "a1-sfx-telepon.opus"],
  ["kertas", "a1-sfx-kertas-surat.opus"],
];
const sfxImports = [];
for (const [id, file] of SFX_SOURCES) {
  const rel = `../assets/sfx-story/${file}`;
  copy(path.join(ASET, "audio/sound-design", file), path.join(ASSETS, "sfx-story", file));
  sfxImports.push([`sfx_${id.replace(/-/g, "_")}`, rel, id]);
}

// ---------- 7. Emit manifest TypeScript ----------
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const ts = [];
ts.push("// BERKAS TER-GENERATE oleh scripts/gen_pilot_novel_media.cjs — jangan sunting tangan.");
ts.push("// PILOT-AGENT-1: aset produksi yang benar-benar dipakai kandidat, salinan");
ts.push("// berlisensi dari lernen-design/outputs + public/a1-story/audio (MP3 runtime).");
ts.push("// Menjalankan ulang generator idempoten; sumber tidak diubah.");
ts.push("");
for (const [v, rel] of charImports) ts.push(`import ${v} from "${rel}";`);
for (const [v, rel] of bgImports) ts.push(`import ${v} from "${rel}";`);
for (const [v, rel] of sfxImports) ts.push(`import ${v} from "${rel}";`);
for (const pid of PLAYER_IDS) {
  ts.push(`import hallo_${pid.replace(/-/g, "_")} from "../assets/voices/avatar/${pid}/respons-hallo.mp3";`);
}
ts.push("");
ts.push("export interface CharFrames {");
ts.push("  neutral: string; smile: string; question: string; speakOpen: string; speakSmall: string;");
ts.push("}");
ts.push("");
ts.push("export const CHAR_FRAMES: Record<string, CharFrames> = {");
for (const id of CHAR_SOURCES.map(([c]) => c)) {
  const k = id.replace(/-/g, "_");
  ts.push(`  "${id}": {`);
  ts.push(`    neutral: c_${k}_neutral, smile: c_${k}_smile, question: c_${k}_question,`);
  ts.push(`    speakOpen: c_${k}_speakOpen, speakSmall: c_${k}_speakSmall,`);
  ts.push("  },");
}
ts.push("};");
ts.push("");
ts.push("export const STORY_BG: Record<string, string> = {");
for (const [, , id] of bgImports) ts.push(`  "${id}": bg_${id.replace(/-/g, "_")},`);
ts.push("};");
ts.push("");
ts.push("export const STORY_SFX: Record<string, string> = {");
for (const [, , id] of sfxImports) ts.push(`  "${id}": sfx_${id.replace(/-/g, "_")},`);
ts.push("};");
ts.push("");
ts.push("/** \"Hallo!\" produksi per avatar — pratinjau \"Dengar suara\" (Mandat §4). */");
ts.push("export const AVATAR_HALLO: Record<string, string> = {");
for (const pid of PLAYER_IDS) ts.push(`  "${pid}": hallo_${pid.replace(/-/g, "_")},`);
ts.push("};");
ts.push("");
ts.push("/** Respons tetap pemain (guten-morgen/ja/nein) per avatar. */");
ts.push("export const PLAYER_RESPONSE: Record<string, string> = {");
for (const [k, v] of Object.entries(playerResponse)) ts.push(`  "${esc(k)}": "${esc(v)}",`);
ts.push("};");
ts.push("");
ts.push("/** Klip prolog berlisensi, kunci = nama berkas (mis. c_mia1-s01). */");
ts.push("export const PROLOG_AUDIO: Record<string, { src: string; char: string }> = {");
for (const [k, v] of Object.entries(prologClips)) ts.push(`  "${esc(k)}": { src: "${esc(v.src)}", char: "${esc(v.char)}" },`);
ts.push("};");
ts.push("");
ts.push("/** Klip bab 11-12; kunci = assetId jalur a1-story. */");
ts.push("export const STORY_AUDIO: Record<string, { src: string; char: string; scene: string; transcript: string }> = {");
for (const [k, v] of Object.entries(storyClips)) {
  ts.push(`  "${esc(k)}": { src: "${esc(v.src)}", char: "${esc(v.char)}", scene: "${esc(v.scene)}", transcript: "${esc(v.transcript)}" },`);
}
ts.push("};");
ts.push("");
ts.push("export const STORY_MEDIA_COUNTS = {");
ts.push(`  characters: ${CHAR_SOURCES.length},`);
ts.push(`  frames: ${charImports.length},`);
ts.push(`  bg: ${bgImports.length},`);
ts.push(`  sfx: ${sfxImports.length},`);
ts.push(`  prologClips: ${Object.keys(prologClips).length},`);
ts.push(`  storyClips: ${Object.keys(storyClips).length},`);
ts.push("};");
ts.push("");

fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(path.join(DATA, "story-media.generated.ts"), ts.join("\n"));
console.log(`OK characters=${CHAR_SOURCES.length} frames=${charImports.length} bg=${bgImports.length} sfx=${sfxImports.length} prolog=${Object.keys(prologClips).length} story=${Object.keys(storyClips).length}`);
