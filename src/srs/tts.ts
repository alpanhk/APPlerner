// TTS offline: Piper untuk teks bebas, dengan klip bundle sebagai fallback terbatas.
// Piper memakai mesin & model yang diunduh sekali lewat perintah Rust; audio WAV
// dikirim balik sebagai base64 lalu diputar lewat Web Audio.
import { invoke } from "@tauri-apps/api/core";
import getDb from "../stores/db";
import bundleManifest from "../assets/tts_core/manifest.json";

export type PiperVoice = { id: string; name: string; size_mb: number; installed: boolean };
export type PiperStatus = { engine: boolean; dir: string; voices: PiperVoice[] };

let piper: PiperStatus | null = null;
let piperEnabled = true;
let piperVoice: string | null = null;
let piperFault: string | null = null;
let preferredRate = 0.85;

let bundleSource: AudioBufferSourceNode | null = null;
let bundleContext: AudioContext | null = null;
let numberAudioBuffer: AudioBuffer | null = null;
const bundledBuffers = new Map<string, AudioBuffer>();

type BundleManifest = {
  phrases: Record<string, string>;
  numbers: Record<string, { start: number; duration: number }>;
};
const BUNDLE = bundleManifest as BundleManifest;
const BUNDLE_URLS = import.meta.glob<string>("../assets/tts_core/*.wav", {
  eager: true,
  query: "?url",
  import: "default",
});

// Indeks manifest memakai normalisasi yang sama dengan pencarian. Tanpa ini,
// entri manifest yang masih memakai ejaan asli ("dreiunddreißig", "acht Uhr
// dreißig") tidak pernah cocok karena kunci pencarian sudah diubah ke "ss".
const PHRASE_INDEX = new Map<string, string>(
  Object.entries(BUNDLE.phrases).map(([key, file]) => [normalizeSpeech(key), file]),
);
const NUMBER_INDEX = new Map<string, { start: number; duration: number }>(
  Object.entries(BUNDLE.numbers).map(([key, segment]) => [normalizeSpeech(key), segment]),
);

// Cache audio Piper per (voice, rate, teks): kalimat/kata yang diulang langsung
// diputar tanpa sintesis ulang.
const audioCache = new Map<string, string>();
const CACHE_MAX = 80;
const PIPER_TIMEOUT_MS = 20000;


// ---- Piper -----------------------------------------------------------------
export async function refreshPiper(): Promise<PiperStatus> {
  try {
    piper = await invoke<PiperStatus>("piper_status");
  } catch (e) {
    console.error("piper_status:", e);
    piper = { engine: false, dir: "", voices: [] };
  }
  return piper;
}

export function piperStatusCached(): PiperStatus | null {
  return piper;
}

export function setPiperEnabled(enabled: boolean): void {
  piperEnabled = enabled;
  if (enabled) piperFault = null;
}

export function getPiperEnabled(): boolean {
  return piperEnabled;
}

export function setPiperVoice(id: string | null): void {
  piperVoice = id && id.trim() ? id : null;
  piperFault = null;
}

export function selectedPiperVoice(): string | null {
  if (!piper) return null;
  const chosen = piper.voices.find((v) => v.id === piperVoice && v.installed);
  if (chosen) return chosen.id;
  const first = piper.voices.find((v) => v.installed);
  return first ? first.id : null;
}

export function setTtsRate(rate: number): void {
  if (Number.isFinite(rate)) preferredRate = Math.min(1, Math.max(0.75, rate));
}

export function piperReady(): boolean {
  return piperEnabled && !!piper?.engine && selectedPiperVoice() !== null;
}

export function piperFaultMessage(): string | null {
  return piperFault;
}

export function retryPiper(): void {
  piperFault = null;
}

export async function installPiperEngine(): Promise<string> {
  const message = await invoke<string>("piper_install_engine");
  await refreshPiper();
  return message;
}

export async function installPiperVoice(id: string): Promise<string> {
  const message = await invoke<string>("piper_download_voice", { id });
  await refreshPiper();
  return message;
}

// Teks bebas siap dibacakan jika Piper tersedia.
export async function ttsReadyAsync(): Promise<boolean> {
  if (!piper) await refreshPiper();
  return piperReady() && !piperFault;
}

// D8 tersedia lewat klip bawaan meski Piper tidak terpasang.
export async function drillAudioReadyAsync(): Promise<boolean> {
  if (!piper) await refreshPiper();
  return (piperReady() && !piperFault) || numberBundleReady();
}

// Klip angka 1-100 dipotong dari satu WAV; tersedia tanpa Piper.
export function numberBundleReady(): boolean {
  return NUMBER_INDEX.size >= 100;
}

export type BundledClip =
  | { kind: "phrase"; file: string }
  | { kind: "number"; start: number; duration: number };

// Satu pintu untuk "apakah konten ini punya klip bawaan". UI memakai ini agar
// tombol audio hidup tanpa Piper, bukan hanya mengandalkan ketersediaan mesin.
export function bundledClipFor(text: string): BundledClip | null {
  const key = normalizeSpeech(text);
  if (!key) return null;
  const file = PHRASE_INDEX.get(key);
  if (file) return { kind: "phrase", file };
  const segment = NUMBER_INDEX.get(key);
  if (segment) return { kind: "number", start: segment.start, duration: segment.duration };
  return null;
}

export function hasBundledAudio(text: string): boolean {
  return bundledClipFor(text) !== null;
}

// Kemampuan audio per konten: Piper (teks bebas) atau klip bawaan (teks terkurasi).
export function audioCapability(text: string): "piper" | "bundle" | null {
  if (piperReady() && !piperFault) return "piper";
  return hasBundledAudio(text) ? "bundle" : null;
}

// Dibaca dari config (dipanggil setelah database siap).
export async function loadVoicePreference(): Promise<void> {
  try {
    const db = await getDb();
    const rows = await db.select<{ key: string; value: string }[]>(
      "SELECT key, value FROM config WHERE key IN ('piper_enabled','piper_voice','tts_rate')",
    );
    for (const row of rows) {
      if (row.key === "piper_enabled") piperEnabled = row.value !== "0";
      if (row.key === "piper_voice") piperVoice = row.value || null;
      if (row.key === "tts_rate") setTtsRate(Number(row.value));
    }
    await refreshPiper();
    void warmPiper();
  } catch (e) {
    console.error("gagal membaca preferensi voice:", e);
  }
}

function stopAudio(): void {
  if (bundleSource) {
    try {
      bundleSource.stop();
    } catch {
      /* already stopped */
    }
    bundleSource = null;
  }
}

// Setiap permintaan audio memakai token. Membatalkan permintaan (mis. pengguna
// keluar dari dialog) menaikkan token dan membatalkan fetch sehingga hasil
// Piper/fetch/decode yang datang terlambat tidak pernah diputar.
let speechToken = 0;
let speechAbort: AbortController | null = null;

function cancelOutstanding(): void {
  speechToken += 1;
  if (speechAbort) {
    speechAbort.abort();
    speechAbort = null;
  }
  stopAudio();
}

function beginSpeech(): { token: number; signal: AbortSignal } {
  cancelOutstanding();
  const controller = new AbortController();
  speechAbort = controller;
  return { token: speechToken, signal: controller.signal };
}

function isCurrent(token: number): boolean {
  return token === speechToken;
}

function getAudioContext(): AudioContext {
  if (!bundleContext) bundleContext = new AudioContext();
  return bundleContext;
}

function playBuffer(buffer: AudioBuffer, rate: number, token: number): Promise<void> {
  if (!isCurrent(token)) return Promise.resolve();
  const context = getAudioContext();
  stopAudio();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  source.connect(context.destination);
  bundleSource = source;
  const finished = new Promise<void>((resolve, reject) => {
    source.onended = () => {
      if (bundleSource === source) bundleSource = null;
      resolve();
    };
    try {
      if (!isCurrent(token)) {
        bundleSource = null;
        resolve();
        return;
      }
      source.start();
    } catch (error) {
      if (bundleSource === source) bundleSource = null;
      reject(error);
    }
  });
  return context.resume().then(() => finished);
}

async function decodeBase64Wav(base64: string): Promise<AudioBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return getAudioContext().decodeAudioData(bytes.buffer);
}

function normalizeSpeech(text: string): string {
  return text
    .normalize("NFC")
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss")
    .replace(/[.,!?…;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function playBundle(text: string, rate: number, token: number, signal: AbortSignal): Promise<boolean> {
  const clip = bundledClipFor(text);
  if (!clip) return false;
  if (clip.kind === "phrase") {
    const phraseFile = clip.file;
    const url = BUNDLE_URLS[`../assets/tts_core/${phraseFile}`];
    if (!url) return false;
    try {
      let buffer = bundledBuffers.get(phraseFile);
      if (!buffer) {
        const response = await fetch(url, { signal });
        if (!response.ok) return false;
        if (!isCurrent(token)) return false;
        buffer = await getAudioContext().decodeAudioData(await response.arrayBuffer());
        bundledBuffers.set(phraseFile, buffer);
      }
      if (!isCurrent(token)) return false;
      await playBuffer(buffer, rate, token);
      return true;
    } catch {
      return false;
    }
  }

  const numbersUrl = BUNDLE_URLS["../assets/tts_core/numbers_1_100.wav"];
  if (!numbersUrl) return false;
  try {
    if (!numberAudioBuffer) {
      const response = await fetch(numbersUrl, { signal });
      if (!response.ok) return false;
      if (!isCurrent(token)) return false;
      numberAudioBuffer = await getAudioContext().decodeAudioData(await response.arrayBuffer());
    }
    if (!isCurrent(token)) return false;
    const context = getAudioContext();
    stopAudio();
    const source = context.createBufferSource();
    source.buffer = numberAudioBuffer;
    source.playbackRate.value = rate;
    source.connect(context.destination);
    bundleSource = source;
    await context.resume();
    if (!isCurrent(token)) {
      bundleSource = null;
      return false;
    }
    source.start(0, clip.start, clip.duration);
    return true;
  } catch {
    return false;
  }
}

async function playWavData(b64: string, rate: number, token: number): Promise<void> {
  const buffer = await decodeBase64Wav(b64);
  if (!isCurrent(token)) return;
  await playBuffer(buffer, rate, token);
}

export async function warmPiper(): Promise<void> {
  if (!piperReady()) return;
  const voice = selectedPiperVoice();
  if (!voice) return;
  try {
    await invoke<string>("piper_speak", { text: "Hallo", voice, lengthScale: 1.2 });
  } catch (e) {
    console.error("warmPiper:", e);
  }
}

async function speakWithPiper(text: string, rate: number, token: number): Promise<boolean> {
  if (!piperReady() || piperFault) return false;
  const voice = selectedPiperVoice();
  if (!voice) return false;
  const key = `${voice}|${rate.toFixed(2)}|${text}`;
  try {
    const cached = audioCache.get(key);
    if (cached) {
      // Rate was already applied by Piper's length_scale during synthesis.
      // Applying AudioBuffer playbackRate here as well made speech too slow
      // and lowered its pitch.
      await playWavData(cached, 1, token);
      return isCurrent(token);
    }
    const request = invoke<string>("piper_speak", {
      text,
      voice,
      lengthScale: 1 / Math.max(0.5, Math.min(1.5, rate)),
    });
    let timeoutId: number | undefined;
    const b64 = await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error(`Piper tidak merespons dalam ${PIPER_TIMEOUT_MS / 1000} detik.`)),
          PIPER_TIMEOUT_MS,
        );
      }),
    ]).finally(() => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    });
    if (audioCache.size >= CACHE_MAX) {
      const oldest = audioCache.keys().next().value;
      if (oldest) audioCache.delete(oldest);
    }
    audioCache.set(key, b64);
    // Permintaan dibatalkan saat Piper masih bekerja: simpan cache, jangan putar.
    if (!isCurrent(token)) return false;
    await playWavData(b64, 1, token);
    return isCurrent(token);
  } catch (e) {
    // Abort/pembatalan bukan kegagalan Piper.
    if (!isCurrent(token)) return false;
    console.error("piper_speak:", e);
    piperFault = e instanceof Error ? e.message : String(e);
    return false;
  }
}

export type SpeechSource = "piper" | "bundle" | null;

// Membatalkan audio yang sedang berbunyi DAN pekerjaan yang masih menunggu
// (fetch/decode klip, sintesis Piper). Caller memanggil ini saat sesi ditinggal;
// hasil yang datang terlambat tidak akan diputar dan tidak memicu error audio.
export function stopSpeech(): void {
  cancelOutstanding();
}

export function speak(text: string, rate = preferredRate): Promise<SpeechSource> {
  // Unlock Web Audio synchronously while the call still has user activation.
  try {
    void getAudioContext().resume();
  } catch {
    /* playBundle/playWavData return a failure; no silent Windows fallback */
  }
  const { token, signal } = beginSpeech();
  return (async () => {
    // A transient failure must not permanently suppress future attempts.
    piperFault = null;
    if (await speakWithPiper(text, rate, token)) return "piper";
    if (!isCurrent(token)) return null;
    if (await playBundle(text, rate, token, signal)) return "bundle";
    if (!isCurrent(token)) return null;
    window.dispatchEvent(new CustomEvent("lernen-audio-error", { detail: piperFault }));
    return null;
  })();
}
