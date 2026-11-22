import { CAST } from "@/story/cast";
import type { Sfx } from "@/story/types";

const PHOTO_BGS = new Set(["kamar", "jendela", "jalan", "pintu", "judul"]);

export const bgUrl = (bg: string) => (PHOTO_BGS.has(bg) ? `/media/bg/${bg}.jpg` : `/media/scenes/${bg}.webp`);

export function actorUrl(id: string, avatar: string, open = false): string {
  const base = id === "player" ? avatar : (CAST[id]?.img ?? "tutor");
  const hasOpen = id === "player" || CAST[id]?.open;
  return `/media/actors/${base}${open && hasOpen ? "-open" : ""}.webp`;
}

// ---------- Suara: kalimat Jerman dibacakan oleh peramban ----------
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[„“”"()[\]]/g, "").replace(/—/g, ", "));
  u.lang = "de-DE";
  u.rate = 0.88;
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("de"));
  if (voice) u.voice = voice;
  synth.speak(u);
}

export function stopSpeak() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// ---------- Efek bunyi: disintesis, tanpa berkas audio ----------
let ctx: AudioContext | null = null;

function tone(ac: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.18, slideTo?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + at + dur);
  gain.gain.setValueAtTime(vol, ac.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.02);
}

function noise(ac: AudioContext, at: number, dur: number, vol = 0.08) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  gain.gain.value = vol;
  src.buffer = buf;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(ac.currentTime + at);
}

export function playSfx(id: Sfx) {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const ac = ctx;
    if (ac.state === "suspended") void ac.resume();
    if (id === "knock") [0, 0.24].forEach((t) => tone(ac, 140, t, 0.12, "triangle", 0.35, 70));
    else if (id === "door") tone(ac, 220, 0, 0.5, "sawtooth", 0.05, 90);
    else if (id === "bell") [0, 0.16].forEach((t, i) => tone(ac, i ? 1320 : 1760, t, 0.7, "sine", 0.12));
    else if (id === "paper") [0, 0.14].forEach((t) => noise(ac, t, 0.16));
    else if (id === "tram") [0, 0.3].forEach((t) => tone(ac, 1180, t, 0.45, "triangle", 0.1));
    else if (id === "ring") [0, 0.12, 0.5, 0.62].forEach((t, i) => tone(ac, i % 2 ? 620 : 740, t, 0.1, "square", 0.05));
  } catch {
    // Audio tidak tersedia: cerita tetap berjalan.
  }
}
