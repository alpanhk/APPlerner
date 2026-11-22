// ROMBAK UI/UX / 1a — SATU resolver media (cover, scene, background).
// Sumber kebenaran: manifest referensi terkunci (96 berkas, agregat a562f171…)
// yang disalin ke src/data/ref-visual-novel-manifest.json. Aset media dipakai
// dari jalur public/ yang sama dengan manifest, sehingga Tauri frontendDist
// ("../dist") membawanya ke EXE tanpa langkah tambahan.
//
// Semua konsumen (rak, cuplikan, Stage, Koleksi, MediaIndex) memberi masukan
// lewat modul ini. `coverResolver.ts` adalah adapter sampul milik 4a yang
// dipakai internal di sini; tidak ada resolver sampul kedua untuk UI.
import manifest from "../data/ref-visual-novel-manifest.json";
import { allCovers, resolveCover } from "./coverResolver";

export type ManifestRow = { path: string; bytes: number; sha256: string };
export type MediaKind = "cover" | "scene" | "bg";
export type MediaInfo = {
  /** Identitas stabil: cover:10, scene:u01-perkenalan, bg:kamar. */
  id: string;
  kind: MediaKind;
  /** URL public yang sama untuk semua pemakai. */
  src: string;
  /** Jalur berkas di manifest referensi (bukti asal). */
  path?: string;
  sha256?: string;
  /** Judul/ keterangan bila tersedia dari adapter sampul. */
  label?: string;
};

const rows = manifest.rows as ManifestRow[];

const SCENE_RE = /^public\/media\/scenes\/(u\d+-[^/]+)\/scene\.webp$/;
const COVER_RE = /^public\/klab\/sampul\/(\d+)\/cover\.webp$/;
const BG_RE = /^src\/assets\/bg\/([a-z-]+)\.jpg$/;

export const manifestAggregate = manifest.aggregate_sha256;
export const manifestRows: readonly ManifestRow[] = rows;

/** 36 berkas media unik setelah dedup hash (18 cover + 13 scene + 5 bg). */
export function allMedia(): MediaInfo[] {
  const seen = new Set<string>();
  const result: MediaInfo[] = [];
  for (const row of rows) {
    const cover = row.path.match(COVER_RE);
    const scene = row.path.match(SCENE_RE);
    const bg = row.path.match(BG_RE);
    if (!cover && !scene && !bg) continue;
    if (seen.has(row.sha256)) continue; // dedup hash: src/assets vs public/klab
    seen.add(row.sha256);
    if (cover) {
      const textId = Number(cover[1]);
      result.push({
        id: `cover:${textId}`, kind: "cover",
        src: `/klab/sampul/${textId}/cover.webp`,
        path: row.path, sha256: row.sha256,
        label: resolveCover(textId)?.title,
      });
    } else if (scene) {
      result.push({
        id: `scene:${scene[1]}`, kind: "scene",
        src: `/media/scenes/${scene[1]}/scene.webp`,
        path: row.path, sha256: row.sha256,
      });
    } else if (bg) {
      result.push({
        id: `bg:${bg[1]}`, kind: "bg",
        src: `/media/bg/${bg[1]}.jpg`,
        path: row.path, sha256: row.sha256,
      });
    }
  }
  return result;
}

const media = allMedia();
const byId = new Map(media.map((item) => [item.id, item]));

/** Sampul untuk rak dan cuplikan. 67 textId: 18 khusus + 49 tematik. */
export function coverSrc(textId: number | string): string | undefined {
  const cover = resolveCover(typeof textId === "number" ? textId : Number(textId));
  if (cover?.src) return cover.src;
  return byId.get(`cover:${textId}`)?.src;
}

/** Kunci adegan boleh "u01-perkenalan" atau nomor unit 1..12. */
export function sceneSrc(unitOrKey: number | string): string | undefined {
  const key = String(unitOrKey);
  if (/^u\d+-/.test(key)) return byId.get(`scene:${key}`)?.src;
  const unit = Number(key);
  if (!Number.isInteger(unit)) return undefined;
  const prefixed = `u${String(unit).padStart(2, "0")}-`;
  return media.find((item) => item.kind === "scene" && item.id.startsWith(`scene:${prefixed}`))?.src;
}

/** Latar panggung: kamar | jendela | pintu | jalan | judul. */
export function bgSrc(id: string): string | undefined {
  return byId.get(`bg:${id}`)?.src;
}

/** Satu titik masuk untuk Stage/Koleksi/otomasi. */
export function resolveMedia(kind: MediaKind, id: number | string): MediaInfo | null {
  if (kind === "cover") {
    const textId = Number(id);
    const cover = resolveCover(textId);
    return {
      id: `cover:${textId}`, kind: "cover",
      src: cover?.src ?? byId.get(`cover:${textId}`)?.src ?? "",
      path: cover ? `public/klab/sampul/${textId}/cover.webp` : undefined,
      sha256: byId.get(`cover:${textId}`)?.sha256,
      label: cover?.title,
    };
  }
  if (kind === "scene") {
    const src = sceneSrc(id);
    return src ? { id: `scene:${id}`, kind: "scene", src } : null;
  }
  const src = bgSrc(String(id));
  return src ? { id: `bg:${id}`, kind: "bg", src } : null;
}

export { allCovers, resolveCover };
export type { Cover, CoverKind } from "./coverResolver";
