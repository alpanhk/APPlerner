// P8: keputusan pemulihan checkpoint pada batas baca. Modul murni ini dipakai
// CheckpointRunner agar perilaku blokir/muat ulang dapat diuji tanpa UI.
// Aturan penting: null berarti "tidak ada payload", sedangkan string kosong
// adalah payload invalid yang tetap harus dipertahankan/dibersihkan.
export type QuarantineView = {
  recoveryKey: string | null;
  sourceRemoved: boolean;
  sourceChanged: boolean;
  error: string | null;
};

export type RecoveryDecision = {
  action: "continue" | "reload" | "block";
  notice: string;
  blockReason: string | null;
};

const BLOCK_ATTEMPT =
  "Draft jawaban checkpoint lama tidak dapat dipertahankan dengan aman. Muat ulang aplikasi atau kembali ke unit sebelum melanjutkan.";
const BLOCK_SESSION =
  "Data checkpoint lama tidak dapat dipertahankan dengan aman. Muat ulang aplikasi atau pulihkan backup sebelum melanjutkan.";
const RELOAD =
  "Sumber berubah saat pemulihan; memuat ulang agar penulisan terbaru tidak tertimpa.";

// Draft attempt: bila salin gagal atau sumber tidak berhasil dibersihkan,
// soal TIDAK boleh dibuka karena jawaban berikutnya menimpa payload lama.
export function decideAttemptRecovery(
  raw: string | null,
  outcome: QuarantineView | null,
): RecoveryDecision {
  if (raw === null) return { action: "continue", notice: "", blockReason: null };
  if (outcome?.sourceChanged) {
    return { action: "reload", notice: RELOAD, blockReason: null };
  }
  if (!outcome?.recoveryKey) {
    return {
      action: "block",
      notice: "Draft jawaban checkpoint lama tidak valid dan tidak dapat disalin; payload sumber dipertahankan.",
      blockReason: BLOCK_ATTEMPT,
    };
  }
  const notice = `Draft jawaban checkpoint lama tidak valid. Salinan pemulihan: ${outcome.recoveryKey}.`;
  if (!outcome.sourceRemoved) {
    return {
      action: "block",
      notice: `${notice} Salinan dibuat tetapi payload lama belum dapat dibersihkan.`,
      blockReason: BLOCK_ATTEMPT,
    };
  }
  return { action: "continue", notice, blockReason: null };
}

// Sesi checkpoint memakai aturan yang sama dengan pesan khusus sesi.
export function decideSessionRecovery(
  raw: string | null,
  outcome: QuarantineView | null,
  reason: string,
): RecoveryDecision {
  if (raw === null) return { action: "continue", notice: "", blockReason: null };
  if (outcome?.sourceChanged) {
    return { action: "reload", notice: `${reason} ${RELOAD}`, blockReason: null };
  }
  if (!outcome?.recoveryKey) {
    return {
      action: "block",
      notice: `${reason} Data lama tidak dapat disalin; payload sumber dipertahankan.`,
      blockReason: BLOCK_SESSION,
    };
  }
  const notice = `${reason} Salinan pemulihan: ${outcome.recoveryKey}.`;
  if (!outcome.sourceRemoved) {
    return {
      action: "block",
      notice: `${notice} Sumber tidak dapat dibersihkan; payload lama tetap dipertahankan.`,
      blockReason: BLOCK_SESSION,
    };
  }
  return { action: "continue", notice, blockReason: null };
}
