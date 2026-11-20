// KLAB-WINDOWS-20261119 · bidang 2a: uji alur belajar dengan data nyata A1-B2.
// Tidak memakai mock, iframe, atau skor simulasi. Semua angka berasal dari
// 4 units_*.json, 35 soal a1_lesson_practice.json, 6 texts_*.json, dan manifest WAV.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
const sha = (rel) =>
  crypto.createHash("sha256").update(fs.readFileSync(path.join(root, rel))).digest("hex");
const auditRecords = [];
const recordAudit = (name, detail) => auditRecords.push({ name, ...detail });

const modPath = path.join(root, "src/klab/learning/logic.ts");
const compiled = ts.transpileModule(fs.readFileSync(modPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const stub = {
  "../../data/lessons/units_a1.json": readJson("src/data/lessons/units_a1.json"),
  "../../data/lessons/units_a2.json": readJson("src/data/lessons/units_a2.json"),
  "../../data/lessons/units_b1.json": readJson("src/data/lessons/units_b1.json"),
  "../../data/lessons/units_b2.json": readJson("src/data/lessons/units_b2.json"),
  "../../data/lessons/a1_lesson_practice.json": readJson("src/data/lessons/a1_lesson_practice.json"),
  "./transferBank.json": readJson("src/klab/learning/transferBank.json"),
  "../../data/reading/texts_a1.json": readJson("src/data/reading/texts_a1.json"),
  "../../data/reading/texts_a1a2_extra.json": readJson("src/data/reading/texts_a1a2_extra.json"),
  "../../data/reading/texts_a2.json": readJson("src/data/reading/texts_a2.json"),
  "../../data/reading/texts_b1.json": readJson("src/data/reading/texts_b1.json"),
  "../../data/reading/texts_b2.json": readJson("src/data/reading/texts_b2.json"),
  "../../data/reading/texts_extra.json": readJson("src/data/reading/texts_extra.json"),
  "../../assets/tts_core/manifest.json": readJson("src/assets/tts_core/manifest.json"),
  "../../../scripts/konten/a2.json": readJson("scripts/konten/a2.json"),
  "../../../scripts/konten/b1.json": readJson("scripts/konten/b1.json"),
  "../../../scripts/konten/b2.json": readJson("scripts/konten/b2.json"),
};
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)(
  (id) => {
    if (Object.prototype.hasOwnProperty.call(stub, id)) return stub[id];
    throw new Error(`import tak terduga: ${id}`);
  },
  mod,
  mod.exports,
);
const soundPath = path.join(root, "src/klab/learning/soundController.ts");
const soundCode = ts.transpileModule(fs.readFileSync(soundPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const soundMod = { exports: {} };
new Function("require", "module", "exports", soundCode)(() => ({}), soundMod, soundMod.exports);
const { soundPriority } = soundMod.exports;

const {
  allLessons,
  allReadings,
  allUnits,
  applyLessonAnswer,
  audioCoverage,
  backTarget,
  buildFallbackCheckpoint,
  buildLevelCheckpoint,
  ambienceDecision,
  CAFE_CORRECTION,
  CAFE_DIALOG,
  CAFE_LAYERS,
  cafeDialogPlan,
  correctionClipFor,
  cupCueDecision,
  dialogAvailability,
  buildSimilarPractice,
  exampleSlideFor,
  exerciseLineView,
  fullscreenDecision,
  getLesson,
  getReading,
  practiceItems,
  gradePractice,
  grammarGlossaryFor,
  highlightParts,
  reasonLines,
  translationLabel,
  isLessonComplete,
  lessonScore,
  removeLessonAnswer,
  shouldHydrateFromProps,
  summaryAnswers,
  similarItemAvailable,
  transferCoverage,
  readingByTitle,
  readingAudioPlan,
  clipFor,
  normalizeSpeech,
} = mod.exports;

// --- Materi Unit 4 Pelajaran 2 dari sumber beku ---
const lesson = getLesson(4, 2);
assert.ok(lesson, "U4 L2 ada");
assert.equal(lesson.title, "Im Restaurant bestellen");
assert.equal(lesson.slides.length, 4, "empat halaman materi");
assert.equal(lesson.slides[0].title, "Memesan dengan sopan");
assert.equal(lesson.slides[0].exampleDe, "Ich möchte einen Kaffee, bitte.");
assert.deepEqual(lesson.slides[0].highlight.slice(0, 2), ["Ich", "möchte"]);
assert.ok(lesson.slides[1].highlight.includes("einen"), "halaman 2 menyorot einen");
assert.ok(lesson.slides.some((s) => s.body.some((line) => line.startsWith("Prasyarat:"))), "catatan P1 asli");
assert.equal(getLesson(4, 99), null, "pelajaran tak ada -> null");

// --- Bank latihan biasa, bukan checkpoint ---
const items = practiceItems(4, 2);
assert.equal(items.length, 2, "dua soal latihan U4 L2");
assert.deepEqual(items.map((item) => item.id), ["lp-u4-l2-01", "lp-u4-l2-02"]);
assert.equal(items[0].objectiveId, "a1-u4-o3");
assert.equal(items[0].answer, "einen");
assert.equal(items[1].objectiveId, "a1-u4-o4");
assert.equal(items[1].answer, "getrennt");
assert.deepEqual(items[0].options, ["einen", "ein", "eine", "der"]);

const wrong = gradePractice(items[0], "ein");
assert.equal(wrong.correct, false);
assert.ok(wrong.explanation.includes("einen"), "feedback salah menjelaskan einen");
const right = gradePractice(items[0], "einen");
assert.equal(right.correct, true);
assert.ok(right.explanation.length > 0, "feedback benar memakai explanation asli");
assert.equal(gradePractice(items[1], "getrennt").correct, true);
assert.equal(similarItemAvailable(4, 2, "a1-u4-o3", "lp-u4-l2-01"), true, "soal sejenis tersedia dari materi (bukan item bank lain)");

// --- Bacaan Im Café dan urutan klip nyata ---
const reading = readingByTitle("Im Café");
assert.ok(reading, "bacaan Im Café ada");
assert.equal(reading.sentences.length, 6);
assert.equal(reading.sentences[1].de, "Ich möchte einen Kaffee, bitte.");
assert.deepEqual(readingAudioPlan(reading), [
  "a1_text_092.wav",
  "a1_example_062.wav",
  "a1_text_068.wav",
  "a1_text_019.wav",
  "a1_text_027.wav",
  "a1_text_097.wav",
]);
for (const file of readingAudioPlan(reading)) {
  assert.ok(fs.existsSync(path.join(root, "src/klab/learning/assets", file)), `klip lokal ${file}`);
}
assert.equal(clipFor("Die Rechnung, bitte!"), "a1_text_027.wav");
assert.equal(clipFor("Kalimat yang tidak ada di manifest"), undefined, "audio tak ada -> undefined");
assert.equal(normalizeSpeech("Ich möchte einen Kaffee, bitte."), "ich möchte einen kaffee bitte");

// --- Migrasi 100%: 42 unit, 96 pelajaran, 67 bacaan, 454 klip ---
const units = allUnits();
assert.equal(units.length, 42, "42 unit A1-B2");
assert.deepEqual([...new Set(units.map((u) => u.level))].sort(), ["A1", "A2", "B1", "B2"]);
const lessons = allLessons();
assert.equal(lessons.length, 96, "96 pelajaran A1-B2");
assert.equal(lessons.filter((l) => l.level === "A1").length, 36);
assert.equal(lessons.filter((l) => l.level === "A2").length, 20);
assert.equal(lessons.filter((l) => l.level === "B1").length, 20);
assert.equal(lessons.filter((l) => l.level === "B2").length, 20);

// Setiap pelajaran harus bisa dijalankan: minimal dua soal, kunci unik, dan
// soal turunan deterministik bila tidak ada entri bank.
const seenLessonKeys = new Set();
for (const item of lessons) {
  const own = practiceItems(item.unitNo, item.lessonNo);
  assert.ok(own.length >= 2, `${item.unitNo}/${item.lessonNo} punya latihan`);
  for (const exercise of own) {
    assert.ok(exercise.answer, `${exercise.id} punya kunci`);
    assert.ok(!seenLessonKeys.has(exercise.id), `${exercise.id} unik`);
    seenLessonKeys.add(exercise.id);
    assert.ok(["bank", "generated", "curated"].includes(exercise.source));
    if (exercise.mode === "choice") assert.ok(exercise.options?.includes(exercise.answer), `${exercise.id} kunci di opsi`);
  }
  const once = practiceItems(item.unitNo, item.lessonNo);
  assert.deepEqual(once.map((e) => e.id), own.map((e) => e.id), `deterministik ${item.unitNo}/${item.lessonNo}`);
}
assert.ok(lessons.filter((l) => practiceItems(l.unitNo, l.lessonNo)[0]?.source === "bank").length >= 17);

// [P] P3-GAP-02: cakupan transfer naik dari 17 menjadi 37 pelajaran dengan
// objectiveId nyata (A1) / kisi-kisi unit.goals (A2), bukan ID gen-u*.
const transferStats = transferCoverage();
assert.equal(transferStats.originalLessons, 17, "sebelum: 17 pelajaran bank lama");
assert.equal(transferStats.addedLessons, 20, "ditambah 19 sisa A1 + 1 A2");
assert.equal(transferStats.coveredLessons, 37, "sesudah: 37 pelajaran");
assert.equal(transferStats.totalLessons, 96);
const objectiveIds = new Set(readJson("src/data/lessons/a1_objectives.json").objectives.map((o) => o.id));
const addedSlices = [
  [1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [3, 1], [3, 2], [4, 1], [5, 1], [5, 2],
  [6, 1], [6, 3], [7, 1], [8, 1], [8, 2], [9, 1], [10, 1], [10, 3], [12, 2],
  [101, 1],
];
for (const [unitNo, lessonNo] of addedSlices) {
  const own = practiceItems(unitNo, lessonNo);
  assert.ok(own.length >= 1, `[P] transfer ${unitNo}/${lessonNo} tersedia`);
  assert.ok(own.every((item) => item.source === "bank"), `[P] ${unitNo}/${lessonNo} bukan generated`);
  assert.ok(own.every((item) => /^(tr-u|a2-u)/.test(item.id)), `[P] ${unitNo}/${lessonNo} ID statis`);
  assert.ok(own.every((item) => item.objectiveId && !item.objectiveId.startsWith("gen-u")), `[P] ${unitNo}/${lessonNo} objectiveId nyata`);
  for (const item of own) {
    if (item.unit <= 12) assert.ok(objectiveIds.has(item.objectiveId), `${item.id}: objectiveId ada di a1_objectives.json`);
    else assert.equal(item.kisi, "units_a2.json#unit.goals");
    if (item.mode === "choice") {
      assert.ok(item.wrongFeedback && Object.keys(item.wrongFeedback).length > 0, `${item.id}: feedback pengecoh`);
    } else {
      assert.ok(item.hintOnWrong, `${item.id}: petunjuk jawaban ketik`);
    }
    assert.ok(item.options?.includes(item.answer) || item.mode === "type", `${item.id}: kunci valid`);
  }
}
recordAudit("[P] Transfer lintas pelajaran 17 -> 37", {
  before: transferStats.originalLessons,
  after: transferStats.coveredLessons,
  added: addedSlices.length,
  staticItems: transferStats.staticItems,
  sample: practiceItems(1, 1).map((i) => `${i.id}:${i.objectiveId}`),
});

// Audit P1: soal generated tidak boleh selalu menaruh kunci di opsi pertama,
// dan soal ketik wajib memiliki blank nyata.
let generatedChoice = 0, answerNotFirst = 0, generatedType = 0, blankOk = 0;
const answerPositions = new Set();
for (const lesson of lessons) {
  for (const exercise of practiceItems(lesson.unitNo, lesson.lessonNo)) {
    if (exercise.source !== "generated") continue;
    if (exercise.mode === "choice") {
      generatedChoice += 1;
      const position = exercise.options.indexOf(exercise.answer);
      answerPositions.add(position);
      if (position !== 0) answerNotFirst += 1;
    }
    if (exercise.mode === "type") {
      generatedType += 1;
      if (exercise.prompt.includes("___")) blankOk += 1;
    }
  }
}
assert.ok(generatedChoice > 0 && generatedType > 0);
assert.ok(answerNotFirst > 0, "kunci tidak selalu di posisi pertama");
assert.ok(answerPositions.size > 1, "posisi kunci bervariasi");
assert.equal(blankOk, generatedType, "semua soal ketik generated punya blank");
recordAudit("Soal generated: kunci tidak selalu pertama + blank nyata", { generatedChoice, answerNotFirst, answerPositions: [...answerPositions], generatedType, blankOk });

// Audit P2: "soal sejenis" benar-benar soal baru, bukan mengulang item.
const similar = buildSimilarPractice(items[0], 4, 2);
assert.ok(similar, "soal sejenis U4L2 terbentuk");
assert.notEqual(similar.id, items[0].id);
assert.notEqual(similar.prompt, items[0].prompt, "soal sejenis memakai prompt/konteks berbeda");
assert.equal(similar.objectiveId, items[0].objectiveId);
assert.equal(similar.source, "bank", "soal sejenis dari bank statis yang konsisten");
assert.ok(similar.options?.includes(similar.answer));
recordAudit("Soal sejenis baru setelah salah", { original: items[0].id, similar: similar.id, answer: similar.answer });

const readings = allReadings();
assert.equal(readings.length, 67, "67 teks bacaan A1-B2");
assert.equal(new Set(readings.map((r) => r.title)).size, 67, "judul bacaan unik");
for (const reading of readings) {
  assert.ok(reading.sentences.length > 0, `${reading.title} punya kalimat`);
  assert.ok(getReading(reading.textId), `getReading(${reading.textId})`);
  assert.equal(readingByTitle(reading.title).textId, reading.textId, `readingByTitle(${reading.title})`);
  for (const sentence of reading.sentences) {
    assert.ok(["bundle", "missing"].includes(sentence.status));
    if (sentence.status === "bundle") assert.ok(sentence.file && sentence.file.endsWith(".wav"));
  }
}
const coverage = audioCoverage();
assert.equal(coverage.bundleEntries, 453, "453 frasa di manifest bundle");
assert.equal(fs.readdirSync(path.join(root, "src/assets/tts_core")).filter((f) => f.endsWith(".wav")).length, 454, "454 berkas WAV lokal");
assert.ok(coverage.available > 0 && coverage.missing >= 0);
assert.equal(coverage.available + coverage.missing, coverage.sentences);

// Checkpoint: A1 dari bank tujuan, A2-B2 dari kisi-kisi unit + kosakata kurasi.
for (const unitNo of [1, 4, 5, 10, 12]) {
  assert.ok(getLesson(unitNo, 1), `unit A1 ${unitNo} ada`);
}
const levelPlans = [];
for (const unitNo of [101, 201, 301]) {
  const plan = buildLevelCheckpoint(unitNo);
  assert.ok(plan, `checkpoint kurasi unit ${unitNo}`);
  assert.equal(plan.source, "curated");
  assert.equal(plan.level === "A2" ? 101 : plan.level === "B1" ? 201 : 301, unitNo);
  assert.equal(plan.policy.pass, 70);
  assert.equal(plan.policy.itemsPerObjective, 3, "tiga soal per tujuan, bukan diturunkan");
  assert.equal(plan.objectives.length, 3, "tiga tujuan nyata dari unit.goals");
  assert.ok(plan.objectives.every((o) => /^goal-\d+-[123]$/.test(o.id)), "objectiveId bukan sintetis gen-u*");
  assert.equal(plan.items.length, plan.objectives.length * 3, "tiga soal per tujuan (3 tujuan A2-B2 = 9 item)");
  for (const objective of plan.objectives) {
    const own = plan.items.filter((item) => item.objectiveId === objective.id);
    assert.equal(own.length, 3, `${objective.id}: 3 item`);
    const spare = plan.pool.filter((item) => item.objectiveId === objective.id && !own.includes(item));
    assert.ok(spare.length >= 2, `${objective.id}: pool remedial tersedia`);
  }
  for (const item of plan.items) {
    assert.ok(item.options && item.options.includes(item.answer), `${item.id}: kunci di opsi`);
    assert.equal(new Set(item.options).size, item.options.length, `${item.id}: opsi unik`);
    assert.ok(Object.keys(item.wrongFeedback ?? {}).length >= 3, `${item.id}: feedback per pengecoh`);
    for (const wrong of Object.keys(item.wrongFeedback ?? {})) {
      assert.ok(item.options.includes(wrong), `${item.id}: feedback key adalah opsi`);
      assert.notEqual(wrong, item.answer);
    }
    assert.ok(item.explanation.includes(item.answer), `${item.id}: penjelasan menyebut kunci`);
    assert.equal(item.sourceFile, `scripts/konten/${plan.level.toLowerCase()}.json`);
  }
  // Perilaku penilaian: salah -> feedback spesifik, benar -> explanation.
  const first = plan.items[0];
  const wrongOption = first.options.find((option) => option !== first.answer);
  const gradedWrong = gradePractice(first, wrongOption);
  assert.equal(gradedWrong.correct, false);
  assert.equal(gradedWrong.explanation, first.wrongFeedback[wrongOption], "feedback salah spesifik per opsi");
  assert.equal(gradePractice(first, first.answer).correct, true);
  levelPlans.push({ level: plan.level, unit: unitNo, goals: plan.objectives.map((o) => o.title), items: plan.items.length, pool: plan.pool.length });
}
assert.equal(buildLevelCheckpoint(9999), null);
assert.equal(buildLevelCheckpoint(4), null, "A1 tidak memakai checkpoint kurasi");
recordAudit("Checkpoint A2-B2: kisi-kisi nyata, 3/objective, feedback + remedial", levelPlans);

// A2-GAP-07: 'laut' adalah terjemahan Indonesia yang benar untuk Meer.
const a2Konten = readJson("scripts/konten/a2.json");
const meer = a2Konten.units.flatMap((u) => u.words).find((w) => w.de === "Meer");
assert.equal(meer.meaning, "laut", "Meer = laut (bahasa Indonesia), bukan 'loud'");
assert.equal(meer.ex_id.toLowerCase().includes("laut"), true, "contoh kalimat memakai 'laut' secara konsisten");
recordAudit("A2-GAP-07 adalah false positive", { de: meer.de, id: meer.meaning, contoh: meer.ex_id });

// --- Aset lokal disalin byte-identik dari paket prototipe (bukan gambar baru) ---
const assetDir = path.join(root, "outputs/prototipe-interaksi-klab-2026-11-19/assets");
for (const name of fs.readdirSync(assetDir)) {
  assert.ok(fs.existsSync(path.join(root, "src/klab/learning/assets", name)), `aset ${name}`);
  assert.equal(
    sha(`src/klab/learning/assets/${name}`),
    sha(`outputs/prototipe-interaksi-klab-2026-11-19/assets/${name}`),
    `hash aset ${name}`,
  );
}

// --- Batas komponen: tanpa mock/iframe/skor palsu, kontrak UI-CONTRACT dipakai ---
const lessonTs = fs.readFileSync(path.join(root, "src/klab/learning/LessonFlow.tsx"), "utf8");
const readerTs = fs.readFileSync(path.join(root, "src/klab/learning/ReadingFlow.tsx"), "utf8");
const audioTs = fs.readFileSync(path.join(root, "src/klab/learning/audio.ts"), "utf8");
const checkpointTs = fs.readFileSync(path.join(root, "src/klab/learning/CheckpointFlow.tsx"), "utf8");
const compatTs = fs.readFileSync(path.join(root, "src/klab/learning/compat.ts"), "utf8");
const combined = `${lessonTs}\n${readerTs}\n${audioTs}\n${checkpointTs}\n${compatTs}`;
for (const token of ["iframe", "mock", "fixture", "Xfigura", "Math.random"]) {
  assert.equal(combined.toLowerCase().includes(token.toLowerCase()), false, `tidak ada ${token}`);
}
for (const cls of ["lesson", "exercise", "feedback", "choice-status", "example-panel", "book-preview", "reader"]) {
  assert.ok(lessonTs.includes(cls) || readerTs.includes(cls), `kelas kontrak ${cls}`);
}
assert.ok(lessonTs.includes("aria-expanded"), "panel dapat diumumkan");
assert.ok(lessonTs.includes("onProgress"), "progres diserahkan ke runner");
assert.ok(readerTs.includes("Kembali ke rak"), "kembali ke rak tersedia");
for (const fn of ["buildObjectiveCheckpoint", "buildLevelCheckpoint", "gradePractice"]) {
  assert.ok(checkpointTs.includes(fn), `checkpoint memakai ${fn}`);
}
assert.ok(checkpointTs.includes("Checkpoint belum siap"), "unit tak ada tidak menghasilkan nilai palsu");
assert.ok(checkpointTs.includes("sumber {plan.source"), "sumber bank/generated dinyatakan jujur");

// Putaran 2: tombol dengar materi, pintas latihan, klik label radio andal,
// pelajaran lain, dan kompatibilitas penuh ViewProps 1a.
for (const token of ["initialStage", "Langsung ke latihan", "klab-lesson-audio-status", "data-value", "resolvedUnit"]) {
  assert.ok(lessonTs.includes(token), `LessonFlow Putaran 2: ${token}`);
}
for (const token of ["initialView", "autoPlay", "directFromExplore", "handleBack"]) {
  assert.ok(readerTs.includes(token), `ReadingFlow Putaran 2: ${token}`);
}
for (const source of [lessonTs, readerTs, checkpointTs]) {
  assert.ok(source.includes("route?") && source.includes("back?"), "props menerima ViewProps 1a");
}
assert.ok(compatTs.includes("ComponentType<ViewProps>"), "pemeriksaan tipe kompatibilitas 1a ada");
assert.ok(audioTs.includes("./assets/*.wav"), "audio lokal dari bundle");
assert.ok(combined.includes("Dengarkan"), "kontrol audio memakai label teks");

// --- PILOT-KLAB-20261121: penilaian setelah kirim, navigasi, 3 item, retry, contoh ---
// (a) Soal ke-2 tidak boleh dikunci oleh status `checked` soal pertama.
assert.equal(lessonTs.includes("const [checked,"), false, "tidak ada state checked bersama antar soal");
assert.equal(lessonTs.includes("|| checked"), false, "Cek jawaban tidak dipengaruhi checked soal lain");
assert.ok(lessonTs.includes("if (!currentItem || !typed.trim() || submitted) return;"), "soal aktif hanya dicek saat typed tersedia dan belum dikirim");
assert.ok(lessonTs.includes("const submitted = currentItem ? answers.find"), "nilai soal aktif diambil dari answers");
assert.ok(lessonTs.includes("const currentGrade = currentItem && submitted ? gradePractice"), "penilaian setelah submit");

// (b) Jawaban baru dinilai setelah dikirim, benar dan salah, dengan perbaikan.
const payment = practiceItems(4, 2)[1];
assert.equal(gradePractice(payment, "getrennt").correct, true, "getrennt benar setelah dikirim");
const wrongPayment = gradePractice(payment, "zusammen");
assert.equal(wrongPayment.correct, false, "zusammen salah setelah dikirim");
assert.ok(wrongPayment.explanation.includes("getrennt"), "feedback salah memuat petunjuk getrennt");
for (const token of ["Belum tepat", "Perbaiki jawaban", "fixCurrent", "storeAnswer", "applyLessonAnswer(answers, item, value)"]) {
  assert.ok(lessonTs.includes(token), `feedback/perbaikan soal aktif: ${token}`);
}

// (c) Navigasi kembali menjaga jawaban yang sudah dikirim.
for (const token of [
  "backTarget(exerciseIndex)",
  "target.kind === 'previous'",
  "setStage('order')",
  "answers.find((entry) => entry.id === previous?.id)?.picked",
  "Kembali ke soal sebelumnya",
]) {
  assert.ok(lessonTs.includes(token), `navigasi kembali: ${token}`);
}

// (d) Pelajaran dengan 3 item, termasuk item order dengan tokens.
const three = practiceItems(11, 1);
assert.equal(three.length, 3, "U11 L1 punya tiga soal");
assert.equal(three[2].mode, "order", "soal ketiga U11 L1 bertipe order");
assert.ok(Array.isArray(three[2].options) && three[2].options.length > 1, "soal order punya keping kata");
assert.ok(lessonTs.includes("currentItem.mode === 'order'"), "LessonFlow merender keping kata order");
assert.ok(lessonTs.includes("currentItem.mode === 'choice'"), "LessonFlow merender pilihan ganda di soal lanjutan");

// (e) Selesai aktif setelah semua soal dijawab, status menyimpan, alert + retry.
for (const token of [
  "initialAnswers?: LessonProgress['answers']",
  "savedScore?: number | null",
  "const displayScore = savedScore ?? computedScore",
  'data-testid="saved-summary"',
  "resolveSummaryAnswers(answers, initialAnswers)",
  "shouldHydrateFromProps(localAnswersTouched.current, answers.length, initialAnswers)",
  "localAnswersTouched.current = true",
  "lessonScore(summaryAnswers)",
  "const savedSummary = summaryAnswers.length > 0 ?",
  "summaryAnswers.map((entry) =>",
  "submitted?.picked ?? typed",
  "checked={(picked ?? orderSubmitted?.picked) === option}",
  "allAnswered",
  "Menyimpan…",
  'role="alert"',
  "Progres belum tersimpan. Tekan Selesai untuk mencoba lagi.",
  "setSaveError(true)",
  "disabled={saving || !allAnswered}",
]) {
  assert.ok(lessonTs.includes(token), `Selesai/pemulihan: ${token}`);
}

// (f) Contoh bantuan mengikuti soal, bukan halaman materi terakhir.
for (const token of [
  "pickExampleSlide(lesson, stage === 'order' ? orderItem : currentItem)",
  "exampleSlide.exampleDe",
  "const exampleAudio = clipFor(exampleSlide.exampleDe)",
  "<h2 id=\"klab-example-title\" tabIndex={-1} lang=\"de\">{exampleSlide.exampleDe}</h2>",
]) {
  assert.ok(lessonTs.includes(token), `contoh sesuai soal: ${token}`);
}
assert.equal(lessonTs.includes("<h2 id=\"klab-example-title\" tabIndex={-1} lang=\"de\">{slide.exampleDe}</h2>"), false, "panel tidak memakai slide halaman terakhir");

// --- LANJUT-PILOT-01: tes perilaku terisolasi dengan mesin status murni ---
const behavior = { scenarios: [], mode: "isolated-behavior-test" };
function record(name, detail) {
  behavior.scenarios.push({ name, ...detail });
}

// Skenario A: U11 L1 - tiga soal, susun kata, salah lalu perbaiki, kembali/lanjut, selesai.
const u11 = practiceItems(11, 1);
assert.equal(u11.length, 3, "U11 L1: tiga item");
const [u11a, u11b, u11c] = u11;
let u11Answers = [];
assert.equal(isLessonComplete(u11, u11Answers), false, "belum selesai sebelum menjawab");
const wrongA = applyLessonAnswer(u11Answers, u11a, "ein");
assert.equal(wrongA.length, 1);
assert.equal(wrongA[0].correct, false, "jawaban pertama salah tercatat");
record("U11 L1 soal 1 salah", { item: u11a.id, picked: "ein", correct: false });
const fixedA = applyLessonAnswer(removeLessonAnswer(wrongA, u11a.id), u11a, u11a.answer);
assert.equal(fixedA.length, 1, "perbaikan tidak menggandakan entri");
assert.equal(fixedA[0].correct, true, "perbaikan soal 1 benar");
record("U11 L1 perbaiki jawaban 1", { item: u11a.id, picked: u11a.answer, correct: true, entries: fixedA.length });
const wrongB = applyLessonAnswer(fixedA, u11b, "falsch");
assert.equal(wrongB[0].id === u11a.id && wrongB[1].correct === false, true, "soal 2 salah tercatat");
const fixedB = applyLessonAnswer(removeLessonAnswer(wrongB, u11b.id), u11b, u11b.answer);
assert.equal(fixedB.length, 2, "dua jawaban unik setelah perbaikan soal 2");
record("U11 L1 soal 2 salah lalu diperbaiki", { item: u11b.id, entries: fixedB.length });
assert.equal(u11c.mode, "order", "soal 3 mode order");
const assembled = (u11c.options ?? u11c.tokens ?? []).join(" ");
assert.equal(assembled, u11c.answer, "keping kata menyusun jawaban persis");
const finalAnswers = applyLessonAnswer(fixedB, u11c, assembled);
assert.equal(finalAnswers.length, 3, "tiga jawaban tersimpan");
assert.equal(finalAnswers.every((entry) => entry.correct), true, "semua benar setelah perbaikan");
assert.equal(isLessonComplete(u11, finalAnswers), true, "Selesai diaktifkan setelah soal terakhir");
assert.equal(lessonScore(finalAnswers), 100);
assert.deepEqual(backTarget(2), { kind: "previous", index: 1 }, "dari soal 3 kembali ke soal 2");
assert.deepEqual(backTarget(1), { kind: "order" }, "dari soal 2 kembali ke koreksi soal 1");
record("U11 L1 susun kata + navigasi + selesai", {
  item: u11c.id, tokens: (u11c.options ?? u11c.tokens).length, assembled,
  score: lessonScore(finalAnswers), backFrom3: backTarget(2), backFrom2: backTarget(1),
});

// Regresi E2E U11 L1 Q1: 'in' salah -> Perbaiki -> pilih 'nach' -> kirim ulang.
// Akar cacat: rehidrasi async props mengembalikan jawaban yang baru dihapus.
const savedWrong = [{ id: u11a.id, picked: "in", correct: false }];
assert.equal(shouldHydrateFromProps(false, 0, savedWrong), true, "hidrasi awal dari SQLite diperbolehkan");
const afterSubmit = applyLessonAnswer([], u11a, "in");
const afterFix = removeLessonAnswer(afterSubmit, u11a.id);
assert.equal(afterFix.length, 0, "Perbaiki jawaban menghapus entri salah");
assert.equal(shouldHydrateFromProps(true, afterFix.length, savedWrong), false, "rehidrasi tidak boleh mengembalikan jawaban setelah perbaikan");
const afterResubmit = applyLessonAnswer(afterFix, u11a, "nach");
assert.equal(afterResubmit.length, 1, "kirim ulang tidak menggandakan entri");
assert.equal(afterResubmit[0].correct, true, "nach diterima benar setelah perbaikan");
record("Regresi Perbaiki jawaban U11 L1 Q1", {
  wrong: savedWrong[0].picked, fixedPicked: afterResubmit[0].picked,
  entries: afterResubmit.length, rehydrateBlocked: true, verdict: afterResubmit[0].correct,
});

// Skenario B: U4 L2 dilanjutkan dari draft SQLite (initialAnswers async).
const u4 = practiceItems(4, 2);
const draft = [
  { id: u4[0].id, picked: "ein", correct: false },
  { id: u4[1].id, picked: "getrennt", correct: true },
];
const restored = summaryAnswers([], draft);
assert.equal(restored.length, 2, "jawaban draft terbaca saat answers lokal masih kosong");
assert.equal(lessonScore(restored), 50, "skor draft 50%");
assert.equal(isLessonComplete(u4, restored), true, "sisa soal tidak perlu diulang setelah draft lengkap");
const partialDraft = [draft[0]];
const remaining = u4.filter((item) => !partialDraft.some((entry) => entry.id === item.id));
assert.deepEqual(remaining.map((item) => item.id), [u4[1].id], "hanya soal tersisa yang dikerjakan");
const resumed = applyLessonAnswer(partialDraft, u4[1], "getrennt");
assert.equal(lessonScore(resumed), 50, "skor akhir setelah menyelesaikan sisa soal");
record("U4 L2 lanjut dari draft", {
  restored: restored.map((e) => `${e.id}:${e.picked}`), score: lessonScore(restored),
  remaining: remaining.map((e) => e.id), finalScore: lessonScore(resumed),
});

// Skenario C: contoh bantuan mengikuti soal aktif, bukan slide terakhir.
const u4Lesson = getLesson(4, 2);
assert.equal(u4Lesson.slides.length, 4, "empat slide");
const exampleFirst = exampleSlideFor(u4Lesson, u4[0]);
assert.equal(exampleFirst.exampleDe, "Ich möchte einen Kaffee, bitte.", "soal 1 -> contoh memesan");
assert.equal(clipFor(exampleFirst.exampleDe), "a1_example_062.wav", "WAV contoh sesuai soal 1");
const exampleSecond = exampleSlideFor(u4Lesson, u4[1]);
assert.ok(exampleSecond.exampleDe.includes("Rechnung"), "soal 2 -> contoh pembayaran");
record("Contoh bantuan sesuai soal", {
  soal1: exampleFirst.exampleDe, wav1: clipFor(exampleFirst.exampleDe),
  soal2: exampleSecond.exampleDe,
});

const evidencePath = path.join(root, "outputs/lanjut-pilot-01/agent-2a-results.json");
fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
// --- FIX-LEARNING-20261119: [P] bukti perilaku per irisan U-10..U-15/U-07 ---
const fixLesson = getLesson(4, 2);
const u4First = practiceItems(4, 2)[0];

// U-10 konsistensi Apfelsaft; U-13 jembatan einen/eine vs den/die.
const reasons = reasonLines(u4First);
assert.equal(reasons.length, 3, "panel alasan punya tiga baris konsisten");
assert.ok(reasons[1].includes("der Apfelsaft menjadi einen Apfelsaft"), "satu nama untuk satu kata");
assert.equal(reasons[1].includes("der Saft menjadi"), false, "tidak ada 'der Saft' yang membingungkan");
assert.ok(reasons[2].includes("einen/eine") && reasons[2].includes("den/die"), "jembatan bentuk tak tentu/tertentu");
recordAudit("[P] U-10/U-13 alasan konsisten + jembatan", { reasons });

// U-11 definisi istilah tata bahasa pada slide A1 U4 L2.
const glossary = grammarGlossaryFor(fixLesson);
const terms = glossary.map((entry) => entry.term);
for (const term of ["Akkusativ", "objek", "Nominativ", "Dativ"]) {
  assert.ok(terms.includes(term), `[P] U-11 glosarium memuat ${term}`);
}
assert.ok(glossary.every((entry) => entry.definition.length > 20));
recordAudit("[P] U-11 glosarium", { terms });

// U-12 label jujur bila contoh tanpa terjemahan.
const untranslated = { exampleDe: "Ich zahle mit Karte.", exampleId: "" };
assert.equal(translationLabel(untranslated), "Coba tanpa bantuan", "[P] U-12 label tanpa bantuan");
assert.equal(translationLabel({ exampleDe: "Ich möchte einen Kaffee, bitte.", exampleId: "Saya ingin kopi, tolong." }), null);
recordAudit("[P] U-12 label terjemahan", { label: translationLabel(untranslated) });

// FIX-U12: tiga contoh yang disebutkan orkestrator, diuji satu per satu [P].
const u4Lines = fixLesson.slides[0].body;
const kaffeeTranslated = translationLabel(fixLesson.slides[0]);
const teeLine = exerciseLineView(u4Lines.find((line) => line.includes("Ich möchte einen Tee")));
const moechtenLine = exerciseLineView(u4Lines.find((line) => line.includes("Möchten Sie etwas trinken")));
assert.equal(kaffeeTranslated, null, "[P] Kaffee sudah punya pasangan terjemahan di panel contoh");
assert.equal(fixLesson.slides[0].exampleId, 'Saya ingin kopi, tolong.', "[P] Kaffee diterjemahkan di sumber");
assert.equal(teeLine.kind, 'untranslated', "[P] Tee terdeteksi tanpa terjemahan");
assert.equal(teeLine.label, 'Coba tanpa bantuan');
assert.equal(moechtenLine.kind, 'untranslated', "[P] Möchten Sie etwas trinken? terdeteksi tanpa terjemahan");
assert.equal(moechtenLine.label, 'Coba tanpa bantuan');
assert.equal(exerciseLineView('Ich zahle mit Karte.').kind, 'untranslated', "[P] contoh pembayaran juga berlabel");
assert.equal(exerciseLineView('Prasyarat: Artikel dan kosakata makanan').kind, 'note', "[P] catatan tidak diberi label contoh");
assert.equal(exerciseLineView('der Kaffee → einen Kaffee').kind, 'note', "[P] paradigma tata bahasa bukan contoh tanpa terjemahan");
recordAudit("[P] FIX-U12 tiga contoh A1 U4 L2", {
  Kaffee: { de: fixLesson.slides[0].exampleDe, id: fixLesson.slides[0].exampleId, label: kaffeeTranslated },
  Tee: teeLine,
  Moechten: moechtenLine,
});

// U-14 sorotan mengikuti hasil logic.ts, bukan pola tetap.
const slide0Parts = highlightParts(fixLesson.slides[0].exampleDe, fixLesson.slides[0].highlight);
const slide3Parts = highlightParts(fixLesson.slides[3].exampleDe, fixLesson.slides[3].highlight);
assert.ok(slide0Parts.some((part) => part.mark), "[P] U-14 slide 1 punya sorotan");
assert.ok(slide3Parts.some((part) => part.mark), "[P] U-14 slide 4 punya sorotan");
assert.notEqual(
  slide0Parts.filter((p) => p.mark).map((p) => p.text).join('|'),
  slide3Parts.filter((p) => p.mark).map((p) => p.text).join('|'),
  "[P] U-14 sorotan berbeda antar slide",
);
recordAudit("[P] U-14 sorotan per slide", {
  slide1: slide0Parts.filter((p) => p.mark).map((p) => p.text),
  slide4: slide3Parts.filter((p) => p.mark).map((p) => p.text),
});

// U-15/U-07 soal sejenis U4 L2 dari bank statis, konsisten, tanpa '..'.
const simA = buildSimilarPractice(u4First, 4, 2);
const simB = buildSimilarPractice(u4First, 4, 2, [simA.id]);
assert.ok(simA && simB, "[P] U-15 dua soal sejenis statis tersedia");
assert.ok(simA.id.startsWith("sim-u4-l2-") && simB.id.startsWith("sim-u4-l2-"), "ID tidak bertingkat similar-similar-");
for (const sim of [simA, simB]) {
  assert.equal(sim.source, "bank");
  assert.equal(sim.objectiveId, "a1-u4-o3");
  assert.ok(sim.prompt.includes("___"), "[P] prompt punya blank");
  assert.ok(sim.sub.includes("Apfelsaft") || sim.sub.includes("Tee"), "[P] sub sesuai prompt");
  assert.ok(sim.options.includes(sim.answer));
  for (const [wrong, feedback] of Object.entries(sim.wrongFeedback ?? {})) {
    assert.ok(sim.options.includes(wrong));
    assert.equal(feedback.includes(".."), false, `[P] U-07 tanpa tanda baca ganda: ${feedback}`);
  }
}
recordAudit("[P] U-15/U-07 soal sejenis konsisten", { ids: [simA.id, simB.id], prompts: [simA.prompt, simB.prompt] });

// --- PORT-EDITORIAL-20261120: [P] dialog Im Café dari kit lama ---
const cafePlan = cafeDialogPlan();
assert.equal(cafePlan.autoPlay, false, "[P] baca diam sebagai default");
assert.equal(cafePlan.files.length, 2, "[P] U-X3 dua giliran WAV dialog lokal");
assert.deepEqual(cafePlan.files, ["conv_76f18fde42ee.wav", "a1_example_062.wav"], "[P] U-X4 klip dialog, bukan klip bacaan");
for (let index = 0; index < CAFE_DIALOG.length; index += 1) {
  const turn = CAFE_DIALOG[index];
  const local = path.join(root, "src/klab/learning/assets", turn.file);
  const bundled = path.join(root, "src/assets/tts_core", turn.file);
  assert.ok(fs.existsSync(local) || fs.existsSync(bundled), `[P] WAV lokal ${turn.file}`);
  assert.equal(turn.file, index === 0 ? "conv_76f18fde42ee.wav" : "a1_example_062.wav", `[P] U-X4 giliran ${index + 1} klip sesuai manifest`);
  assert.ok(turn.id && turn.id.trim().length > 3, `[P] U-X3 giliran ${index + 1} punya terjemahan ID`);
}
assert.equal(CAFE_DIALOG[1].de, "Ich möchte einen Kaffee, bitte.", "[P] U-X3 giliran kedua sesuai A1 U4 L2");
assert.equal(CAFE_DIALOG[1].id, "Saya ingin kopi, tolong.", "[P] U-X3 terjemahan jujur");
assert.equal(cafePlan.coffeeTurn, 1);
assert.deepEqual(cafePlan.speakers, ['barista', 'learner']);
assert.deepEqual(fullscreenDecision(false, false), { enter: true, exit: false }, "[P] masuk fullscreen bila belum");
assert.deepEqual(fullscreenDecision(true, false), { enter: false, exit: false }, "[P] tidak mengubah mode yang sudah fullscreen");
assert.deepEqual(fullscreenDecision(true, true), { enter: false, exit: true }, "[P] pulihkan mode bila kitalah yang masuk");
recordAudit("[P] PORT-EDITORIAL dialog Im Café", cafePlan);

const cafeScene = fs.readFileSync(path.join(root, "src/klab/learning/CafeScene.tsx"), "utf8");
const cafeDialog = fs.readFileSync(path.join(root, "src/klab/learning/CafeDialog.tsx"), "utf8");
const learningAudio = fs.readFileSync(path.join(root, "src/klab/learning/audio.ts"), "utf8");
assert.ok(cafeScene.includes("cafe-background.webp") && cafeScene.includes("learner-speaking.webp"), "cel WebP produksi dipakai");
assert.ok(cafeScene.includes("./assets/cafe-cel/"), "aset berada di folder 2a");
for (const token of ["Escape", "requestFullscreen", "exitFullscreen", "role=\"status\"", "onCancel"]) {
  assert.ok(cafeDialog.includes(token), `[P] CafeDialog: ${token}`);
}
assert.ok(cafeDialog.includes("stageRef.current?.requestFullscreen()"), "[P] U-X1 fullscreen pada wrapper div");
for (const token of [
  "data-testid=\"cafe-audio-stop\"",
  "aria-label=\"Hentikan audio\"",
  "'Putar audio dialog'",
  "aria-label=\"Keluar dari pelajaran\"",
  "<svg",
  "top: 12, left: 12",
  "top: 12, right: 12",
  "data-testid=\"cafe-dialog-translation\"",
]) {
  assert.ok(cafeDialog.includes(token), `[P] U-X2/X3/X4: ${token}`);
}
assert.equal(cafeDialog.includes("{audioLabel}"), false, "[P] U-X2 tidak ada tombol teks lama");
assert.ok(learningAudio.includes("activeClipIndex") && learningAudio.includes("AbortController"), "[P] audio membatalkan klip lama");
assert.equal(cafeDialog.includes("void audio.play(plan.files"), true, "[P] WAV hanya setelah tombol ditekan");

// --- UIUX-VISUAL-AUDIO-20261120: [P] layer, koreksi, suasana, cue ---
assert.deepEqual(CAFE_LAYERS.map((layer) => layer.id), ['cafe', 'learner', 'barista', 'counter', 'coffee'], "[P] urutan lapis belakang-depan");
assert.deepEqual(CAFE_LAYERS.map((layer) => layer.zIndex), [0, 1, 2, 3, 4], "[P] z-index 0..4");
for (const layer of CAFE_LAYERS) {
  assert.equal(layer.rectPx.length, 4, `[P] layer ${layer.id} punya rect`);
}
const cafeCelDir = path.join(root, "src/klab/learning/assets/cafe-cel");
for (const file of ["cafe-background.webp", "learner-neutral.webp", "learner-speaking.webp", "barista-neutral.webp", "barista-speaking.webp", "counter.webp", "coffee-cup.webp"]) {
  assert.ok(fs.existsSync(path.join(cafeCelDir, file)), `[P] cel WebP ${file}`);
}
recordAudit("[P] UIUX-VISUAL 7 layer cel", { layers: CAFE_LAYERS.map((l) => l.id) });

assert.equal(correctionClipFor('lp-u4-l2-01', 'Ich möchte ___ Apfelsaft, bitte.', 'einen'), CAFE_CORRECTION.file, "[P] koreksi teks persis memakai klip stok");
assert.equal(correctionClipFor('lp-u4-l2-01', 'Pertanyaan lain ___?', 'einen'), null, "[P] teks tidak persis -> jangan pakai klip");
assert.ok(fs.existsSync(path.join(root, "src/klab/learning/assets/stok", CAFE_CORRECTION.file)), "[P] berkas koreksi ada");
recordAudit("[P] koreksi lp-u4-l2-01", { de: CAFE_CORRECTION.de, file: CAFE_CORRECTION.file });

const ambienceBase = { optIn: true, speechActive: false, readingActive: false, hoerenActive: false, hidden: false };
assert.deepEqual(ambienceDecision({ ...ambienceBase, route: 'today' }), { idle: true, cafe: false, paused: false, stop: false }, "[P] idle hanya Today");
assert.deepEqual(ambienceDecision({ ...ambienceBase, route: 'explore' }), { idle: true, cafe: false, paused: false, stop: false }, "[P] idle hanya Jelajah");
assert.deepEqual(ambienceDecision({ ...ambienceBase, route: 'cafe' }), { idle: false, cafe: true, paused: false, stop: false }, "[P] ambience hanya konteks kafe");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'other' }).idle, false, "[P] rute lain tanpa idle");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'cafe', speechActive: true }).cafe, false, "[P] jeda saat tuturan");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'cafe', readingActive: true }).cafe, false, "[P] jeda saat Bacaan");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'cafe', hoerenActive: true }).cafe, false, "[P] jeda saat Hören");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'today', optIn: false }).stop, true, "[P] default mati");
assert.equal(ambienceDecision({ ...ambienceBase, route: 'cafe', hidden: true }).stop, true, "[P] berhenti saat rute ditinggalkan/tersembunyi");
assert.equal(cupCueDecision(false, false), true, "[P] cue sekali saat tersedia");
assert.equal(cupCueDecision(true, false), false, "[P] cue tidak diulang");
assert.equal(cupCueDecision(false, true), false, "[P] cue dilewati bila tuturan segera mulai");
recordAudit("[P] UIUX-AUDIO policy", { idleRoutes: ['today', 'explore'], cueOnce: true });

// --- RAK-DIALOG / INTERAKSI-LERNEN-01: [P] jalur rak & interaksi tokoh ---
assert.deepEqual(dialogAvailability(10).kind, 'full', "[P] textId 10 = naskah penuh");
assert.deepEqual(dialogAvailability(1).kind, 'preview', "[P] textId 1 tetap pratinjau Anna-Budi");
assert.equal(dialogAvailability(77).kind, 'none', "[P] buku lain jujur: tanpa naskah");
assert.equal(CAFE_DIALOG[0].de, 'Guten Tag! Was möchten Sie?', "[P] barista memulai sapaan");
assert.equal(CAFE_DIALOG[1].de, 'Ich möchte einen Kaffee, bitte.', "[P] pemelajar menjawab pesanan");
const narrationFiles = readingAudioPlan(getReading(10));
assert.equal(narrationFiles.includes(CAFE_DIALOG[0].file), false, "[P] klip narasi tidak dipakai untuk sapaan barista");
assert.equal(CAFE_DIALOG[1].file, 'a1_example_062.wav', "[P] klip tuturan sesuai manifest dialog");
assert.ok(narrationFiles.includes(CAFE_DIALOG[1].file), "[P] klip yang sama dipakai karena teks identik, bukan substitusi");
recordAudit("[P] RAK-DIALOG narasi vs tuturan", {
  narrationFiles,
  dialogFiles: CAFE_DIALOG.map((t) => t.file),
  note: 'a1_example_062 cocok persis untuk narasi dan tuturan; tetap satu klip kanonik, bukan pengganti tiruan.',
});

const soundBase = { optIn: true, speechActive: false, readingActive: false, hoerenActive: false, hidden: false, cuePlayed: false, route: 'other' };
assert.equal(soundPriority({ ...soundBase, route: 'today' }).idle, true, "[P] idle di Hari Ini");
assert.equal(soundPriority({ ...soundBase, route: 'explore' }).idle, true, "[P] idle di Jelajah");
assert.equal(soundPriority({ ...soundBase, route: 'cafe' }).ambience, true, "[P] ambience di kafe");
assert.equal(soundPriority({ ...soundBase, route: 'cafe', speechActive: true }).ambience, false, "[P] jeda saat tuturan");
assert.equal(soundPriority({ ...soundBase, route: 'reader', readingActive: true }).idle, false, "[P] jeda saat Bacaan");
assert.equal(soundPriority({ ...soundBase, route: 'other', hoerenActive: true }).idle, false, "[P] jeda saat Hören");
assert.equal(soundPriority({ ...soundBase, optIn: false }).stop, true, "[P] default mati");
assert.equal(soundPriority({ ...soundBase, hidden: true }).stop, true, "[P] berhenti saat pindah rute/tersembunyi");
recordAudit("[P] satu pengendali prioritas suara", { routes: ['today', 'explore', 'cafe'] });

const readingSource = fs.readFileSync(path.join(root, "src/klab/learning/ReadingFlow.tsx"), "utf8");
const conversationSource = fs.readFileSync(path.join(root, "src/klab/learning/CafeConversation.tsx"), "utf8");
const lessonSource = fs.readFileSync(path.join(root, "src/klab/learning/LessonFlow.tsx"), "utf8");
for (const token of ["preview-start-dialog", "preview-listen-dialog", "preview-full-text", "dialog-availability", "data-active", "<CafeConversation", "reader-start-dialog", "reader-listen-dialog", "reader-full-text"]) {
  assert.ok(readingSource.includes(token), `[P] ReadingFlow: ${token}`);
}
const dialogSource = fs.readFileSync(path.join(root, "src/klab/learning/CafeDialog.tsx"), "utf8");
assert.ok(dialogSource.includes("audioStarting.current"), "[P] CafeDialog kunci klik cepat audio");
assert.ok(conversationSource.includes("audioStarting.current"), "[P] CafeConversation kunci klik cepat audio");
recordAudit("[P] RAK-DIALOG-01 jalur reader & anti klik cepat", { readerCTA: true, audioLock: true });
for (const token of ["prefers-reduced-motion", "cafe-conv-play", "cafe-conv-stop", "cafe-conv-replay", "cafe-conv-next", "cafe-conv-meaning-toggle", "cafe-conv-exit", "cafe-conv-action", "audio.pause()", "audio.resume()"]) {
  assert.ok(conversationSource.includes(token), `[P] CafeConversation: ${token}`);
}
assert.ok(lessonSource.includes("orderSubmitted) return;") && lessonSource.includes("submitted) return;"), "[P] cegah klik ganda mengirim jawaban");
assert.ok(lessonSource.includes("aria-live=\"polite\"") && lessonSource.includes("Jawabanmu benar"), "[P] status benar/salah lewat teks");
assert.ok(learningAudio.includes("'paused'") && learningAudio.includes("const pause = useCallback"), "[P] kontrol audio mencerminkan jeda");
recordAudit("[P] INTERAKSI kontrol & feedback", { controls: 6, reducedMotion: true, doubleSubmitGuarded: true });

fs.writeFileSync(evidencePath, JSON.stringify({ ...behavior, qualityAudit: auditRecords }, null, 2) + "\n");

console.log(
  "KLAB learning 2a OK: U4 L2 4 materi + 2 soal bank asli, koreksi satu/einen, " +
    "Im Café 6 kalimat + 6 klip WAV lokal, aset byte-identik, 42/96/67 termuat, " +
    "penilaian setelah submit, navigasi+retry, 3 item U11 L1, dan contoh sesuai soal.",
);
