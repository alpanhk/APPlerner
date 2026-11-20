// Urutan opsi pilihan ganda per percobaan.
//
// Masalah yang diperbaiki: bank A1 menyimpan opsi dengan kunci di posisi
// pertama (184/184 soal) sehingga posisi tombol membocorkan jawaban. Opsi
// diacak sekali saat percobaan dibuat; identitas soal (`key`), kunci
// (`answer`), dan umpan balik tidak berubah. Karena hasil acak ikut
// tersimpan bersama item (draft sesi), urutan tetap sama saat resume.

export type Rng = () => number;

// Sumber acak untuk percobaan baru. crypto dipakai bila tersedia supaya
// urutan tidak bisa ditebak dari waktu.
export function makeAttemptSeed(): number {
  const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoApi?.getRandomValues) {
    const buffer = new Uint32Array(1);
    cryptoApi.getRandomValues(buffer);
    return buffer[0] >>> 0;
  }
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

// PRNG kecil dan deterministik untuk pengujian dengan sumber acak terkontrol.
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type ChoiceLike = {
  mode: string;
  options?: string[];
};

// Acak opsi satu soal pilihan ganda. Soal non-pilihan atau opsi < 2
// dikembalikan apa adanya (tetap objek baru agar mudah dirantai).
export function shuffleChoiceOptions<T extends ChoiceLike>(item: T, rng: Rng): T {
  if (item.mode !== "choice" || !item.options || item.options.length < 2) return { ...item };
  return { ...item, options: shuffleWith(item.options, rng) };
}

// Posisi kunci pada urutan opsi; dipakai tes untuk membuktikan tidak ada
// posisi yang selalu menjadi kunci.
export function answerPosition(options: readonly string[], answer: string): number {
  return options.findIndex((option) => option === answer);
}

export type OptionEntry = { key: string; options: readonly string[] };

// Bangun urutan opsi untuk sekumpulan soal dalam satu percobaan.
export function buildOptionOrders(
  entries: readonly OptionEntry[],
  rng: Rng,
): Record<string, string[]> {
  const orders: Record<string, string[]> = {};
  for (const entry of entries) orders[entry.key] = shuffleWith(entry.options, rng);
  return orders;
}
