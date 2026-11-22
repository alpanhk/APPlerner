// Percakapan berlapis Im Café dari rak: CTA "Mulai percakapan", dua giliran
// tokoh, mode senyap tetap dapat dituntaskan, satu pengendali suara.
// Tidak menyentuh App/routeView/pages/CSS milik 1a/4a.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useClipPlayer } from './audio';
import { CafeScene } from './CafeScene';
import { CAFE_DIALOG, cupCueDecision, type CafeSpeaker } from './logic';
import { soundController, type SoundState } from './soundController';

export type CafeConversationProps = {
  onBack: () => void;
  onStartTask?: () => void;
  autoPlay?: boolean;
};

function reducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

export function CafeConversation({ onBack, onStartTask, autoPlay = false }: CafeConversationProps) {
  const audio = useClipPlayer();
  const [turn, setTurn] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [sound, setSound] = useState<SoundState>(soundController.get());
  const speakerRef = useRef<HTMLHeadingElement>(null);
  const [motion] = useState(reducedMotion);
  const cueChecked = useRef(false);
  const autoPlayed = useRef(false);
  const audioStarting = useRef(false);

  useEffect(() => soundController.subscribe((next) => setSound(next)), []);
  useEffect(() => {
    if (autoPlay && !autoPlayed.current) {
      autoPlayed.current = true;
      void audio.play(CAFE_DIALOG.map((turn) => turn.file), 'Memutar dialog…');
    }
  }, [autoPlay]);
  useEffect(() => {
    soundController.setRoute('cafe');
    return () => { soundController.setRoute('other'); soundController.setSpeech(false); };
  }, []);
  useEffect(() => {
    soundController.setSpeech(audio.state === 'playing' || audio.state === 'loading');
    if (audio.state !== 'loading') audioStarting.current = false;
  }, [audio.state]);
  useEffect(() => {
    if (audio.activeClipIndex !== null) setTurn(audio.activeClipIndex === 0 ? 0 : 1);
  }, [audio.activeClipIndex]);
  useEffect(() => {
    if (turn === 1 && audio.state === 'finished' && !cueChecked.current && sound.cuePlayed === false) {
      cueChecked.current = true;
      if (cupCueDecision(sound.cuePlayed, false)) {
        soundController.markCue();
        void audio.playOnce('im-cafe-cangkir-di-meja.wav');
      }
    }
  }, [turn, audio.state, sound.cuePlayed]);
  useLayoutEffect(() => { speakerRef.current?.focus({ preventScroll: true }); }, [turn]);

  function exit() {
    audio.stop();
    soundController.setSpeech(false);
    setActionMessage('Keluar dari percakapan; audio dihentikan.');
    onBack();
  }

  const current = CAFE_DIALOG[turn];
  const speaker: CafeSpeaker = current.speaker;
  const canCue = cupCueDecision(sound.cuePlayed, false);
  const transition: CSSProperties = motion ? {} : { transition: 'opacity 180ms ease, transform 180ms ease' };

  return (
    <section className="cafe-conversation" data-testid="cafe-conversation" aria-label="Percakapan Im Café">
      <div className="focus-header">
        <button className="button" type="button" data-testid="cafe-conv-back" onClick={() => { audio.stop(); setActionMessage('Kembali ke buku; audio dihentikan.'); onBack(); }}>
          Kembali ke buku
        </button>
        <h1 id="klab-cafe-title">Im Café · percakapan</h1>
        <button className="button" type="button" data-testid="cafe-conv-exit" onClick={exit}>Keluar</button>
      </div>

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
        <CafeScene speaker={speaker} showCoffee={turn === 1} />
        <h2 ref={speakerRef} tabIndex={-1} data-testid="cafe-conv-speaker" style={transition}>
          {speaker === 'barista' ? 'Barista' : 'Pemelajar'}
        </h2>
        <p lang="de" data-testid="cafe-conv-line" style={transition}>{current.de}</p>
        {showMeaning ? <p data-testid="cafe-conv-meaning">{current.id}</p> : null}
        <p id="cafe-conv-audio-status" role="status" data-state={audio.state} data-testid="cafe-conv-audio-state">{audio.message}</p>
        <p role="status" data-testid="cafe-conv-action">{actionMessage}</p>
      </div>

      <div className="actions" data-testid="cafe-conv-controls">
        <button className="button button-primary" type="button" data-testid="cafe-conv-play"
          data-state={audio.state} disabled={audio.state === 'loading'}
          aria-label={audio.state === 'playing' ? 'Jeda audio dialog' : audio.state === 'paused' ? 'Lanjutkan audio dialog' : 'Putar audio dialog'}
          onClick={() => {
            if (audio.state === 'playing') { audio.pause(); setActionMessage('Audio dijeda.'); return; }
            if (audio.state === 'paused') { audio.resume(); setActionMessage('Audio dilanjutkan.'); return; }
            if (audio.state === 'loading' || audioStarting.current) return;
            audioStarting.current = true;
            setTurn(0);
            setActionMessage('Memutar dialog dari awal.');
            void audio.play(CAFE_DIALOG.map((t) => t.file), 'Memutar dialog…');
          }}>
          {audio.state === 'playing' ? 'Jeda' : audio.state === 'paused' ? 'Lanjutkan' : audio.state === 'loading' ? 'Menyiapkan…' : 'Mulai percakapan'}
        </button>
        <button className="button" type="button" data-testid="cafe-conv-stop"
          disabled={audio.state === 'idle' || audio.state === 'finished' || audio.state === 'error'}
          onClick={() => { audio.stop(); setActionMessage('Audio dihentikan.'); }}>
          Hentikan
        </button>
        <button className="button" type="button" data-testid="cafe-conv-replay"
          disabled={audio.state === 'loading'}
          onClick={() => { setActionMessage('Mengulang giliran ini.'); void audio.play([current.file], 'Ulangi giliran…'); }}>
          Ulangi giliran
        </button>
        <button className="button" type="button" data-testid="cafe-conv-next"
          disabled={turn >= CAFE_DIALOG.length - 1}
          onClick={() => { audio.stop(); setTurn(turn + 1); setActionMessage('Berpindah ke giliran berikutnya (senyap tersedia).'); }}>
          Berikutnya
        </button>
        <button className="button" type="button" data-testid="cafe-conv-meaning-toggle"
          aria-expanded={showMeaning} onClick={() => { setShowMeaning((value) => !value); setActionMessage(showMeaning ? 'Arti disembunyikan.' : 'Arti ditampilkan.'); }}>
          Lihat arti
        </button>
        {onStartTask ? (
          <button className="button" type="button" data-testid="cafe-conv-task" onClick={() => { audio.stop(); setActionMessage('Membuka latihan singkat.'); onStartTask(); }}>
            Latihan singkat
          </button>
        ) : null}
      </div>
      {canCue ? <span data-testid="cafe-cue-ready" hidden /> : null}
    </section>
  );
}
