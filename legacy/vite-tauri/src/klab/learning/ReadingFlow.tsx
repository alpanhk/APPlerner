// Rak Im Café -> cuplikan -> baca/dengar -> kembali. Memakai teks A1 nyata
// dan klip WAV bundle yang sama dengan bacaan, bukan cuplikan simulasi.
import { useEffect, useRef, useState } from 'react';
import cover from './assets/sampul-im-cafe.webp';
import { useClipPlayer } from './audio';
import { CafeConversation } from './CafeConversation';
import { dialogAvailability, getReading, readingAudioPlan, readingByTitle, type ReadingView } from './logic';
import { soundController } from './soundController';

type RouteLike = { name?: string; unitNo?: number; lessonNo?: number; textId?: number };

export type ReadingFlowProps = {
  textId?: number;
  title?: string;
  initialView?: 'shelf' | 'preview' | 'reader';
  autoPlay?: boolean;
  onBack?: () => void;
  onStartTask?: () => void;
  route?: RouteLike;
  back?: () => void;
  targets?: readonly unknown[];
};

type View = 'shelf' | 'preview' | 'reader' | 'conversation';

function captureScroll(element: HTMLElement | null): Array<[HTMLElement, number]> {
  const positions: Array<[HTMLElement, number]> = [];
  for (let node = element?.parentElement ?? null; node; node = node.parentElement) {
    positions.push([node, node.scrollTop]);
  }
  return positions;
}

export function ReadingFlow({
  textId,
  title = 'Im Café',
  initialView = 'shelf',
  autoPlay = false,
  onBack,
  onStartTask,
  route,
  back,
}: ReadingFlowProps) {
  const resolvedTextId = textId ?? route?.textId ?? 10;
  const handleBack = onBack ?? back;
  const reading: ReadingView | null =
    title ? (readingByTitle(title) ?? getReading(resolvedTextId)) : getReading(resolvedTextId);
  const plan = reading ? readingAudioPlan(reading) : [];
  const [view, setView] = useState<View>(initialView);
  const bookRef = useRef<HTMLButtonElement>(null);
  const shelfScroll = useRef<Array<[HTMLElement, number]>>([]);
  const autoPlayed = useRef(false);
  const audio = useClipPlayer();
  const dialogue = dialogAvailability(resolvedTextId);
  const [conversationFromAudio, setConversationFromAudio] = useState(false);

  useEffect(() => {
    soundController.setRoute(view === 'conversation' ? 'cafe' : view === 'reader' || view === 'preview' ? 'other' : 'explore');
    soundController.setReading(view === 'reader' && audio.state === 'playing');
    return () => { soundController.setReading(false); };
  }, [view, audio.state]);
  // Masuk langsung dari cuplikan ExplorePage: jangan tampilkan rak ganda dan
  // tombol "Kembali ke rak" mengembalikan kontrol ke pemanggil rute.
  const directFromExplore = initialView === 'reader' || initialView === 'preview';

  useEffect(() => {
    if (view === 'reader') {
      document.getElementById('klab-reader-heading')?.focus({ preventScroll: true });
    }
  }, [view]);

  useEffect(() => {
    if (autoPlay && initialView === 'reader' && plan.length > 0 && !autoPlayed.current) {
      autoPlayed.current = true;
      void audio.play(plan, 'Memutar bacaan…');
    }
  }, [autoPlay, initialView, plan.join('|'), audio]);

  function openPreview() {
    shelfScroll.current = captureScroll(bookRef.current);
    setView('preview');
  }

  function backToShelf() {
    audio.stop();
    if (directFromExplore) {
      handleBack?.();
      return;
    }
    setView('shelf');
    window.setTimeout(() => {
      bookRef.current?.focus({ preventScroll: true });
      for (const [node, top] of shelfScroll.current) node.scrollTop = top;
    }, 0);
  }

  if (!reading) {
    return (
      <section className="reader" aria-label="Bacaan tidak tersedia">
        <h1>Bacaan belum tersedia</h1>
        <button className="button" type="button" onClick={handleBack}>Kembali</button>
      </section>
    );
  }

  if (view === 'shelf') {
    return (
      <section className="shelf" aria-labelledby="klab-shelf-heading">
        <div className="focus-header">
          <button className="back-button" type="button" onClick={handleBack ?? backToShelf}>Kembali</button>
          <h1 id="klab-shelf-heading">Jelajah · Rak bacaan A1</h1>
        </div>
        <button className="book-card" type="button" ref={bookRef} onClick={openPreview}>
          <img className="book-cover" src={cover} alt="" />
          <span className="book-meta">{reading.level} · Unit 4</span>
          <strong>{reading.title}</strong>
        </button>
      </section>
    );
  }

  if (view === 'preview') {
    return (
      <section className="book-preview" data-entering="true" aria-labelledby="klab-preview-heading">
        <div className="focus-header">
          <button className="back-button" type="button" onClick={backToShelf}>Kembali ke rak</button>
        </div>
        <h1 id="klab-preview-heading" tabIndex={-1}>{reading.title}</h1>
        <p lang="de">{reading.sentences[0]?.de}</p>
        <p>{reading.sentences[0]?.id}</p>
        <p data-testid="dialog-availability" data-kind={dialogue.kind}>{dialogue.label}</p>
        <div className="actions">
          {dialogue.kind === 'full' ? (
            <>
              <button className="button button-primary" type="button" data-testid="preview-start-dialog"
                onClick={() => { audio.stop(); setConversationFromAudio(false); setView('conversation'); }}>
                Mulai percakapan
              </button>
              <button className="button" type="button" id="listen-book" data-testid="preview-listen-dialog"
                aria-describedby="klab-reader-audio-status"
                onClick={() => { audio.stop(); setConversationFromAudio(true); setView('conversation'); }}>
                Dengarkan
              </button>
              <button className="button" type="button" data-testid="preview-full-text" onClick={() => setView('reader')}>
                Teks lengkap
              </button>
            </>
          ) : (
            <>
              <button className="button button-primary" type="button" onClick={() => setView('reader')}>Baca</button>
              <button className="button" type="button" id="listen-book" aria-describedby="klab-reader-audio-status"
                onClick={() => { setView('reader'); void audio.play(plan, 'Memutar bacaan…'); }}>
                Dengarkan
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  if (view === 'conversation') {
    return (
      <CafeConversation
        autoPlay={conversationFromAudio}
        onStartTask={onStartTask}
        onBack={() => {
          audio.stop();
          if (directFromExplore) handleBack?.();
          else setView('preview');
        }}
      />
    );
  }

  return (
    <section className="reader" aria-labelledby="klab-reader-heading">
      <div className="focus-header">
        <button className="back-button" type="button" onClick={backToShelf}>Kembali ke rak</button>
        <h1 id="klab-reader-heading" tabIndex={-1}>{reading.title}</h1>
        {dialogue.kind === 'full' ? (
          <>
            <button className="button button-primary" type="button" data-testid="reader-start-dialog"
              onClick={() => { audio.stop(); setConversationFromAudio(false); setView('conversation'); }}>
              Mulai percakapan
            </button>
            <button className="button" type="button" data-testid="reader-listen-dialog"
              onClick={() => { audio.stop(); setConversationFromAudio(true); setView('conversation'); }}>
              Dengarkan
            </button>
            <span className="badge" data-testid="reader-full-text">Teks lengkap</span>
          </>
        ) : (
          <button
            className="button"
            type="button"
            aria-describedby="klab-reader-audio-status"
            onClick={() => void audio.play(plan, 'Memutar bacaan…')}
          >
            {audio.state === 'playing' ? 'Hentikan audio' : 'Dengarkan'}
          </button>
        )}
      </div>
      <div className="reader-content">
        {reading.sentences.map((sentence, index) => (
          <div
            className="reading-pair"
            data-active={index === audio.activeClipIndex ? 'true' : undefined}
            data-state={index === audio.activeClipIndex ? 'playing' : undefined}
            key={`${sentence.de}-${index}`}
          >
            <p lang="de">{sentence.de}</p>
            <p>{sentence.id}</p>
          </div>
        ))}
      </div>
      <p id="klab-reader-audio-status" data-state={audio.state} role="status">{audio.message}</p>
    </section>
  );
}
