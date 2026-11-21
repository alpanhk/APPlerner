import type { Attempt, Flags, ObjectiveId, ResultLevel } from "./types";

// ===== Penilaian berbasis tindakan nyata =====
// Bukti kemampuan hanya dari jawaban pemain (tulis/susun), bukan klik "Lanjut".

export function objectiveLevel(attempts: Attempt[], id: ObjectiveId): ResultLevel {
  const rel = attempts.filter((a) => a.objective === id);
  if (rel.length === 0) return "belum";
  if (rel.some((a) => a.hintsUsed === 0)) return "mandiri";
  return "petunjuk";
}

export function demonstratedFullSentence(attempts: Attempt[], id: ObjectiveId): boolean {
  return attempts.some((a) => a.objective === id && a.full);
}

export const LEVEL_LABEL: Record<ResultLevel, string> = {
  belum: "Belum dicoba",
  petunjuk: "Berhasil dengan petunjuk",
  mandiri: "Berhasil mandiri",
};

const WHERE_LABEL: Record<string, string> = {
  tutor: "bersama tutor",
  mia: "kepada Mia",
  tetangga: "kepada tetangga",
  pos: "kepada petugas pos",
};

function howOf(a: Attempt): string {
  return a.hintsUsed === 0 ? "tanpa petunjuk" : `dengan ${a.hintsUsed} petunjuk`;
}

/** Ringkasan naratif berdasarkan tindakan pemain. */
export function buildSummary(attempts: Attempt[], flags: Flags, name: string): { lines: string[]; next: string } {
  const lines: string[] = [];
  const mia = attempts.filter((a) => a.where === "mia" && a.objective === "introduce").slice(-1)[0];
  const tutor = attempts.filter((a) => a.where === "tutor").slice(-1)[0];
  const post = attempts.filter((a) => a.where === "pos" && a.objective === "introduce").slice(-1)[0];
  const greets = attempts.filter((a) => a.objective === "greet");

  if (tutor) lines.push(`Kamu berlatih kalimat perkenalan bersama tutor ${tutor.hintsUsed === 0 ? "tanpa petunjuk" : `dengan ${tutor.hintsUsed} petunjuk`}.`);
  if (mia) {
    lines.push(
      mia.full
        ? `Kamu memperkenalkan diri kepada Mia dengan kalimat lengkap, ${howOf(mia)}.`
        : `Kamu menjawab Mia dengan menyebut nama saja, ${howOf(mia)}. Kalimat lengkapnya belum kamu pakai di sana.`,
    );
  }
  if (greets.length > 0) {
    const g = greets[0];
    lines.push(`Kamu menyapa ${WHERE_LABEL[g.where] ?? g.where} dengan sapaan Jerman („${g.text.trim()}“).`);
  }
  if (post) {
    lines.push(
      `Di jalan, kamu ${flags.saidNein ? "menolak dianggap Mia lalu " : ""}memberi tahu petugas pos siapa namamu ${
        post.hintsUsed === 0 ? "tanpa petunjuk" : `dengan ${post.hintsUsed} petunjuk`
      }${post.full ? "" : " — cukup dengan nama saja"}.`,
    );
  }
  if (flags.letterReceived) lines.push(`Petugas pos mengenali ${name} dan menyerahkan surat dari Mia.`);
  if (lines.length === 0) lines.push("Kamu membaca cerita, tetapi belum mencoba menjawab sendiri.");

  let next = "Berikutnya, coba perkenalkan dari mana asalmu: „Ich komme aus …“ (Unit 1, Pelajaran 2 „Woher kommen Sie?“).";
  const introTried = attempts.some((a) => a.objective === "introduce");
  if (!introTried) {
    next = "Mulai dengan berlatih „Ich heiße …“ bersama tutor, lalu jawab pertanyaan Mia di pintu dengan namamu sendiri.";
  } else if (!demonstratedFullSentence(attempts, "introduce")) {
    next = "Berikutnya, ulangi perkenalan dengan kalimat lengkap „Ich heiße …“ — nama saja sudah dipahami, tetapi kalimat utuh membuatmu lebih siap saat ditanya orang asing.";
  } else if (greets.length === 0) {
    next = "Berikutnya, coba sapa tetangga di jalan dengan „Guten Morgen!“ sebelum lanjut ke asal-usul (Pelajaran 2).";
  } else if (objectiveLevel(attempts, "introduce") === "petunjuk") {
    next = "Berikutnya, ulangi perkenalan dengan petugas pos tanpa membuka petunjuk, lalu lanjut ke „Ich komme aus …“.";
  }
  return { lines, next };
}
