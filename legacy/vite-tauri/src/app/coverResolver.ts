// RAK-DATA-05: adapter resmi ke resolver milik 4a (src/klab/sampleVisuals.ts).
// Satu sumber kebenaran untuk rak dan cuplikan; tidak ada resolver kedua.
// cover-map.json tetap dipakai sebagai bukti hash/inventaris, bukan sebagai
// sumber keputusan tampilan.
import { cleanLabel, coverForTextId, type CoverInfo } from "../klab/sampleVisuals";
import evidence from "../data/cover-map.json";

export type CoverKind = "khusus" | "tematik";
export type Cover = {
  textId: number;
  title: string;
  level: string;
  label: string;
  src: string;
  kind: CoverKind;
  status: "verified" | "tersedia";
  reason: string;
  hash?: string;
};

const hashes = new Map<number, string>(
  evidence.covers.filter((c) => c.hash).map((c) => [c.textId, c.hash as string]),
);

function adapt(info: CoverInfo): Cover {
  return {
    textId: info.textId,
    title: info.title,
    level: info.level,
    label: cleanLabel(`${info.level} · ${info.title}`) || info.title,
    src: info.src,
    kind: info.kind === "special" ? "khusus" : "tematik",
    status: info.kind === "special" ? "verified" : "tersedia",
    reason: info.reason,
    hash: hashes.get(info.textId),
  };
}

export function resolveCover(textId: number): Cover | null {
  const info = coverForTextId(textId);
  return info ? adapt(info) : null;
}

export function allCovers(): Cover[] {
  return evidence.covers
    .map((cover) => resolveCover(cover.textId))
    .filter((cover): cover is Cover => Boolean(cover));
}

export { cleanLabel };
