// Entry preview terpisah untuk komponen RPG (4a). Bukan entry produksi.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RpgDialogStage from './RpgDialogStage';
import { buildExplicitReadingSource, normalizeDialog } from './adapter';
import { catalogSlice } from './catalogSlice';
import type { RpgAssetManifest, RpgAudioPort, RpgSource } from './contracts';
import dialogRaw from '../../../outputs/preview-dialog-rpg/dialog.json';
import manifestV01Raw from '../../../outputs/preview-dialog-rpg/assets.manifest.json';
import manifestV02Raw from '../../../outputs/preview-dialog-rpg/assets.manifest.v02.json';
import textsA1 from '../../data/reading/texts_a1.json';

const baseManifest = manifestV01Raw as unknown as RpgAssetManifest;
const manifestV01: RpgAssetManifest = {
  ...baseManifest,
  assetPackage: '/outputs/aset-bacaan-percakapan-review/Im-Cafe/v01/',
  audioBase: '/src/assets/tts_core/',
  statusText: 'v01 · pembanding. Aset review v01; bukan seni final.',
};
const baseV02 = manifestV02Raw as unknown as RpgAssetManifest;
const manifestV02: RpgAssetManifest = {
  ...baseV02,
  assetPackage: '/outputs/aset-bacaan-percakapan-review/Im-Cafe/v02/',
  audioBase: '/src/assets/tts_core/',
  statusText: 'v02 · kandidat menunggu penilaian pengguna. Bukan seni final.',
};

const dialog = normalizeDialog(dialogRaw);
const sources: RpgSource[] = [];
if (dialog) {
  sources.push({
    id: 'conversation-im-cafe',
    label: 'Percakapan Im Café · 11 giliran',
    kind: 'dialog',
    dialog,
    note: 'Naskah 2a; v01/v02 hanya mengubah aset, bukan teks atau penutur.',
  });
}
type ReadingFile = { texts: Array<{ title: string; level?: string; sentences: Array<{ de: string; id: string }> }> };
const cafe = (textsA1 as unknown as ReadingFile).texts.find(item => item.title === 'Im Café');
if (cafe) {
  const reading = buildExplicitReadingSource(cafe, {
    audioByIndex: {
      1: 'a1_example_062.wav',
      4: 'a1_text_019.wav',
      5: 'a1_text_027.wav',
    },
  });
  if (reading) sources.push(reading);
}

const audioPort: RpgAudioPort = {
  play: async (fileName) => {
    try {
      const element = new Audio(`/src/assets/tts_core/${fileName}`);
      await element.play();
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : 'putar gagal' };
    }
  },
};

function Preview() {
  const [extraSource, setExtraSource] = useState<RpgSource | null>(null);
  const params = new URLSearchParams(window.location.search);
  const catalogFile = params.get('catalog');

  useEffect(() => {
    // Hanya SATU berkas dari irisan eksplisit yang boleh dimuat. Tidak ada
    // auto-registrasi 67 bacaan, tidak ada klip lama untuk adaptasi.
    const slice = catalogSlice.find(item => item.file === catalogFile);
    if (!slice) return;
    let active = true;
    fetch(`/outputs/penyelesaian-windows/dialog-catalog/${slice.file}`)
      .then(response => response.ok ? response.json() : null)
      .then(raw => {
        if (!active || !raw) return;
        const dialogFromCatalog = normalizeDialog(raw);
        if (dialogFromCatalog) setExtraSource({
          id: `catalog-${slice.textId}`,
          label: `${slice.textId} · ${dialogFromCatalog.title} (${slice.level || '-'})`,
          kind: 'reading',
          dialog: dialogFromCatalog,
          note: `Irisan katalog 2a: ${slice.role}. Bukan 67 bacaan sekaligus; audio exact-match saja.`,
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [catalogFile]);

  const allSources = extraSource ? [...sources, extraSource] : sources;
  return <RpgDialogStage
    sources={allSources}
    manifest={params.has('v02') ? manifestV02 : manifestV01}
    audio={audioPort}
    initialSourceId={sources[0]?.id}
  />;
}

const host = document.getElementById('root') as HTMLElement & { __rpgRoot?: ReturnType<typeof createRoot> };
host.__rpgRoot ??= createRoot(host);
host.__rpgRoot.render(<Preview />);
