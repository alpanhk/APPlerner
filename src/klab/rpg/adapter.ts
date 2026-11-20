// Normalisasi data untuk RpgDialogStage. Hanya menerima sumber yang diberikan
// pemanggil; tidak mendaftarkan seluruh bacaan ke adegan Im Café.
import type { RpgDialog, RpgDialogTurn, RpgSource, RpgSpeakerId } from './contracts';

// ID penutur dipertahankan persis dari naskah 2a. Fallback hanya bila kolom
// benar-benar bukan string; jangan mengganti penutur yang belum dikenal UI.
function asSpeaker(value: unknown): RpgSpeakerId {
  return typeof value === 'string' && value ? value : 'narrator';
}

export function normalizeDialog(raw: unknown): RpgDialog | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const rawTurns = Array.isArray(source.turns) ? source.turns : [];
  if (!rawTurns.length) return null;
  const turns: RpgDialogTurn[] = [];
  for (const item of rawTurns) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    if (typeof t.de !== 'string' || typeof t.id !== 'string') continue;
    const propIds = Array.isArray(t.propIds) ? t.propIds.filter((p): p is string => typeof p === 'string') : [];
    turns.push({
      key: typeof t.key === 'string' ? t.key : `t${turns.length + 1}`,
      speakerId: asSpeaker(t.speakerId),
      de: t.de,
      id: t.id,
      pose: typeof t.pose === 'string' ? t.pose : 'offscreen',
      backgroundId: typeof t.backgroundId === 'string' ? t.backgroundId : 'cafe',
      propIds,
      audio: typeof t.audio === 'string' && t.audio ? t.audio : null,
      audioStatus: t.audioStatus === 'exact-match' ? 'exact-match'
        : t.audioStatus === 'adaptation-no-audio' ? 'adaptation-no-audio'
          : t.audioStatus === 'missing-audio' ? 'missing-audio' : 'missing',
      kind: t.kind === 'source' || t.kind === 'adaptation' ? t.kind : undefined,
      stageDirection: t.stageDirection === true,
    });
  }
  if (!turns.length) return null;
  const contract = (source.assetContract && typeof source.assetContract === 'object')
    ? source.assetContract as Record<string, unknown> : {};
  const characters = (contract.characters && typeof contract.characters === 'object')
    ? contract.characters as RpgDialog['assetContract']['characters']
    : { ich: { label: 'Aku (pembelajar)' }, freundin: { label: 'Teman perempuan' }, kellner: { label: 'Pelayan kafe' }, narrator: { label: 'Narasi (di luar layar)', visible: false } };
  const props = (contract.props && typeof contract.props === 'object')
    ? contract.props as RpgDialog['assetContract']['props'] : {};
  return {
    id: typeof source.id === 'string' ? source.id : 'dialog',
    title: typeof source.title === 'string' ? source.title : 'Im Café',
    status: typeof source.status === 'string' ? source.status : undefined,
    turns,
    assetContract: { characters, props },
  };
}

export type ExplicitReadingText = {
  title: string;
  level?: string;
  sentences: Array<{ de: string; id: string }>;
};

/** Bangun sumber bacaan hanya dari teks yang dipilih eksplisit (mis. Im Café). */
export function buildExplicitReadingSource(
  text: ExplicitReadingText,
  opts: { id?: string; audioByIndex?: Record<number, string> } = {},
): RpgSource | null {
  if (text.title !== 'Im Café' || !text.sentences.length) return null;
  const turns: RpgDialogTurn[] = text.sentences.map((sentence, index) => {
    const audio = opts.audioByIndex && opts.audioByIndex[index];
    const usableAudio = typeof audio === 'string' && audio ? audio : null;
    return {
      key: `r${index + 1}`,
      speakerId: 'narrator',
      de: sentence.de,
      id: sentence.id,
      pose: 'offscreen',
      backgroundId: 'cafe',
      propIds: [],
      audio: usableAudio,
      audioStatus: usableAudio ? 'exact-match' : 'adaptation-no-audio',
      kind: 'reading',
    };
  });
  return {
    id: opts.id || 'reading-im-cafe',
    label: 'Bacaan Im Café · 6 kalimat',
    kind: 'reading',
    note: 'Hanya teks Im Café yang dipilih; bukan daftar seluruh bacaan.',
    dialog: {
      id: 'reading-im-cafe',
      title: 'Im Café · bacaan',
      status: 'explicit-reading-source',
      turns,
      assetContract: {
        characters: { narrator: { label: 'Narasi (di luar layar)', visible: false } },
        props: {},
      },
    },
  };
}
