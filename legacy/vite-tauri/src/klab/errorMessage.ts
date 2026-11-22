// Pesan error ramah pengguna untuk KLAB (4a).
// Detail teknis tidak pernah dikembalikan ke UI; pemanggil tetap mencatatnya
// lewat console.error sesuai alur yang sudah ada.
export type ErrorContext = 'backup' | 'database' | 'audio' | 'generic';

const GENERIC: Record<ErrorContext, string> = {
  backup: 'Cadangan belum berhasil dibuat. Buka Profil → Pemulihan untuk memeriksa folder cadangan, lalu coba lagi. Data belajar Anda tetap tersimpan.',
  database: 'Data aplikasi belum dapat dibuka. Tutup aplikasi, lalu buka kembali. Jika tetap gagal, gunakan Pemulihan untuk memulihkan cadangan terakhir.',
  audio: 'Audio tidak dapat diputar perangkat ini. Teks bacaan tetap tersedia; coba lagi atau periksa Pengaturan suara.',
  generic: 'Operasi belum berhasil. Coba lagi. Jika berlanjut, periksa Pengaturan atau Pemulihan.',
};

/** Ubah pesan teknis menjadi kalimat bahasa Indonesia yang menjelaskan tindakan pengguna. */
export function friendlyErrorMessage(error: unknown, context: ErrorContext = 'generic'): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (/os error 2|cannot find the file|no such file|ENOENT/i.test(raw)) {
    return context === 'backup'
      ? 'Folder cadangan belum tersedia. Buka Profil → Pemulihan, pilih folder penyimpanan, lalu coba lagi.'
      : context === 'database'
        ? 'Berkas data tidak ditemukan di lokasi yang diharapkan. Buka Pemulihan untuk memilih cadangan, lalu muat ulang aplikasi.'
        : GENERIC[context];
  }
  if (/permission|denied|EACCES|access is denied/i.test(raw)) {
    return 'Aplikasi tidak mendapat izin menulis ke folder tersebut. Pilih folder lain di Pengaturan atau Pemulihan, lalu coba lagi.';
  }
  if (/disk|space|ENOSPC/i.test(raw)) {
    return 'Penyimpanan perangkat hampir penuh. Kosongkan ruang, lalu coba lagi.';
  }
  if (/timeout|timed out|ETIMEDOUT/i.test(raw)) {
    return 'Proses memakan waktu terlalu lama. Coba lagi; jangan menutup aplikasi saat penyimpanan berjalan.';
  }
  return GENERIC[context];
}
