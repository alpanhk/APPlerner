// Adegan dialog Im Café hasil port editorial. Baca diam secara default;
// WAV lokal diputar hanya setelah tombol ditekan. Perbaikan U-X1..U-X4:
// fullscreen pada wrapper div, kontrol ikon kiri/kanan atas, dua giliran
// DE-ID, klip dialog per giliran, dan stop di dalam dialog.
// Tidak menyentuh CSS/shell 4a; gaya lokal memakai inline style.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useClipPlayer } from './audio';
import { CafeScene } from './CafeScene';
import { cafeDialogPlan, CAFE_DIALOG, fullscreenDecision, type CafeSpeaker } from './logic';

export type CafeDialogProps = {
  open: boolean;
  onDismiss: () => void;
  onExit: () => void;
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="6" y="6" width="12" height="12" fill="currentColor" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" fill="currentColor" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M10 4H4v16h6v-2H6V6h4zm5.6 4.6L14.2 10l3 3H9v2h8.2l-3 3 1.4 1.4L19 13z" fill="currentColor" />
    </svg>
  );
}

export function CafeDialog({ open, onDismiss, onExit }: CafeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const enteredFullscreen = useRef(false);
  const audio = useClipPlayer();
  const plan = cafeDialogPlan();
  const [turn, setTurn] = useState<0 | 1>(0);
  const cuePlayed = useRef(false);
  const audioStarting = useRef(false);

  async function enterFullscreen() {
    const decision = fullscreenDecision(!!document.fullscreenElement, enteredFullscreen.current);
    if (!decision.enter) return;
    try {
      // U-X1: target wrapper div, bukan <dialog> (dialog sering ditolak WebView2).
      await stageRef.current?.requestFullscreen();
      enteredFullscreen.current = true;
    } catch {
      enteredFullscreen.current = false;
    }
  }

  async function restoreWindowMode() {
    const decision = fullscreenDecision(!!document.fullscreenElement, enteredFullscreen.current);
    if (!decision.exit) return;
    try {
      await document.exitFullscreen();
    } catch {
      // Mode jendela sudah pulih atau dokumen keluar fullscreen.
    }
    enteredFullscreen.current = false;
  }

  function dismiss() {
    audio.stop();
    void restoreWindowMode();
    setTurn(0);
    onDismiss();
  }

  function exitLesson() {
    audio.stop();
    void restoreWindowMode();
    setTurn(0);
    onExit();
  }

  useEffect(() => {
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
      void enterFullscreen();
    }
    if (!open && dialogRef.current?.open) dialogRef.current.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Semua jalur keluar (Esc, tombol, unmount) memulihkan mode jendela.
  useEffect(() => () => { void restoreWindowMode(); }, []);

  useLayoutEffect(() => {
    if (audio.activeClipIndex !== null) setTurn(audio.activeClipIndex === 0 ? 0 : 1);
  }, [audio.activeClipIndex]);

  // Klik cepat saat status masih loading tidak boleh memulai trek kedua.
  useEffect(() => {
    if (audio.state !== 'loading') audioStarting.current = false;
  }, [audio.state]);

  // Cue cangkir sekali, setelah tuturan pesanan selesai (tidak bertumpuk).
  useEffect(() => {
    if (turn === 1 && audio.state === 'finished' && !cuePlayed.current) {
      cuePlayed.current = true;
      void audio.playOnce('im-cafe-cangkir-di-meja.wav');
    }
  }, [turn, audio.state]);

  const audioActive = audio.state === 'playing' || audio.state === 'loading';
  const current = CAFE_DIALOG[turn];
  const speaker: CafeSpeaker = current.speaker;
  const iconButton: CSSProperties = {
    width: 44,
    height: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    borderRadius: 8,
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.9)',
    color: '#12265c',
  };

  return (
    <dialog
      ref={dialogRef}
      className="cafe-port-dialog"
      data-testid="cafe-dialog"
      aria-label="Dialog di kafe"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', border: 0, padding: 0, margin: 0, background: 'transparent' }}
    >
      <div
        ref={stageRef}
        className="cafe-port-stage"
        data-testid="cafe-stage"
        style={{ position: 'relative', width: '100%', height: '100%', background: '#0b1220' }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <CafeScene speaker={speaker} showCoffee={turn === plan.coffeeTurn} />
        </div>

        {/* U-X2: ikon audio kiri atas, panah kembali + keluar kanan atas */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
          <button
            className="button cafe-port-icon"
            type="button"
            data-testid="cafe-audio-toggle"
            data-state={audio.state}
            disabled={audio.state === 'loading'}
            aria-label={audioActive ? 'Hentikan audio dialog' : audio.state === 'loading' ? 'Menyiapkan audio dialog' : 'Putar audio dialog'}
            title={audioActive ? 'Hentikan audio dialog' : 'Putar audio dialog'}
            aria-describedby="cafe-dialog-audio-status"
            style={iconButton}
            onClick={() => {
              if (audio.state === 'loading' || audioStarting.current) return;
              if (audioActive) audio.stop();
              else { audioStarting.current = true; setTurn(0); void audio.play(plan.files, 'Memutar dialog…'); }
            }}
          >
            {audioActive ? <StopIcon /> : <PlayIcon />}
          </button>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'flex', gap: 8 }}>
          <button
            className="button cafe-port-icon"
            type="button"
            data-testid="cafe-dialog-dismiss"
            aria-label="Kembali ke materi"
            title="Kembali ke materi"
            style={iconButton}
            onClick={dismiss}
          >
            <BackIcon />
          </button>
          <button
            className="button cafe-port-icon"
            type="button"
            data-testid="cafe-dialog-exit"
            aria-label="Keluar dari pelajaran"
            title="Keluar dari pelajaran"
            style={iconButton}
            onClick={exitLesson}
          >
            <ExitIcon />
          </button>
        </div>

        {/* U-X4: stop eksplisit di dalam dialog */}
        {audioActive ? (
          <div style={{ position: 'absolute', bottom: 116, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
            <button
              className="button"
              type="button"
              data-testid="cafe-audio-stop"
              aria-label="Hentikan audio"
              onClick={() => audio.stop()}
            >
              Hentikan audio
            </button>
          </div>
        ) : null}

        <div
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, color: '#fff', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}
        >
          <p style={{ fontSize: 12, opacity: 0.8 }}>{turn + 1} / {CAFE_DIALOG.length}</p>
          <p className="cafe-port-caption" lang="de" data-testid="cafe-dialog-caption" style={{ fontSize: 22, margin: '4px 0' }}>
            {current.de}
          </p>
          <p className="cafe-port-translation" data-testid="cafe-dialog-translation" style={{ fontSize: 16, margin: 0 }}>
            {current.id}
          </p>
          <p id="cafe-dialog-audio-status" role="status" data-state={audio.state} style={{ fontSize: 12, marginTop: 8 }}>
            {audio.message}
          </p>
        </div>
      </div>
    </dialog>
  );
}
