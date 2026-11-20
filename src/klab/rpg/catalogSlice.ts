// Irisan eksplisit katalog dialog 2a untuk pratinjau 4a.
// Satu judul (Im Café) adalah contoh aktif; lainnya diuji per judul sebagai
// irisan. TIDAK mendaftarkan 67 bacaan sekaligus ke panggung.
import catalogIndex from '../../../outputs/penyelesaian-windows/dialog-catalog/index.json';

export const PREVIEW_EXAMPLE_TEXT_ID = 10;

export const CATALOG_SLICE_TEXT_IDS: readonly number[] = [1, 10, 25, 40, 55, 67];

type CatalogEntry = {
  textId: number;
  title: string;
  level?: string;
  file: string;
  turns: number;
  exactAudio: number;
  honestNoAudio: number;
  catalogStatus?: string;
};

const entries = ((catalogIndex as unknown as { entries?: CatalogEntry[] }).entries || [])
  .filter(entry => CATALOG_SLICE_TEXT_IDS.includes(entry.textId));

export type CatalogSliceEntry = CatalogEntry & {
  role: 'contoh-pratinjau' | 'irisan-per-judul';
  previewQuery: string;
};

export const catalogSlice: CatalogSliceEntry[] = entries.map(entry => ({
  ...entry,
  role: entry.textId === PREVIEW_EXAMPLE_TEXT_ID ? 'contoh-pratinjau' : 'irisan-per-judul',
  previewQuery: `?catalog=${entry.file}`,
}));

export const catalogAudit = {
  declaredTotal: (catalogIndex as unknown as { total?: number }).total ?? 0,
  entries: entries.length,
  allEntries: ((catalogIndex as unknown as { entries?: CatalogEntry[] }).entries || []).length,
};
