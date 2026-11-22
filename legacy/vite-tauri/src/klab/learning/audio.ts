// Pemutar klip WAV lokal untuk alur KLAB. Tidak memakai jaringan dan tidak
// mengganti TTS: memakai file yang sama dengan manifest audio bundle A1.
// Perilaku port dari worktree desain: diam secara default, WAV hanya saat
// diminta, dan satu urutan saja (klip lama dibatalkan sebelum yang baru).
import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';

const CLIPS = {
  ...import.meta.glob<string>('./assets/*.wav', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob<string>('./assets/stok/*.wav', { eager: true, query: '?url', import: 'default' }),
};

const playbackError = 'Audio tidak dapat diputar. Teks tetap bisa dibaca. Tekan Dengarkan untuk coba lagi.';

export function clipUrl(file: string): string | undefined {
  return CLIPS[`./assets/${file}`] ?? CLIPS[`./assets/stok/${file}`];
}

export function useClipPlayer() {
  const [state, setState] = useState<AudioState>('idle');
  const [message, setMessage] = useState('');
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);
  const cancelClip = useRef<(() => void) | null>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const runId = useRef(0);

  const cancel = useCallback(() => {
    runId.current += 1;
    cancelClip.current?.();
    cancelClip.current = null;
  }, []);

  const stop = useCallback((next: AudioState = 'idle', text = '') => {
    cancel();
    setActiveClipIndex(null);
    setState(next);
    setMessage(text);
  }, [cancel]);

  // Satu tombol = satu urutan klip. Klip sebelumnya dibatalkan sehingga tidak
  // pernah bertumpuk, termasuk saat pengguna menekan Dengarkan berulang kali.
  const play = useCallback(async (files: readonly string[], label: string) => {
    cancel();
    const id = runId.current;
    setActiveClipIndex(null);
    if (files.length === 0) {
      setState('error');
      setMessage('Audio tidak tersedia untuk kalimat ini. Teks tetap bisa dibaca.');
      return;
    }
    setState('loading');
    setMessage('Menyiapkan audio…');
    for (let index = 0; index < files.length; index += 1) {
      const url = clipUrl(files[index]);
      if (!url) {
        setState('error');
        setMessage(playbackError);
        return;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(url);
          currentAudio.current = audio;
          const listeners = new AbortController();
          const finish = (result: 'ended' | 'cancelled' | 'error') => {
            if (listeners.signal.aborted) return;
            listeners.abort();
            if (currentAudio.current === audio) currentAudio.current = null;
            if (result !== 'ended') {
              audio.pause();
              audio.removeAttribute('src');
              audio.load();
            }
            if (result === 'error') reject(new Error('audio-error'));
            else resolve();
          };
          cancelClip.current = () => finish('cancelled');
          audio.addEventListener('ended', () => finish('ended'), { signal: listeners.signal });
          audio.addEventListener('error', () => finish('error'), { signal: listeners.signal });
          void audio.play().then(() => {
            if (listeners.signal.aborted) return;
            setActiveClipIndex(index);
            setState('playing');
            setMessage(index === 0 ? label : `Memutar kalimat ${index + 1} dari ${files.length}…`);
          }, () => finish('error'));
        });
      } catch {
        if (runId.current !== id) return;
        cancelClip.current = null;
        setActiveClipIndex(null);
        setState('error');
        setMessage(playbackError);
        return;
      }
      if (runId.current !== id) return;
      cancelClip.current = null;
      setActiveClipIndex(null);
    }
    setState('finished');
    setMessage('Audio selesai. Kamu bisa mendengarkan lagi.');
  }, [cancel]);

  const pause = useCallback(() => {
    if (state !== 'playing' || !currentAudio.current) return;
    currentAudio.current.pause();
    setState('paused');
    setMessage('Audio dijeda.');
  }, [state]);

  const resume = useCallback(() => {
    if (state !== 'paused' || !currentAudio.current) return;
    void currentAudio.current.play().then(() => {
      setState('playing');
      setMessage('Audio dilanjutkan.');
    }).catch(() => {
      setState('error');
      setMessage(playbackError);
    });
  }, [state]);

  // Sekali putar untuk cue properti; tidak mengubah giliran dialog dan tidak
  // boleh bertumpuk dengan tuturan (runId yang sama dipakai).
  const playOnce = useCallback(async (file: string) => {
    const url = clipUrl(file);
    if (!url) return;
    cancel();
    const id = runId.current;
    try {
      await new Promise<void>((resolve, reject) => {
        const element = new Audio(url);
        const listeners = new AbortController();
        const finish = (result: 'ended' | 'cancelled' | 'error') => {
          if (listeners.signal.aborted) return;
          listeners.abort();
          if (result !== 'ended') { element.pause(); element.removeAttribute('src'); element.load(); }
          if (result === 'error') reject(new Error('cue-error'));
          else resolve();
        };
        cancelClip.current = () => finish('cancelled');
        element.addEventListener('ended', () => finish('ended'), { signal: listeners.signal });
        element.addEventListener('error', () => finish('error'), { signal: listeners.signal });
        void element.play().catch(() => finish('error'));
      });
    } catch {
      if (runId.current === id) cancelClip.current = null;
    }
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { state, message, activeClipIndex, play, playOnce, pause, resume, stop };
}
