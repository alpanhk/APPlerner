// RAK-DIALOG-20261120 / 4a — resolver sampul tunggal untuk rak & cuplikan.
// 18 sampul khusus verified (1a) + 49 sampul tematik/editorial dari stok nyata.
// Sumber kebenaran: coverManifest.json. Tidak ada label internal yang ditampilkan.
import coverManifest from './coverManifest.json';
import hariIni from '../assets/klab/sampel/hari-ini/bab-aktif-anna.webp';
import jelajah from '../assets/klab/sampel/jelajah/rak-anna.webp';
import bacaan from '../assets/klab/sampel/bacaan/pembuka-anna.webp';
import dialogPercakapan from '../assets/klab/sampel/dialog-percakapan/anna-budi-dua-giliran.png';
import mendengar from '../assets/klab/sampel/mendengar/im-cafe-sebelum-audio.png';
import materiTataBahasa from '../assets/klab/sampel/materi-tata-bahasa/sampel.png';
import kosakata from '../assets/klab/sampel/kosakata/sampel.png';
import latihanMenulis from '../assets/klab/sampel/latihan-menulis/sampel.webp';
import catatan from '../assets/klab/sampel/catatan/sumber-catatan-anna.webp';
import profil from '../assets/klab/sampel/profil/progres-anna.webp';

export const sampleVisuals = {
  'hari-ini': hariIni,
  jelajah,
  bacaan,
  'dialog-percakapan': dialogPercakapan,
  mendengar,
  'materi-tata-bahasa': materiTataBahasa,
  kosakata,
  'latihan-menulis': latihanMenulis,
  catatan,
  profil,
} as const;

export type SampleScreen = keyof typeof sampleVisuals;

export type CoverKind = 'special' | 'thematic';
export type CoverInfo = {
  src: string;
  kind: CoverKind;
  textId: number;
  title: string;
  level: string;
  reason: string;
};

type ManifestCover = { textId: number; kind: string; title: string; level: string; source: string; reason: string };
const covers = coverManifest.covers as ManifestCover[];
const coverById = new Map<number, CoverInfo>();

for (const cover of covers) {
  const src = cover.kind === 'special'
    ? `/klab/sampul/${cover.textId}/cover.webp`
    : `/klab/tematik/${cover.source.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '')}.webp`;
  coverById.set(cover.textId, {
    src,
    kind: cover.kind === 'thematic' ? 'thematic' : 'special',
    textId: cover.textId,
    title: cover.title,
    level: cover.level,
    reason: cover.reason,
  });
}

/** Sampul untuk rak DAN cuplikan — selalu sama untuk satu textId. */
export function coverForTextId(textId: number | string): CoverInfo | undefined {
  const id = typeof textId === 'number' ? textId : Number(textId);
  return Number.isInteger(id) ? coverById.get(id) : undefined;
}

export function coverSrc(textId: number | string): string | undefined {
  return coverForTextId(textId)?.src;
}

/** Kompatibilitas dengan pemanggil lama. */
export function verifiedCover(textId: number): string | undefined {
  const cover = coverById.get(textId);
  return cover?.kind === 'special' ? cover.src : undefined;
}

export function coverFromBookId(id: string): string | undefined {
  return coverSrc(id);
}

/** Buang label internal ("seed") dan duplikasi level dari tags data. */
export function cleanLabel(raw?: string): string {
  if (!raw) return '';
  return raw
    .split('·')
    .map((part) => part.trim().replace(/\bseed\b/gi, '').trim())
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(' · ');
}
