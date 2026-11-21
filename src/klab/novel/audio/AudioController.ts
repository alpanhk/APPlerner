// ===== Pengendali audio tunggal =====
// Satu tuturan pada satu waktu; musik & suasana loop; efek disintesis WebAudio.

import type { Settings, SfxId } from "../types";
import { AUDIO as MEDIA } from "../data/audio-manifest";

type Listener = (state: SpeechState) => void;
export interface SpeechState {
  speaking: boolean;
  token: number;
  status: "idle" | "clip" | "tts" | "no-voice" | "muted";
}

export class AudioController {
  private settings: Settings;
  private clip: HTMLAudioElement | null = null;
  private music: HTMLAudioElement | null = null;
  private ambience: HTMLAudioElement | null = null;
  private ambienceKey: string | null = null;
  private ctx: AudioContext | null = null;
  private token = 0;
  private listeners = new Set<Listener>();
  private unlocked = false;
  private speaking = false;
  public lastStatus: SpeechState["status"] = "idle";
  private germanVoice: SpeechSynthesisVoice | null | undefined = undefined;

  constructor(settings: Settings) {
    this.settings = settings;
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.addEventListener?.("voiceschanged", () => {
        this.germanVoice = undefined;
      });
    }
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  private emit(status: SpeechState["status"]) {
    this.lastStatus = status;
    const s: SpeechState = { speaking: this.speaking, token: this.token, status };
    this.listeners.forEach((l) => l(s));
  }

  /** Panggil pada interaksi pengguna pertama. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
    this.applyVolumes();
  }

  updateSettings(s: Settings) {
    this.settings = s;
    this.applyVolumes();
    if (!s.soundOn) {
      this.stopSpeech();
    }
  }

  private applyVolumes() {
    const on = this.settings.soundOn;
    if (this.music) this.music.volume = on ? this.settings.volMusic * 0.5 : 0;
    if (this.ambience) this.ambience.volume = on ? this.settings.volAmbience * (this.speaking ? 0.25 : 0.6) : 0;
    if (this.clip) this.clip.volume = on ? this.settings.volDialog : 0;
  }

  // ---------- Musik & suasana ----------
  startMusic() {
    if (!this.unlocked) return;
    if (!this.music) {
      this.music = new Audio(MEDIA["music:idle-jelajah"].src);
      this.music.loop = true;
    }
    this.applyVolumes();
    void this.music.play().catch(() => {});
  }
  stopMusic() {
    this.music?.pause();
  }

  setAmbience(key: "rumah" | "jalan" | "none") {
    if (key === this.ambienceKey) return;
    this.ambienceKey = key;
    if (key === "none") {
      this.ambience?.pause();
      return;
    }
    if (!this.unlocked) return;
    if (!this.ambience) {
      this.ambience = new Audio(MEDIA["ambience:ruang-tenang"].src);
      this.ambience.loop = true;
    }
    this.applyVolumes();
    void this.ambience.play().catch(() => {});
  }

  // ---------- Tuturan ----------
  stopSpeech() {
    this.token++;
    if (this.clip) {
      this.clip.pause();
      this.clip.onended = null;
      this.clip = null;
    }
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    if (this.speaking) {
      this.speaking = false;
      this.applyVolumes();
      this.emit("idle");
    }
  }

  private pickGermanVoice(): SpeechSynthesisVoice | null {
    if (this.germanVoice !== undefined) return this.germanVoice;
    if (typeof speechSynthesis === "undefined") return (this.germanVoice = null);
    const voices = speechSynthesis.getVoices();
    const de = voices.filter((v) => v.lang.toLowerCase().startsWith("de"));
    const pref = de.find((v) => v.lang.toLowerCase() === "de-de") ?? de[0] ?? null;
    if (voices.length > 0) this.germanVoice = pref;
    return pref;
  }

  /**
   * Putar satu kalimat. Menghentikan tuturan sebelumnya.
   * Mengembalikan Promise yang selesai ketika tuturan berakhir atau dihentikan.
   */
  speak(text: string, assetId?: string): Promise<void> {
    this.stopSpeech();
    if (!this.settings.soundOn) {
      this.emit("muted");
      return Promise.resolve();
    }
    const myToken = ++this.token;
    const asset = assetId ? MEDIA[assetId] : undefined;

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (this.token !== myToken) return resolve();
        this.speaking = false;
        this.applyVolumes();
        this.emit("idle");
        resolve();
      };

      if (asset && asset.src) {
        const a = new Audio(asset.src);
        this.clip = a;
        a.volume = this.settings.volDialog;
        a.onended = finish;
        a.onerror = () => this.speakTts(text, myToken, finish);
        this.speaking = true;
        this.applyVolumes();
        this.emit("clip");
        a.play().catch(() => this.speakTts(text, myToken, finish));
        return;
      }
      this.speakTts(text, myToken, finish);
    });
  }

  private speakTts(text: string, myToken: number, finish: () => void) {
    if (this.token !== myToken) return finish();
    if (typeof speechSynthesis === "undefined") {
      this.speaking = false;
      this.emit("no-voice");
      return finish();
    }
    const voice = this.pickGermanVoice();
    if (!voice) {
      this.speaking = false;
      this.emit("no-voice");
      return finish();
    }
    const u = new SpeechSynthesisUtterance(text.replace(/[„“”]/g, ""));
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.9;
    u.volume = this.settings.volDialog;
    u.onend = finish;
    u.onerror = finish;
    this.speaking = true;
    this.applyVolumes();
    this.emit("tts");
    speechSynthesis.speak(u);
    // Pengaman: beberapa browser tidak memanggil onend
    const est = 1500 + text.length * 90;
    setTimeout(() => {
      if (this.token === myToken && this.speaking) finish();
    }, est + 4000);
  }

  // ---------- Efek sintesis & berkas ----------
  playSfx(id: SfxId) {
    if (!this.settings.soundOn) return;
    const vol = this.settings.volSfx;
    if (vol <= 0) return;
    // SFX produksi berkas (peron-chime, telepon, kertas) — diputar apa adanya.
    const fileAsset = MEDIA[`sfx:${id}`];
    if (fileAsset && fileAsset.src) {
      const a = new Audio(fileAsset.src);
      a.volume = vol;
      void a.play().catch(() => {});
      return;
    }
    if (!this.ctx) return;
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    const now = ctx.currentTime;

    const noise = (dur: number) => {
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      return src;
    };

    switch (id) {
      case "knock": {
        [0, 0.28].forEach((t) => {
          const src = noise(0.12);
          const f = ctx.createBiquadFilter();
          f.type = "lowpass";
          f.frequency.value = 220;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.9, now + t);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
          src.connect(f).connect(g).connect(master);
          src.start(now + t);
          const o = ctx.createOscillator();
          o.frequency.setValueAtTime(140, now + t);
          o.frequency.exponentialRampToValueAtTime(60, now + t + 0.1);
          const og = ctx.createGain();
          og.gain.setValueAtTime(0.5, now + t);
          og.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
          o.connect(og).connect(master);
          o.start(now + t);
          o.stop(now + t + 0.12);
        });
        break;
      }
      case "hinge": {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(420, now + 0.7);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 11;
        const lg = ctx.createGain();
        lg.gain.value = 25;
        lfo.connect(lg).connect(o.frequency);
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 600;
        f.Q.value = 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        o.connect(f).connect(g).connect(master);
        o.start(now);
        lfo.start(now);
        o.stop(now + 0.85);
        lfo.stop(now + 0.85);
        break;
      }
      case "bell": {
        [0, 0.13].forEach((t) => {
          [2300, 2900].forEach((fr) => {
            const o = ctx.createOscillator();
            o.frequency.value = fr;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.18, now + t);
            g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.6);
            o.connect(g).connect(master);
            o.start(now + t);
            o.stop(now + t + 0.65);
          });
        });
        break;
      }
      case "paper": {
        const src = noise(0.45);
        const f = ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.35, now + 0.05);
        g.gain.linearRampToValueAtTime(0.12, now + 0.2);
        g.gain.linearRampToValueAtTime(0.3, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        src.connect(f).connect(g).connect(master);
        src.start(now);
        break;
      }
      case "tram": {
        const src = noise(3.5);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(90, now);
        f.frequency.linearRampToValueAtTime(160, now + 1.6);
        f.frequency.linearRampToValueAtTime(80, now + 3.4);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.5, now + 1.5);
        g.gain.linearRampToValueAtTime(0.0001, now + 3.5);
        src.connect(f).connect(g).connect(master);
        src.start(now);
        break;
      }
    }
  }

  stopAll() {
    this.stopSpeech();
    this.setAmbience("none");
    this.stopMusic();
  }
}




