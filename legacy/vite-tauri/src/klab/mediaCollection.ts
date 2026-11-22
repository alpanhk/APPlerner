// RAK-DIALOG-20261120 / 4a — adapter data koleksi untuk halaman Pratinjau media.
// Sumber kanonik: src/data/collection-map.json (1a, 80 item unik) + resolver
// sampul 4a untuk 49 judul tematik. Duplikat/QA/prompt/screenshot tidak dimasukkan.
import collectionMap from '../data/collection-map.json';
import cafeBackground from '../assets/klab/cafe-cel/cafe-background.webp';
import learnerNeutral from '../assets/klab/cafe-cel/learner-neutral.webp';
import learnerSpeaking from '../assets/klab/cafe-cel/learner-speaking.webp';
import baristaNeutral from '../assets/klab/cafe-cel/barista-neutral.webp';
import baristaSpeaking from '../assets/klab/cafe-cel/barista-speaking.webp';
import counter from '../assets/klab/cafe-cel/counter.webp';
import coffeeCup from '../assets/klab/cafe-cel/coffee-cup.webp';
import { coverForTextId, sampleVisuals } from './sampleVisuals';

export type CollectionGroup =
  | 'sampul' | 'karakter' | 'latar' | 'properti'
  | 'ilustrasi' | 'suara' | 'musik' | 'ambience' | 'efek' | 'contoh';

export type CollectionItem = {
  id: string;
  group: CollectionGroup;
  title: string;
  subtitle?: string;
  media: 'image' | 'audio';
  preview?: string;
  label?: string;
  textId?: number;
};

export const COLLECTION_GROUPS: ReadonlyArray<{ id: CollectionGroup | 'semua'; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'sampul', label: 'Sampul' },
  { id: 'karakter', label: 'Karakter & pose' },
  { id: 'latar', label: 'Latar' },
  { id: 'properti', label: 'Properti' },
  { id: 'ilustrasi', label: 'Ilustrasi' },
  { id: 'suara', label: 'Suara tunggal' },
  { id: 'musik', label: 'Musik' },
  { id: 'ambience', label: 'Ambience' },
  { id: 'efek', label: 'Efek' },
  { id: 'contoh', label: 'Contoh tampilan' },
];

const bundledAssets: Record<string, string> = {
  'cafe-background.webp': cafeBackground,
  'learner-neutral.webp': learnerNeutral,
  'learner-speaking.webp': learnerSpeaking,
  'barista-neutral.webp': baristaNeutral,
  'barista-speaking.webp': baristaSpeaking,
  'counter.webp': counter,
  'coffee-cup.webp': coffeeCup,
};

/** 1a menuliskan sebagian src sebagai path absolut lokal; semua diubah jadi URL aplikasi. */
export function normalizeSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (!src.includes(':\\') && !/^\/E:/i.test(src)) return src;
  const clean = src.replace(/^\//, '').replace(/\\/g, '/');
  const publicIndex = clean.indexOf('public/');
  if (publicIndex >= 0) return `/${clean.slice(publicIndex + 'public/'.length)}`;
  const assetsIndex = clean.indexOf('src/assets/');
  if (assetsIndex >= 0) {
    const file = clean.slice(assetsIndex + 'src/assets/'.length).split('/').pop() ?? '';
    return bundledAssets[file];
  }
  return undefined;
}

function groupOf(id: string, group: string): CollectionGroup {
  if (group === 'sampul') return 'sampul';
  if (group === 'contoh-tampilan') return 'contoh';
  if (group === 'musik' || group === 'ambience' || group === 'efek') return group;
  if (group === 'suara-tunggal' || group === 'pratinjau-audio') return 'suara';
  if (group === 'ilustrasi-adegan' || group === 'ilustrasi-sumber') return 'ilustrasi';
  if (/cafe-background/i.test(id)) return 'latar';
  if (/counter|coffee-cup/i.test(id)) return 'properti';
  if (/learner|barista/i.test(id)) return 'karakter';
  return 'ilustrasi';
}

type MapItem = {
  id: string; group: string; title: string; textId?: number | null;
  src?: string | null; status?: string | null; reason?: string | null;
  speaker?: string | null; sentence?: string | null;
};

const items: CollectionItem[] = [];

for (const row of (collectionMap.items ?? []) as MapItem[]) {
  const group = groupOf(row.id, row.group);
  const media = (group === 'suara' || group === 'musik' || group === 'ambience' || group === 'efek')
    ? 'audio' : 'image';
  let label: string | undefined;
  if (row.status === 'draft') label = 'Draf / alternatif';
  if (row.group === 'pratinjau-audio') label = label ?? 'Pratinjau';
  const subtitle = row.reason
    ? row.reason
    : [row.speaker, row.sentence].filter(Boolean).join(' — ')
      || (row.textId ? `textId ${row.textId}` : row.group);
  items.push({
    id: row.id,
    group,
    title: row.title,
    subtitle,
    media,
    preview: normalizeSrc(row.src),
    label,
    textId: row.textId ?? undefined,
  });
}

// Sampul tematik 4a mengisi 49 textId yang tidak punya sampul khusus.
for (let textId = 1; textId <= 67; textId += 1) {
  const cover = coverForTextId(textId);
  if (!cover) continue;
  const existing = items.find((item) => item.group === 'sampul' && item.textId === textId);
  if (existing) {
    existing.preview = cover.src;
    existing.label = cover.kind === 'special' ? 'Sampul khusus' : 'Sampul tematik';
    existing.subtitle = `${cover.level} · ${cover.kind === 'special' ? 'verified' : 'editorial tematik'}`;
  } else {
    items.push({
      id: `cover:${textId}`,
      group: 'sampul',
      title: cover.title,
      subtitle: `${cover.level} · sampul tematik editorial`,
      media: 'image',
      preview: cover.src,
      label: 'Sampul tematik',
      textId,
    });
  }
}

// Kesepuluh contoh tampilan: registry 4a melengkapi 9 draf 1a.
const SAMPLE_LABELS: Array<{ key: keyof typeof sampleVisuals; title: string }> = [
  { key: 'hari-ini', title: 'Hari Ini — bab aktif' },
  { key: 'jelajah', title: 'Jelajah — rak' },
  { key: 'bacaan', title: 'Bacaan — pembuka' },
  { key: 'dialog-percakapan', title: 'Dialog — dua giliran' },
  { key: 'mendengar', title: 'Mendengar — sebelum audio' },
  { key: 'materi-tata-bahasa', title: 'Materi — ilustrasi tugas' },
  { key: 'kosakata', title: 'Kosakata — kartu kata' },
  { key: 'latihan-menulis', title: 'Latihan menulis — ilustrasi tugas' },
  { key: 'catatan', title: 'Catatan — sumber' },
  { key: 'profil', title: 'Profil — progres' },
];
for (const sample of SAMPLE_LABELS) {
  const id = `sample:${sample.key}`;
  if (items.some((item) => item.id === id)) continue;
  items.push({
    id,
    group: 'contoh',
    title: sample.title,
    subtitle: 'contoh tampilan · ilustrasi pendukung',
    media: 'image',
    preview: sampleVisuals[sample.key],
    label: 'Contoh / alternatif',
  });
}

export const collectionItems = items;

/** Satu contoh per jenis untuk pratinjau cepat (gambar + audio). */
export const quickPreviewItems: CollectionItem[] = COLLECTION_GROUPS
  .filter((option) => option.id !== 'semua')
  .map((option) => items.find((item) => item.group === option.id && item.preview))
  .filter((item): item is CollectionItem => Boolean(item));

export function filterCollection(group: CollectionGroup | 'semua', query = ''): CollectionItem[] {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter((item) => {
    if (group !== 'semua' && item.group !== group) return false;
    if (!needle) return true;
    return item.title.toLocaleLowerCase().includes(needle)
      || (item.subtitle ?? '').toLocaleLowerCase().includes(needle);
  });
}
