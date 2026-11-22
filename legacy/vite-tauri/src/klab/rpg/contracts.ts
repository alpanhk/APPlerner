// Kontrak presentasional RPG untuk KLAB (4a). Tidak berisi DB/native/penilaian.
// Naskah dialog tetap milik 2a; komponen menerima data yang sudah dinormalisasi.

// speakerId mengikuti katalog 2a apa adanya (ich/freundin/kellner/narrator,
// serta lehrerin/nachbarin/kollege/kollegin/vorgesetzte untuk irisan lain).
// Jangan memetakan ID yang tidak dikenal menjadi narrator.
export type RpgSpeakerId = string;
export type RpgAudioStatus = 'exact-match' | 'adaptation-no-audio' | 'missing-audio' | 'missing' | 'unsupported';

export type RpgDialogTurn = {
  key: string;
  speakerId: RpgSpeakerId;
  de: string;
  id: string;
  pose: string;
  backgroundId: string;
  propIds: string[];
  audio: string | null;
  audioStatus: RpgAudioStatus;
  kind?: 'source' | 'adaptation' | 'reading' | 'fallback';
  stageDirection?: boolean;
};

export type RpgDialogAssetContract = {
  characters: Record<string, { label: string; visible?: boolean }>;
  props: Record<string, { label: string }>;
  backgrounds?: Record<string, { label: string }>;
};

export type RpgDialog = {
  id: string;
  title: string;
  status?: string;
  turns: RpgDialogTurn[];
  assetContract: RpgDialogAssetContract;
};

export type RpgSource = {
  id: string;
  label: string;
  kind: 'dialog' | 'reading';
  dialog: RpgDialog;
  note?: string;
};

export type RpgLayerSpec = { left?: string; top?: string; width?: string; height?: string; transform?: string };

export type RpgAssetManifest = {
  status?: string;
  statusText?: string;
  versionLabel?: string;
  note?: string;
  audioNote?: string;
  assetPackage: string;
  audioBase: string;
  background?: Record<string, string>;
  backgrounds?: Record<string, string>;
  characters: Record<string, {
    label: string;
    visible?: boolean;
    static?: boolean;
    poses: Record<string, string | null>;
    poseNote?: string;
  }>;
  props: Record<string, string>;
  counter?: string;
  layout?: {
    background?: RpgLayerSpec;
    counter?: RpgLayerSpec;
    props?: Record<string, RpgLayerSpec>;
    characters?: Record<string, RpgLayerSpec>;
  };
};

export type RpgAudioResult = { ok: true } | { ok: false; reason: string };

export interface RpgAudioPort {
  /** Putar klip berdasarkan nama berkas; tidak boleh memakai klip pengganti. */
  play(fileName: string): Promise<RpgAudioResult>;
  stop?(): void;
}
