// Alur belajar KLAB dengan data nyata A1-B2. Modul murni: tidak mengimpor
// React, Tauri, atau CSS agar dapat diuji di Node. Seluruh unit, pelajaran,
// bacaan dan klip WAV berasal dari berkas sumber proyek yang sudah ada.
import unitsA1 from '../../data/lessons/units_a1.json';
import unitsA2 from '../../data/lessons/units_a2.json';
import unitsB1 from '../../data/lessons/units_b1.json';
import unitsB2 from '../../data/lessons/units_b2.json';
import practiceRaw from '../../data/lessons/a1_lesson_practice.json';
import transferRaw from './transferBank.json';
import textsA1 from '../../data/reading/texts_a1.json';
import textsA1A2Extra from '../../data/reading/texts_a1a2_extra.json';
import textsA2 from '../../data/reading/texts_a2.json';
import textsB1 from '../../data/reading/texts_b1.json';
import textsB2 from '../../data/reading/texts_b2.json';
import textsExtra from '../../data/reading/texts_extra.json';
import bundleManifest from '../../assets/tts_core/manifest.json';
import kontenA2 from '../../../scripts/konten/a2.json';
import kontenB1 from '../../../scripts/konten/b1.json';
import kontenB2 from '../../../scripts/konten/b2.json';

export type LessonSlide = {
  title: string;
  body: string[];
  exampleDe: string;
  exampleId: string;
  highlight: string[];
  audio: AudioMatch;
};

export type LessonView = {
  unitNo: number;
  lessonNo: number;
  level: string;
  title: string;
  slides: LessonSlide[];
  vocab: string[];
};

export type PracticeItem = {
  id: string;
  unit: number;
  lesson: number;
  objectiveId: string;
  code: string;
  mode: 'choice' | 'type' | 'order';
  prompt: string;
  sub: string;
  options?: string[];
  tokens?: string[];
  answer: string;
  altAnswers?: string[];
  wrongFeedback?: Record<string, string>;
  hintOnWrong?: string;
  explanation: string;
  source: 'bank' | 'generated' | 'curated';
  sourceFile?: string;
};

export type AudioMatch = {
  de: string;
  file?: string;
  status: 'bundle' | 'missing';
};

export type ReadingSentence = AudioMatch & { id: string };

export type ReadingView = {
  textId: number;
  title: string;
  level: string;
  tags: string;
  sentences: ReadingSentence[];
};

export type CheckpointGroup = { id: string; title: string };
export type CheckpointPlan = {
  unitNo: number;
  level: string;
  items: PracticeItem[];
  objectives: CheckpointGroup[];
  policy: { pass: number; perObjectiveMin: number; itemsPerObjective: number };
  pool: PracticeItem[];
  source: 'bank' | 'generated' | 'curated';
};

type UnitFile = {
  level: string;
  source: string;
  units: Array<{
    unit: number;
    title: string;
    goals: string[];
    lessons: Array<{
      no: number;
      title: string;
      minutes: number;
      recap: string[];
      slides: Array<{ title: string; body: string[]; example_de?: string; example_id?: string }>;
      drill: { code: string; count: number };
      vocab: string[];
    }>;
  }>;
};

type TextFile = {
  level: string;
  source: string;
  texts: Array<{ title: string; level: string; tags: string; sentences: unknown[] }>;
};

// Berkas texts_extra.json memakai pasangan [de, id]; berkas lain memakai
// objek {de, id}. Keduanya dinormalisasi ke bentuk tunggal.
function readSentence(raw: unknown): { de: string; id: string } | null {
  if (Array.isArray(raw)) return { de: String(raw[0] ?? ''), id: String(raw[1] ?? '') };
  if (typeof raw === 'string') return { de: raw, id: '' };
  if (raw && typeof raw === 'object') {
    const value = raw as { de?: unknown; id?: unknown };
    return { de: String(value.de ?? ''), id: String(value.id ?? '') };
  }
  return null;
}

type ManifestFile = { phrases: Record<string, string> };

const LEVEL_FILES: Array<[string, UnitFile]> = [
  ['A1', unitsA1 as UnitFile],
  ['A2', unitsA2 as UnitFile],
  ['B1', unitsB1 as UnitFile],
  ['B2', unitsB2 as UnitFile],
];

// Urutan mengikuti semua berkas texts_*.json yang dipakai seedLoader.
const TEXT_FILES: TextFile[] = [
  textsA1 as unknown as TextFile,
  textsA1A2Extra as unknown as TextFile,
  textsA2 as unknown as TextFile,
  textsB1 as unknown as TextFile,
  textsB2 as unknown as TextFile,
  textsExtra as unknown as TextFile,
];

const ALL_UNITS = LEVEL_FILES.flatMap(([level, file]) =>
  file.units.map((unit) => ({ ...unit, level })),
);
const ALL_TEXTS = TEXT_FILES.flatMap((file) => file.texts);
const BANK_ITEMS = (practiceRaw as unknown as { items: PracticeItem[] }).items;
const TRANSFER_BANK = transferRaw as unknown as {
  items: PracticeItem[];
  similar?: Record<string, PracticeItem[]>;
};
const TRANSFER_ITEMS = TRANSFER_BANK.items;
const SIMILAR_ITEMS = TRANSFER_BANK.similar ?? {};
const PHRASES = (bundleManifest as ManifestFile).phrases;

export function normalizeSpeech(text: string): string {
  return text
    .normalize('NFC')
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .replace(/[.,!?…;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clipFor(de: string): string | undefined {
  return PHRASES[normalizeSpeech(de)];
}

export function audioMatch(de: string): AudioMatch {
  const file = clipFor(de);
  return { de, ...(file ? { file } : {}), status: file ? 'bundle' : 'missing' };
}

// Ringkasan jujur cakupan audio: tidak ada klip = status missing, bukan audio
// palsu. Dipakai tes untuk membuktikan pemetaan ke 454 entri bundle.
export function audioCoverage() {
  const sentences = [
    ...ALL_TEXTS.flatMap((text) =>
      text.sentences.map(readSentence).filter((sentence): sentence is { de: string; id: string } => !!sentence).map((sentence) => sentence.de),
    ),
    ...ALL_UNITS.flatMap((unit) =>
      unit.lessons.flatMap((lesson) =>
        lesson.slides.map((slide) => slide.example_de ?? '').filter(Boolean),
      ),
    ),
  ];
  const available = sentences.filter((de) => !!clipFor(de)).length;
  return {
    bundleEntries: Object.keys(PHRASES).length,
    sentences: sentences.length,
    available,
    missing: sentences.length - available,
  };
}

function highlightFor(exampleDe: string, index: number): string[] {
  const words = exampleDe.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
  if (index === 0) return words.slice(0, 2);
  if (index === 1) return words.slice(-2);
  return words.slice(0, 2);
}

export function getLesson(unitNo: number, lessonNo: number): LessonView | null {
  const unit = ALL_UNITS.find((entry) => entry.unit === unitNo);
  if (!unit) return null;
  const lesson = unit.lessons.find((entry) => entry.no === lessonNo);
  if (!lesson) return null;
  return {
    unitNo,
    lessonNo,
    level: unit.level,
    title: lesson.title,
    vocab: lesson.vocab,
    slides: lesson.slides.map((slide, index) => {
      const exampleDe = slide.example_de?.trim() ?? '';
      return {
        title: slide.title,
        body: slide.body,
        exampleDe,
        exampleId: slide.example_id?.trim() ?? '',
        highlight: exampleDe ? highlightFor(exampleDe, index) : [],
        audio: audioMatch(exampleDe),
      };
    }),
  };
}

export function allLessons(): LessonView[] {
  return ALL_UNITS.flatMap((unit) =>
    unit.lessons.map((lesson) => getLesson(unit.unit, lesson.no)).filter((item): item is LessonView => !!item),
  );
}

export function allUnits(): Array<{ unit: number; level: string; title: string; lessons: number }> {
  return ALL_UNITS.map((unit) => ({
    unit: unit.unit,
    level: unit.level,
    title: unit.title,
    lessons: unit.lessons.length,
  }));
}

// Hash deterministik kecil: tidak memakai Math.random sehingga soal turunan
// identik antar sesi dan dapat diverifikasi.
function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], seed: number, offset: number): T {
  return items[(seed + offset) % items.length];
}

// Acak deterministik untuk opsi: kunci tidak boleh selalu di posisi pertama.
function shuffleDeterministic<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0 || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}

// Soal latihan deterministik untuk pelajaran tanpa entri di bank khusus.
// Bahan berasal dari vocab dan contoh slide nyata, bukan teks buatan.
export function generatePractice(unitNo: number, lessonNo: number, lesson: LessonView): PracticeItem[] {
  const seed = seedFrom(`${unitNo}:${lessonNo}`);
  const slides = lesson.slides.filter((slide) => slide.exampleDe);
  const vocab = unique(lesson.vocab);
  const otherExamples = ALL_UNITS.flatMap((unit) =>
    unit.lessons.flatMap((entry) =>
      entry.slides.map((slide) => slide.example_de ?? '').filter(Boolean),
    ),
  ).filter((example) => !slides.some((slide) => slide.exampleDe === example));

  const out: PracticeItem[] = [];

  if (slides.length > 0) {
    const anchor = pick(slides, seed, 0);
    const distractors = unique([
      ...otherExamples.filter((example) => example !== anchor.exampleDe),
      ...slides.map((slide) => slide.exampleDe).filter((example) => example !== anchor.exampleDe),
    ]).slice(0, 3);
    const options = shuffleDeterministic(unique([anchor.exampleDe, ...distractors]), seed + 17);
    out.push({
      id: `gen-u${unitNo}-l${lessonNo}-01`,
      unit: unitNo,
      lesson: lessonNo,
      objectiveId: `gen-u${unitNo}-l${lessonNo}-o1`,
      code: lesson.slides[0] ? 'D3' : 'D1',
      mode: 'choice',
      prompt: `Pilih contoh kalimat dari materi "${anchor.title}".`,
      sub: anchor.exampleId || 'Pilih contoh yang sesuai dengan materi ini.',
      options,
      answer: anchor.exampleDe,
      explanation: `${anchor.title}: ${anchor.exampleDe} — ${anchor.exampleId || 'contoh dari materi'}.`,
      source: 'generated',
    });
  }

  if (vocab.length > 0 && slides.length > 0) {
    // Kunci harus berasal dari kalimat contoh yang dipakai pada prompt.
    // Memilih kata dari vocab dulu bisa menghasilkan jawaban yang tidak
    // pernah muncul di materi (mis. gen-u2-l1-02).
    const anchor = slides[seed % slides.length];
    const words = anchor.exampleDe.replace(/[.,!?]/g, '').split(/\s+/).filter((entry) => entry.length > 2);
    const word = words.find((entry) => vocab.some((item) => item.toLowerCase() === entry.toLowerCase())) ?? words[0];
    if (!word) return out;
    const sentence = anchor.exampleDe;
    let masked = sentence.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___');
    // Jika penghapusan gagal, jangan tampilkan soal tanpa blank.
    if (masked === sentence && words.length > 0) {
      masked = sentence.replace(new RegExp(words[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___');
    }
    out.push({
      id: `gen-u${unitNo}-l${lessonNo}-02`,
      unit: unitNo,
      lesson: lessonNo,
      objectiveId: `gen-u${unitNo}-l${lessonNo}-o2`,
      code: 'D1',
      mode: 'type',
      prompt: `Lengkapi kalimat materi: ${masked}`,
      sub: `Ketik kata Jerman yang tepat. ${anchor?.exampleId ?? ''}`.trim(),
      answer: word,
      hintOnWrong: `Kata yang dicari adalah "${word}".`,
      explanation: `${word} — ${anchor?.exampleId || 'kosakata pelajaran ini'}.`,
      source: 'generated',
    });
  }

  return out;
}

export function practiceItems(unitNo: number, lessonNo: number): PracticeItem[] {
  // Bank transfer statis didahulukan: ID dan objectiveId nyata (bukan gen-u*).
  const transfer = TRANSFER_ITEMS.filter((item) => item.unit === unitNo && item.lesson === lessonNo);
  if (transfer.length > 0) return transfer.map((item) => ({ ...item, source: 'bank' }));
  const bank = BANK_ITEMS.filter((item) => item.unit === unitNo && item.lesson === lessonNo);
  if (bank.length > 0) return bank.map((item) => ({
    ...item,
    ...(item.tokens ? { options: [...item.tokens] } : {}),
    source: 'bank',
  }));
  const lesson = getLesson(unitNo, lessonNo);
  return lesson ? generatePractice(unitNo, lessonNo, lesson) : [];
}

export function transferCoverage() {
  const covered = new Set([
    ...BANK_ITEMS.map((item) => `${item.unit}/${item.lesson}`),
    ...TRANSFER_ITEMS.map((item) => `${item.unit}/${item.lesson}`),
  ]);
  return {
    originalLessons: new Set(BANK_ITEMS.map((item) => `${item.unit}/${item.lesson}`)).size,
    addedLessons: new Set(TRANSFER_ITEMS.map((item) => `${item.unit}/${item.lesson}`)).size,
    coveredLessons: covered.size,
    totalLessons: allLessons().length,
    staticItems: BANK_ITEMS.length + TRANSFER_ITEMS.length,
  };
}

export function gradePractice(item: PracticeItem, picked: string): {
  correct: boolean;
  picked: string;
  explanation: string;
} {
  const normalized = picked.trim().toLocaleLowerCase('de-DE');
  const correct =
    normalized === item.answer.trim().toLocaleLowerCase('de-DE') ||
    (item.altAnswers ?? []).some((alt) => alt.trim().toLocaleLowerCase('de-DE') === normalized);
  const explanation = correct
    ? item.explanation
    : item.wrongFeedback?.[picked] ?? item.hintOnWrong ?? item.explanation;
  return { correct, picked, explanation };
}

// Mesin status LessonFlow diekstrak ke fungsi murni agar dapat diuji sebagai
// perilaku (bukan sekadar inspeksi kode) dengan data bank yang sama.
export type LessonAnswer = { id: string; picked: string; correct: boolean };

export function applyLessonAnswer(
  answers: readonly LessonAnswer[],
  item: PracticeItem,
  picked: string,
): LessonAnswer[] {
  const grade = gradePractice(item, picked);
  return [...answers.filter((entry) => entry.id !== item.id), { id: item.id, picked, correct: grade.correct }];
}

export function removeLessonAnswer(answers: readonly LessonAnswer[], id: string): LessonAnswer[] {
  return answers.filter((entry) => entry.id !== id);
}

export function backTarget(exerciseIndex: number): { kind: 'order' } | { kind: 'previous'; index: number } {
  return exerciseIndex > 1 ? { kind: 'previous', index: exerciseIndex - 1 } : { kind: 'order' };
}

export function lessonScore(answers: readonly LessonAnswer[]): number {
  return answers.length > 0
    ? Math.round((answers.filter((entry) => entry.correct).length / answers.length) * 100)
    : 0;
}

export function summaryAnswers(
  answers: readonly LessonAnswer[],
  initialAnswers: readonly LessonAnswer[] | undefined,
): LessonAnswer[] {
  return answers.length > 0 ? [...answers] : [...(initialAnswers ?? [])];
}

// Setelah peserta menyentuh jawaban secara lokal, props awal dari 1a tidak
// boleh mengisi ulang state (mis. setelah "Perbaiki jawaban" menghapus entri
// salah, rehidrasi async harus tidak mengembalikannya).
export function shouldHydrateFromProps(
  localTouched: boolean,
  answersLength: number,
  initialAnswers: readonly LessonAnswer[] | undefined,
): boolean {
  return !localTouched && answersLength === 0 && !!initialAnswers && initialAnswers.length > 0;
}

export function isLessonComplete(items: readonly PracticeItem[], answers: readonly LessonAnswer[]): boolean {
  return items.length === 0 || items.every((item) => answers.some((entry) => entry.id === item.id));
}

// Contoh bantuan mengikuti soal aktif, bukan halaman materi terakhir.
export function exampleSlideFor(lesson: LessonView, item?: PracticeItem) {
  const candidates = lesson.slides.filter((candidate) => candidate.exampleDe);
  if (!item) return candidates[0] ?? lesson.slides[0];
  const keys = item.answer.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
  const matched = candidates.find((candidate) => {
    const haystack = `${candidate.exampleDe} ${candidate.body.join(' ')}`.toLowerCase();
    return keys.some((word) => haystack.includes(word));
  });
  return matched ?? candidates[0] ?? lesson.slides[0];
}

// Soal baru sejenis: bukan mengulang item yang sama. Memakai contoh kalimat
// lain dari pelajaran yang sama dengan opsi diacak deterministik.
export function buildSimilarPractice(
  item: PracticeItem,
  unitNo: number,
  lessonNo: number,
  usedIds: readonly string[] = [],
): PracticeItem | null {
  // Bank statis didahulukan agar prompt/sub/opsi/feedback konsisten.
  const curated = (SIMILAR_ITEMS[item.id] ?? []).find((candidate) => !usedIds.includes(candidate.id));
  if (curated) return { ...curated, source: 'bank' };
  const lesson = getLesson(unitNo, lessonNo);
  if (!lesson) return null;
  const seed = seedFrom(`${item.id}:sejenis`);
  const candidates = lesson.slides.filter((slide) => slide.exampleDe && slide.exampleDe !== item.answer);
  if (candidates.length === 0) return null;
  const anchor = candidates[seed % candidates.length];
  const otherExamples = ALL_UNITS.flatMap((unit) =>
    unit.lessons.flatMap((entry) =>
      entry.slides.map((slide) => slide.example_de ?? '').filter(Boolean),
    ),
  );
  const distractors = unique(otherExamples.filter(
    (example) => example !== anchor.exampleDe && example !== item.answer,
  )).slice(0, 3);
  const options = shuffleDeterministic(unique([anchor.exampleDe, ...distractors]), seed + 7);
  return {
    id: `${item.id.replace(/^similar-/, '')}-s${usedIds.length + 1}`,
    unit: unitNo,
    lesson: lessonNo,
    objectiveId: item.objectiveId,
    code: item.code,
    mode: 'choice',
    prompt: `Pilih contoh kalimat lain untuk tujuan yang sama: "${anchor.title}".`,
    sub: item.sub,
    ...(options.length >= 2 ? { options } : {}),
    answer: anchor.exampleDe,
    explanation: `${anchor.title}: ${anchor.exampleDe} — ${anchor.exampleId || 'contoh dari materi'}.`,
    source: 'generated',
  };
}

export function similarItemAvailable(
  unitNo: number,
  lessonNo: number,
  objectiveId: string,
  excludeId: string,
): boolean {
  const own = practiceItems(unitNo, lessonNo);
  if (own.some((item) => item.objectiveId === objectiveId && item.id !== excludeId)) return true;
  const current = own.find((item) => item.id === excludeId);
  return current ? !!buildSimilarPractice(current, unitNo, lessonNo) : false;
}

export function allReadings(): ReadingView[] {
  return ALL_TEXTS.map((text, index) => ({
    textId: index + 1,
    title: text.title,
    level: text.level,
    tags: text.tags,
    sentences: text.sentences
      .map(readSentence)
      .filter((sentence): sentence is { de: string; id: string } => !!sentence)
      .map((sentence) => ({ ...audioMatch(sentence.de), id: sentence.id })),
  }));
}

export function getReading(textId: number): ReadingView | null {
  return allReadings().find((reading) => reading.textId === textId) ?? null;
}

export function readingByTitle(title: string): ReadingView | null {
  return allReadings().find((reading) => reading.title === title) ?? null;
}

export function readingAudioPlan(reading: ReadingView): string[] {
  return reading.sentences.map((sentence) => sentence.file).filter((file): file is string => !!file);
}

export function lessonAudioPlan(lesson: LessonView): AudioMatch[] {
  return lesson.slides.map((slide) => slide.audio).filter((entry) => !!entry.de);
}

type KontenWord = {
  de: string; article?: string; plural?: string; meaning: string; ex_de: string; ex_id: string;
};
type KontenUnit = { no: number; goals: string[]; words: KontenWord[] };
type KontenFile = { level: string; units: KontenUnit[] };

const KONTEN_BY_LEVEL: Record<string, KontenFile> = {
  A2: kontenA2 as unknown as KontenFile,
  B1: kontenB1 as unknown as KontenFile,
  B2: kontenB2 as unknown as KontenFile,
};

// PORT-EDITORIAL: dialog Im Café dari WAV lokal kit lama. Diam secara default;
// klip hanya diputar bila pengguna menekan Dengarkan dialog.
// Hanya Im Café (textId 10) yang punya naskah dua tokoh disetujui untuk
// percakapan penuh. Anna–Budi (textId 1) tetap pratinjau; 65 judul lain tidak
// boleh diklaim memiliki naskah.
export function dialogAvailability(textId: number) {
  if (textId === 10) {
    return { kind: 'full' as const, label: 'Percakapan dua tokoh', turnCount: CAFE_DIALOG.length };
  }
  if (textId === 1) {
    return { kind: 'preview' as const, label: 'Pratinjau naskah Anna–Budi (belum disetujui)', turnCount: 0 };
  }
  return { kind: 'none' as const, label: 'Belum ada naskah percakapan', turnCount: 0 };
}

// Susunan 7 lapisan (5 elemen + 2 pose karakter) dari manifest#stage.
export const CAFE_LAYERS = [
  { id: 'cafe', zIndex: 0, rectPx: [0, 0, 1600, 900] },
  { id: 'learner', zIndex: 1, rectPx: [258, 92, 499, 749] },
  { id: 'barista', zIndex: 2, rectPx: [842, 91, 499, 749] },
  { id: 'counter', zIndex: 3, rectPx: [144, 657, 1312, 244] },
  { id: 'coffee', zIndex: 4, rectPx: [784, 586, 144, 116] },
] as const;

export type CafeSpeaker = 'barista' | 'learner';

// Dua giliran pembuka dari manifest paket aset Im Café. Klip dipilih hanya
// bila teks Jermannya cocok persis dengan sumber.
export const CAFE_DIALOG = [
  {
    file: 'conv_76f18fde42ee.wav',
    de: 'Guten Tag! Was möchten Sie?',
    id: 'Selamat siang! Apa yang Anda inginkan?',
    speaker: 'barista',
  },
  {
    file: 'a1_example_062.wav',
    de: 'Ich möchte einen Kaffee, bitte.',
    id: 'Saya ingin kopi, tolong.',
    speaker: 'learner',
  },
] as const;

// Koreksi lp-u4-l2-01: klip stok memakai "Ich möchte einen Apfelsaft, bitte.",
// persis dengan prompt + jawaban kanonis bank.
export const CAFE_CORRECTION = {
  itemId: 'lp-u4-l2-01',
  de: 'Ich möchte einen Apfelsaft, bitte.',
  file: 'lp-u4-l2-01-koreksi.wav',
} as const;

export function correctionClipFor(itemId: string, prompt: string, answer: string): string | null {
  if (itemId !== CAFE_CORRECTION.itemId) return null;
  const rebuilt = prompt.replace('___', answer).trim();
  return rebuilt === CAFE_CORRECTION.de ? CAFE_CORRECTION.file : null;
}

// Aturan suasana dari audio-manifest.json#playbackPolicy.
export function ambienceDecision(input: {
  optIn: boolean;
  route: 'today' | 'explore' | 'cafe' | 'other';
  speechActive: boolean;
  readingActive: boolean;
  hoerenActive: boolean;
  hidden: boolean;
}) {
  const paused = input.speechActive || input.readingActive || input.hoerenActive;
  const idle = input.optIn && !paused && !input.hidden && (input.route === 'today' || input.route === 'explore');
  const cafe = input.optIn && !paused && !input.hidden && input.route === 'cafe';
  return { idle, cafe, paused, stop: !input.optIn || input.hidden };
}

export function cupCueDecision(cuePlayed: boolean, speechStartsWithin620Ms: boolean) {
  return !cuePlayed && !speechStartsWithin620Ms;
}

export function cafeDialogPlan() {
  return {
    files: CAFE_DIALOG.map((turn) => turn.file),
    speakers: CAFE_DIALOG.map((turn) => turn.speaker),
    coffeeTurn: 1,
    autoPlay: false,
  };
}

// Kembalikan ke mode jendela sebelum fullscreen hanya bila kitalah yang
// masuk fullscreen. Bila sudah fullscreen sebelumnya, biarkan apa adanya.
export function fullscreenDecision(alreadyFullscreen: boolean, enteredByUs: boolean) {
  return { enter: !alreadyFullscreen, exit: enteredByUs };
}

// U-11: definisi pendek untuk istilah yang dipakai tanpa penjelasan.
const GRAMMAR_GLOSSARY: ReadonlyArray<{ term: string; definition: string }> = [
  { term: 'Akkusativ', definition: 'Bentuk kata benda sebagai objek langsung kata kerja, misalnya einen Apfelsaft.' },
  { term: 'objek', definition: 'Bagian kalimat yang dikenai tindakan; menjawab pertanyaan "apa/siapa".' },
  { term: 'Nominativ', definition: 'Bentuk dasar kata benda sebagai subjek, misalnya der Apfelsaft.' },
  { term: 'Dativ', definition: 'Bentuk kata benda untuk penerima atau setelah preposisi tertentu, misalnya dem Freund.' },
];

export function grammarGlossaryFor(lesson: LessonView) {
  const text = lesson.slides
    .flatMap((slide) => [slide.title, slide.exampleDe, slide.exampleId, ...slide.body])
    .join(' ')
    .toLowerCase();
  const hasAkkusativ = text.includes('akkusativ');
  // Bila Akkusativ muncul, tampilkan empat istilah sebagai kerangka pembanding
  // agar pemula tidak perlu menebak istilah yang tidak didefinisikan.
  return hasAkkusativ
    ? [...GRAMMAR_GLOSSARY]
    : GRAMMAR_GLOSSARY.filter((entry) => text.includes(entry.term.toLowerCase()));
}

// U-14: sorotan mengikuti hasil highlightFor(), bukan pola tetap di komponen.
export function highlightParts(text: string, words: readonly string[]): Array<{ text: string; mark: boolean }> {
  if (!text || words.length === 0) return [{ text, mark: false }];
  const escaped = words
    .filter((word) => word.trim())
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return [{ text, mark: false }];
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.split(pattern).filter((part) => part.length > 0).map((part) => ({
    text: part,
    mark: words.some((word) => word.toLowerCase() === part.toLowerCase()),
  }));
}

// U-10/U-13: satu nama untuk satu kata dan jembatan bentuk tak tentu/tertentu.
export function reasonLines(item: PracticeItem | undefined): string[] {
  if (!item) return [];
  if (item.id === 'lp-u4-l2-01') {
    return [
      'der Apfelsaft → einen Apfelsaft',
      'möchte + Akkusativ: der Apfelsaft menjadi einen Apfelsaft, bukan "der Saft".',
      'Jembatan: einen/eine adalah bentuk tak tentu; den/die adalah bentuk tertentu setelah preposisi atau kata kerja tertentu.',
    ];
  }
  return [item.explanation];
}

// U-12: contoh tanpa terjemahan diberi label jujur, bukan dianggap terlewat.
export function translationLabel(slide: { exampleDe: string; exampleId: string }): string | null {
  return slide.exampleDe && !slide.exampleId ? 'Coba tanpa bantuan' : null;
}

export type ExerciseLineView =
  | { kind: 'pair'; de: string; id: string }
  | { kind: 'untranslated'; de: string; label: string }
  | { kind: 'note'; text: string };

const UNTRANSLATED_LABEL = 'Coba tanpa bantuan';
const GERMAN_START = /^(ich|möchten|mochte|wer|was|wie|wo|der|die|das|den|dem|wir|du|er|sie|auf|in|mit|zum|zur|bitte)\b/i;
const INDONESIAN_HINT = /( — |:| dan | yang | untuk | tetap |harus |Prasyarat|Ringkasan|Kesalahan umum)/i;

// Baris materi A1 memakai tiga bentuk: "DE — ID", kalimat Jerman tanpa
// terjemahan, atau catatan tata bahasa bahasa Indonesia. Bedakan ketiganya
// agar label hanya muncul pada contoh Jerman yang memang tanpa pasangan ID.
export function exerciseLineView(line: string): ExerciseLineView {
  const trimmed = line.trim();
  const separator = trimmed.indexOf(' — ');
  if (separator > 0) {
    const de = trimmed.slice(0, separator).trim();
    const id = trimmed.slice(separator + 3).trim();
    if (de && id) return { kind: 'pair', de, id };
  }
  if (GERMAN_START.test(trimmed) && !INDONESIAN_HINT.test(trimmed) && !trimmed.includes('→')) {
    return { kind: 'untranslated', de: trimmed, label: UNTRANSLATED_LABEL };
  }
  return { kind: 'note', text: trimmed };
}

// A2-B2 memakai kisi-kisi tujuan unit nyata (unit.goals) dan kosakata kurasi
// (scripts/konten/<level>.json), bukan objectiveId sintetis gen-u*. Status
// konten tetap "belum ditelaah pengajar".
export function buildLevelCheckpoint(unitNo: number): CheckpointPlan | null {
  const unit = ALL_UNITS.find((entry) => entry.unit === unitNo);
  if (!unit || unit.level === 'A1') return null;
  const konten = KONTEN_BY_LEVEL[unit.level];
  const curated = konten?.units.find((entry) => entry.no === unitNo);
  if (!curated || curated.goals.length === 0 || curated.words.length < 4) return null;

  const seed = seedFrom(`cp-${unitNo}`);
  const words = curated.words.filter((word) => word.de && word.meaning && word.ex_de);
  const groups = curated.goals.map((goal, index) => ({
    id: `goal-${unitNo}-${index + 1}`,
    title: goal,
  }));
  const sourceFile = `scripts/konten/${unit.level.toLowerCase()}.json`;
  const pool: PracticeItem[] = [];

  groups.forEach((group, goalIndex) => {
    for (let slot = 0; slot < 5; slot += 1) {
      const word = words[(goalIndex * 5 + slot + seed) % words.length];
      const others = shuffleDeterministic(
        words.filter((entry) => entry.de !== word.de && entry.meaning !== word.meaning),
        seed + slot + goalIndex * 11,
      ).slice(0, 3);
      const contextual = slot % 2 === 1;
      const options = contextual
        ? shuffleDeterministic(unique([word.ex_id, ...others.map((entry) => entry.ex_id)]), seed + slot)
        : shuffleDeterministic(unique([word.meaning, ...others.map((entry) => entry.meaning)]), seed + slot);
      const wrongFeedback: Record<string, string> = {};
      for (const other of others) {
        const wrong = contextual ? other.ex_id : other.meaning;
        wrongFeedback[wrong] = contextual
          ? `"${word.ex_de}" berarti "${word.ex_id}", bukan "${wrong}".`
          : `"${word.de}" berarti "${word.meaning}", bukan "${wrong}".`;
      }
      pool.push({
        id: `curated-u${unitNo}-g${goalIndex + 1}-i${slot + 1}`,
        unit: unitNo,
        lesson: 0,
        objectiveId: group.id,
        code: contextual ? 'D3' : 'D1',
        mode: 'choice',
        prompt: contextual
          ? `Pilih terjemahan kalimat: "${word.ex_de}"`
          : `Pilih arti bahasa Indonesia untuk kata Jerman "${word.de}".`,
        sub: group.title,
        options,
        answer: contextual ? word.ex_id : word.meaning,
        wrongFeedback,
        explanation: contextual
          ? `${word.ex_de} = ${word.ex_id}. Kosakata: ${word.de} = ${word.meaning}.`
          : `${word.de} = ${word.meaning}. Contoh: ${word.ex_de} — ${word.ex_id}`,
        source: 'curated',
        sourceFile,
      });
    }
  });

  return {
    unitNo,
    level: unit.level,
    items: groups.flatMap((group) => pool.filter((item) => item.objectiveId === group.id).slice(0, 3)),
    objectives: groups,
    policy: { pass: 70, perObjectiveMin: 2, itemsPerObjective: 3 },
    pool,
    source: 'curated',
  };
}

// Nama lama tetap diekspor untuk kompatibilitas pemanggil/tes.
export const buildFallbackCheckpoint = buildLevelCheckpoint;
