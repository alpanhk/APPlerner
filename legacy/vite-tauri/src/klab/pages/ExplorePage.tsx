// Jelajah - production presentational page (Agent 4a).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { vocabPanel } from '../vocabPanelStore';
import { cleanLabel, coverForTextId, sampleVisuals } from '../sampleVisuals';
import type {
  BookItemData, ExploreSection, LevelCodeView, LoadState,
  PracticeLinkData, UnitItemData, VocabularyItemData,
} from './viewModels';
import Icon from '../Icon';
import { KButton, EmptyState, ErrorState, LoadingState, Tabs } from '../components/ui';
import { BookCard, BookPreview, PreviewActions, Shelf } from '../components/book';

export type ExplorePageProps = {
  section: ExploreSection;
  loadState: LoadState;
  units?: UnitItemData[];
  books?: BookItemData[];
  vocabulary?: VocabularyItemData[];
  practiceLinks?: PracticeLinkData[];
  onSectionChange: (section: ExploreSection) => void;
  onOpenUnit?: (unitNo: number) => void;
  onOpenBook?: (id: string, mode: 'read' | 'listen') => void;
  onOpenPractice?: (id: string) => void;
  /** Tindakan ulasan kosakata/SRS dari 1a; tombol ditampilkan bila tersedia. */
  onOpenSrs?: () => void;
  onRetry: () => void;
};

const LEVELS: readonly LevelCodeView[] = ['A1', 'A2', 'B1', 'B2'];
const VOCAB_PAGE = 150;

function levelOf(meta?: string, explicit?: LevelCodeView): LevelCodeView | null {
  if (explicit && LEVELS.includes(explicit)) return explicit;
  const match = meta?.match(/\b(A1|A2|B1|B2)\b/);
  return match ? (match[1] as LevelCodeView) : null;
}

const SECTIONS: ReadonlyArray<{ id: ExploreSection; label: string }> = [
  { id: 'materials', label: 'Materi' },
  { id: 'vocabulary', label: 'Kosakata' },
  { id: 'reading', label: 'Bacaan' },
  { id: 'practice', label: 'Latihan' },
];

function ReadingShelf({ books, onOpenBook }: { books: BookItemData[]; onOpenBook: ExplorePageProps['onOpenBook'] }) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const shelfOrigin = useRef<{ trigger: HTMLButtonElement; scrollY: number } | null>(null);
  const preview = books.find(book => book.id === previewId);

  useLayoutEffect(() => {
    const heading = previewHeading.current;
    if (heading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    } else if (shelfOrigin.current) {
      const { trigger, scrollY } = shelfOrigin.current;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      trigger.focus({ preventScroll: true });
      shelfOrigin.current = null;
    }
  }, [preview?.id]);

  return <>
    <div hidden={Boolean(preview)}>
      <div className="visual-shelf-art" aria-hidden="true">
        <img src={sampleVisuals.jelajah} alt="" decoding="async" />
      </div>
      <Shelf title="Rak bacaan" description={`${books.length} buku`}>
        {books.map((book, index) => {
          const cover = coverForTextId(book.id);
          return <BookCard key={book.id} title={book.title} meta={book.meta} textId={book.id}
            label={cleanLabel(book.label || book.meta)} image={book.image || cover?.src}
            coverKind={cover?.kind} priority={index === 0}
            level={levelOf(book.meta, book.level) ?? levelOf(book.label) ?? undefined}
            onOpen={event => {
              shelfOrigin.current = { trigger: event.currentTarget, scrollY: window.scrollY };
              setPreviewId(book.id);
            }} />;
        })}
      </Shelf>
    </div>
    {preview && (() => {
      const cover = coverForTextId(preview.id);
      return <BookPreview entering
        title={preview.title}
        label={cleanLabel(preview.label || preview.meta)}
        level={levelOf(preview.meta, preview.level) ?? levelOf(preview.label) ?? undefined}
        image={preview.image || cover?.src}
        coverKind={cover?.kind}
        eyebrow="Cuplikan"
        lead={preview.lead}
        leadLang="de"
        description={cleanLabel(preview.label) || cleanLabel(preview.meta)}
        headingLevel={2}
        headingRef={previewHeading}
        actions={<PreviewActions
          readLabel={preview.id === '10' ? 'Mulai percakapan' : 'Baca'}
          onRead={() => onOpenBook?.(preview.id, 'read')}
          onListen={() => onOpenBook?.(preview.id, 'listen')}
          onBack={() => setPreviewId(null)} />} />;
    })()}
  </>;
}

export default function ExplorePage({
  section, loadState, units, books, vocabulary, practiceLinks,
  onSectionChange, onOpenUnit, onOpenBook, onOpenPractice, onOpenSrs, onRetry,
}: ExplorePageProps) {
  const vocabQuery = useStore(vocabPanel, (state) => state.query);
  const [vocabLimit, setVocabLimit] = useState(VOCAB_PAGE);
  const setVocabQuery = (value: string) => {
    vocabPanel.getState().setQuery(value);
    setVocabLimit(VOCAB_PAGE);
  };
  useEffect(() => {
    if (section === 'vocabulary' && vocabulary?.length) vocabPanel.getState().setItems(vocabulary);
  }, [section, vocabulary]);

  return <div className="shelf editorial-explore">
    <header className="editorial-page-header"><h1>Jelajah</h1></header>
    {loadState === 'ready' && section === 'vocabulary' && (
      <div className="klab-vocab-header-search">
        <span className="klab-vocab-header-label">Kosakata</span>
        <input type="search" value={vocabQuery} aria-label="Cari kata disini..."
          placeholder="cari kata disini..."
          onChange={(event) => { setVocabQuery(event.target.value); vocabPanel.getState().openPanel(vocabulary); }}
          onFocus={() => vocabPanel.getState().openPanel(vocabulary)} />
      </div>
    )}
    <div className="editorial-explore-navigation">
      <Tabs items={SECTIONS} active={section} onChange={id => onSectionChange(id as ExploreSection)} label="Kategori jelajah" />
      {onOpenPractice && <div className="actions editorial-explore-shortcuts" role="group" aria-label="Pintasan latihan">
        <KButton onClick={() => onOpenPractice('drills')}>Drill D1–D10</KButton>
        <KButton onClick={() => onOpenPractice('exam')}>Uji A1 · Uji Tiruan</KButton>
      </div>}
    </div>

    {loadState === 'loading' && <LoadingState label="Memuat Jelajah..." />}
    {loadState === 'failed' && <ErrorState title="Jelajah belum siap" message="Daftar materi tidak dapat dimuat."
      onRetry={onRetry} />}

    {loadState === 'ready' && section === 'materials' && (
      units && units.length > 0 ? <>
        <p className="shelf-count" role="status">{units.length} unit tersedia · A1–B2</p>
        <div className={units.length > 12 ? 'unit-list unit-list-grid' : 'unit-list'}>
          {units.map(unit => {
            const level = levelOf(unit.meta, unit.level);
            return <button key={unit.unitNo} type="button" className="unit-row"
              data-active={unit.status === 'active'} onClick={() => onOpenUnit?.(unit.unitNo)}>
              <span>{String(unit.unitNo).padStart(2, '0')}</span>
              <span className="unit-row-copy"><strong>{unit.title}</strong>
                {unit.meta && <small>{unit.meta}</small>}
              </span>
              {level && <span className="level-badge" data-level={level}>{level}</span>}
              <Icon name="arrow" />
            </button>;
          })}
        </div>
      </> : <EmptyState icon={<Icon name="book" />} title="Belum ada materi" description="Materi akan muncul setelah konten dimuat." />
    )}

    {loadState === 'ready' && section === 'vocabulary' && (
      vocabulary && vocabulary.length > 0 ? (() => {
        const query = vocabQuery.trim().toLocaleLowerCase();
        const filtered = query
          ? vocabulary.filter(item => item.word.toLocaleLowerCase().includes(query)
            || item.translation.toLocaleLowerCase().includes(query))
          : vocabulary;
        const shown = filtered.slice(0, vocabLimit);
        return <>
          <div className="vocab-toolbar">
            <label className="klab-field klab-vocab-inline-search">Cari kata
              <input type="search" value={vocabQuery} aria-label="Cari kata disini..."
                placeholder="cari kata disini..."
                onChange={(event) => { setVocabQuery(event.target.value); vocabPanel.getState().openPanel(vocabulary); }} />
            </label>
            {onOpenSrs && <KButton variant="primary" onClick={onOpenSrs}>Ulangi dengan SRS</KButton>}
          </div>
          <p className="shelf-count" role="status">
            Menampilkan {shown.length} dari {filtered.length} kata
            {filtered.length !== vocabulary.length ? ` (dari ${vocabulary.length} total)` : ''}
          </p>
          <div className="vocab-grid">
            {shown.map((item, i) => {
              const level = levelOf(undefined, item.level);
              return <div className="vocab-item" key={item.id ?? `${item.word}-${i}`}>
                <span lang="de">{item.word}</span>
                <span className="muted">{item.translation}</span>
                {level && <span className="level-badge" data-level={level}>{level}</span>}
                {typeof item.due === 'number' && item.due > 0 && <small className="muted">{item.due} siap diulang</small>}
              </div>;
            })}
          </div>
          {shown.length < filtered.length && <div className="actions">
            <KButton variant="secondary" onClick={() => setVocabLimit(value => value + VOCAB_PAGE)}>
              Tampilkan {Math.min(VOCAB_PAGE, filtered.length - shown.length)} kata berikutnya
            </KButton>
          </div>}
        </>;
      })() : <EmptyState icon={<Icon name="notes" />} title="Belum ada kosakata" description="Kata yang Anda pelajari akan tampil di sini." />
    )}

    {loadState === 'ready' && section === 'reading' && (
      books && books.length > 0 ? <ReadingShelf books={books} onOpenBook={onOpenBook} />
        : <EmptyState icon={<Icon name="book" />} title="Rak masih kosong" description="Bacaan berjenjang akan muncul setelah konten dimuat." />
    )}

    {loadState === 'ready' && section === 'practice' && (
      practiceLinks && practiceLinks.length > 0 ? <div className="stack">
        {practiceLinks.map(link => <button key={link.id} type="button" className="unit-row"
          onClick={() => onOpenPractice?.(link.id)}>
          <Icon name="play" /><span><strong>{link.id === 'exam' ? 'Uji A1 · Uji Tiruan' : link.label}</strong>{link.meta && <small>{link.meta}</small>}</span>
          <Icon name="arrow" />
        </button>)}
      </div> : <div className="stack">
        {(['listening', 'writing', 'conversation'] as const).map((kind, i) => <button key={kind}
          type="button" className="unit-row" onClick={() => onOpenPractice?.(kind)}>
          <Icon name="play" /><span><strong>{['Mendengar', 'Menulis', 'Percakapan bercabang'][i]}</strong></span><Icon name="arrow" />
        </button>)}
        <button type="button" className="unit-row" onClick={() => onOpenPractice?.('drills')}>
          <Icon name="play" /><span><strong>Drill D1-D10</strong></span><Icon name="arrow" />
        </button>
        <button type="button" className="unit-row" onClick={() => onOpenPractice?.('exam')}>
          <Icon name="play" /><span><strong>Uji Tiruan A1</strong></span><Icon name="arrow" />
        </button>
      </div>
    )}
  </div>;
}
