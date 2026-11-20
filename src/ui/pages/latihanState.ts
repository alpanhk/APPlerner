// State sesi Latihan/Uji A1 yang dapat diserialisasi dan diuji tanpa UI.
// Dipakai bersama sessionRepository Agent 1; tidak ada aturan grading di sini.

export type ConversationOptionLike = { text: string; next: string; feedback: string };
export type ConversationNodeLike = {
  id: string;
  speaker: string;
  de: string;
  options?: ConversationOptionLike[];
  end?: boolean;
  summary?: string;
};
export type ConversationScenarioLike = {
  start: string;
  nodes: Record<string, ConversationNodeLike>;
};
export type TalkLogEntryLike =
  | { kind: "speaker"; node: ConversationNodeLike }
  | { kind: "user"; text: string }
  | { kind: "feedback"; text: string };

export type ListeningSession = {
  version: 1;
  answers: Record<string, string>;
  orders: Record<string, string[]>;
  audioFailed: boolean;
};

export type WritingSession = {
  version: 1;
  draft: string;
  checks: Record<string, boolean>;
};

export type TalkSession = {
  version: 1;
  choices: number[];
};

export type ExamScoreBlock = {
  correct: number;
  total: number;
  answered: number;
  skipped: number;
};

export type ExamResult = {
  ts: string;
  hoeren: ExamScoreBlock & { audioFailed?: number };
  lesen: ExamScoreBlock;
  schreiben: { checked: number; total: number };
  sprechen: { checked: number; total: number };
};

export type ExamSession = {
  version: 1;
  started: boolean;
  finished: boolean;
  sectionIndex: number;
  answers: Record<string, string>;
  writingDraft: string;
  writingChecks: Record<string, boolean>;
  speakingChecks: Record<string, boolean>;
  optionOrders: Record<string, string[]>;
  audioFailed: Record<string, boolean>;
  deadlineAt: number | null;
  result?: ExamResult | null;
  // Hasil percobaan selesai terakhir; bertahan saat attempt baru dimulai.
  lastResult?: ExamResult | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Satu sumber kunci sesi; mencegah perbandingan key penuh vs id tugas.
export const sessionKeys = {
  listening: (dialogueId: string) => `latihan:listen:${dialogueId}`,
  writing: (taskId: string) => `latihan:write:${taskId}`,
  talk: (scenarioId: string) => `latihan:talk:${scenarioId}`,
  exam: "uji-a1:session:v1",
};

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");

const isBooleanRecord = (value: unknown): value is Record<string, boolean> =>
  isRecord(value) && Object.values(value).every((entry) => typeof entry === "boolean");

const isStringArrayRecord = (value: unknown): value is Record<string, string[]> =>
  isRecord(value) &&
  Object.values(value).every(
    (entry) => Array.isArray(entry) && entry.every((item) => typeof item === "string"),
  );

export function validateListening(value: unknown): value is ListeningSession {
  if (!isRecord(value) || value.version !== 1) return false;
  if (!isStringRecord(value.answers) || !isStringArrayRecord(value.orders)) return false;
  return typeof value.audioFailed === "boolean";
}

export function validateWriting(value: unknown): value is WritingSession {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.draft === "string" &&
    isBooleanRecord(value.checks)
  );
}

export function validateTalk(value: unknown): value is TalkSession {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.choices) &&
    value.choices.every((choice) => Number.isInteger(choice) && choice >= 0)
  );
}

export function validateExam(value: unknown): value is ExamSession {
  if (!isRecord(value) || value.version !== 1) return false;
  if (typeof value.started !== "boolean" || typeof value.finished !== "boolean") return false;
  if (!Number.isInteger(value.sectionIndex) || Number(value.sectionIndex) < 0) return false;
  if (!isStringRecord(value.answers) || !isStringArrayRecord(value.optionOrders)) return false;
  if (!isBooleanRecord(value.writingChecks) || !isBooleanRecord(value.speakingChecks)) return false;
  if (!isBooleanRecord(value.audioFailed)) return false;
  if (typeof value.writingDraft !== "string") return false;
  if (
    value.result !== undefined &&
    value.result !== null &&
    !validateExamResult(value.result)
  ) return false;
  if (
    value.lastResult !== undefined &&
    value.lastResult !== null &&
    !validateExamResult(value.lastResult)
  ) return false;
  return value.deadlineAt === null || (typeof value.deadlineAt === "number" && Number.isFinite(value.deadlineAt));
}

export function validateExamResult(value: unknown): value is ExamResult {
  if (!isRecord(value) || typeof value.ts !== "string") return false;
  const block = (entry: unknown): entry is ExamScoreBlock =>
    isRecord(entry) &&
    Number.isInteger(entry.correct) &&
    Number.isInteger(entry.total) &&
    Number.isInteger(entry.answered) &&
    Number.isInteger(entry.skipped);
  if (!block(value.hoeren) || !block(value.lesen)) return false;
  const audioFailed = (value.hoeren as Record<string, unknown>).audioFailed;
  if (audioFailed !== undefined && !Number.isInteger(audioFailed)) return false;
  const rubric = (entry: unknown) =>
    isRecord(entry) && Number.isInteger(entry.checked) && Number.isInteger(entry.total);
  return rubric(value.schreiben) && rubric(value.sprechen);
}

export function emptyListening(): ListeningSession {
  return { version: 1, answers: {}, orders: {}, audioFailed: false };
}

export function emptyWriting(): WritingSession {
  return { version: 1, draft: "", checks: {} };
}

// Hidrasi draft hanya bila key sesi adalah key penuh untuk tugas ini.
// Regresi asal: membandingkan "latihan:write:<id>" dengan "<id>" membuat
// editor selalu kosong walau payload berisi teks.
export function restoredWritingDraft(
  dataKey: string,
  taskId: string,
  data: WritingSession,
): string | null {
  if (dataKey !== sessionKeys.writing(taskId)) return null;
  return data.draft;
}

export function emptyTalk(): TalkSession {
  return { version: 1, choices: [] };
}

export function emptyExam(): ExamSession {
  return {
    version: 1,
    started: false,
    finished: false,
    sectionIndex: 0,
    answers: {},
    writingDraft: "",
    writingChecks: {},
    speakingChecks: {},
    optionOrders: {},
    audioFailed: {},
    deadlineAt: null,
    result: null,
    lastResult: null,
  };
}

// State awal percobaan baru tanpa menghapus hasil percobaan selesai terakhir.
// Caller menambahkan optionOrders/deadline lalu menulis lewat replace (bukan
// delete+write), sehingga hasil lama tetap committed bila penulisan gagal.
export function beginExamAttempt(previous: ExamSession | null | undefined): ExamSession {
  return {
    ...emptyExam(),
    started: true,
    lastResult: previous?.lastResult ?? previous?.result ?? null,
  };
}

// Putar ulang percakapan dari daftar indeks opsi. Pilihan tidak valid berhenti
// di node terakhir yang sah, tidak melempar dan tidak menghapus riwayat.
export function replayConversation(
  scenario: ConversationScenarioLike,
  choices: readonly number[],
): { nodeId: string; log: TalkLogEntryLike[]; valid: boolean } {
  const start = scenario.nodes[scenario.start];
  if (!start) return { nodeId: scenario.start, log: [], valid: false };
  let nodeKey = scenario.start;
  let node = start;
  const log: TalkLogEntryLike[] = [{ kind: "speaker", node }];
  let valid = true;
  for (const choice of choices) {
    if (node.end) {
      valid = false;
      break;
    }
    const options = node.options ?? [];
    const option = options[choice];
    if (!option) {
      valid = false;
      break;
    }
    log.push({ kind: "user", text: option.text });
    log.push({ kind: "feedback", text: option.feedback });
    const next = scenario.nodes[option.next];
    if (!next) {
      valid = false;
      break;
    }
    log.push({ kind: "speaker", node: next });
    node = next;
    nodeKey = option.next;
  }
  return { nodeId: nodeKey, log, valid };
}

export function nextDeadline(nowMs: number, minutes: number): number {
  return nowMs + Math.max(1, minutes) * 60_000;
}

export function remainingSeconds(deadlineAt: number | null, nowMs = Date.now()): number {
  if (deadlineAt === null) return 0;
  return Math.max(0, Math.ceil((deadlineAt - nowMs) / 1000));
}

// Statistik memakai hasil dari commit sesi Uji A1 yang sama dengan status
// finished. Config lama hanya fallback untuk hasil sebelum skema ini.
export function chooseMockResult(
  session: ExamSession | null | undefined,
  configFallback: ExamResult | null,
): ExamResult | null {
  if (session?.finished && session.result) return session.result;
  if (session?.lastResult) return session.lastResult;
  return configFallback;
}

export type SessionMeta = { key: string; sessionId: string; revision: number };
export type SessionIo = {
  write<T>(
    key: string,
    sessionId: string,
    expectedRevision: number,
    data: T,
  ): Promise<
    | { ok: true; envelope: { revision: number } }
    | { ok: false; error: { code: string; message: string } }
  >;
  load(key: string): Promise<{ sessionId: string; revision: number } | null>;
};

// Tulis sesi dengan pemulihan commit-before-response: bila commit sudah
// terjadi tetapi respons hilang (conflict revisi), muat revisi terbaru dari
// sesi yang sama lalu tulis ulang payload lengkap sekali. Data yang dikirim
// tetap payload terbaru dari UI, bukan versi lama.
export async function persistWithRecovery<T>(
  meta: SessionMeta,
  data: T,
  io: SessionIo,
): Promise<{ ok: true; revision: number } | { ok: false; message: string }> {
  let result = await io.write<T>(meta.key, meta.sessionId, meta.revision, data);
  if (!result.ok && result.error.code === "conflict") {
    const latest = await io.load(meta.key);
    if (latest && latest.sessionId === meta.sessionId) {
      result = await io.write<T>(meta.key, meta.sessionId, latest.revision, data);
    }
  }
  return result.ok
    ? { ok: true, revision: result.envelope.revision }
    : { ok: false, message: result.error.message };
}
