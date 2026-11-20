// Regresi NILAI-01: posisi opsi, identitas kunci, resume, alternatif sah,
// pengecoh kapitalisasi, bank kurang, dan aturan 73 persen satu tujuan gagal.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));

const loadTs = (rel, overrides = {}) => {
  const file = path.join(root, rel);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) =>
    Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : createRequire(file)(id);
  new Function("require", "module", "exports", output)(localRequire, loaded, loaded.exports);
  return loaded.exports;
};

const optionOrder = loadTs("src/lessons/optionOrder.ts");
const answers = loadTs("src/srs/answers.ts");
const objectives = loadTs("src/lessons/objectives.ts", { "./optionOrder": optionOrder });
const practice = loadTs("src/lessons/practice.ts", { "./optionOrder": optionOrder });
const checkpointResult = loadTs("src/lessons/checkpointResult.ts");

const {
  answerPosition,
  buildOptionOrders,
  mulberry32,
  shuffleWith,
} = optionOrder;
const { choiceMatches } = answers;
const {
  buildObjectiveCheckpoint,
  evaluateObjectiveResult,
  evaluateReadiness,
  objectiveCheckpointAvailable,
  objectiveReadiness,
} = objectives;
const { lessonExamples } = practice;
const { gradeCheckpoint } = checkpointResult;

const UNIT_NOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const banks = new Map();
let choiceCount = 0;
let firstIsAnswer = 0;

for (const unitNo of UNIT_NOS) {
  const bank = readJson(`src/data/lessons/a1_unit${unitNo}_bank.json`);
  banks.set(unitNo, bank);
  for (const item of bank.items) {
    if (item.mode !== "choice") continue;
    choiceCount += 1;
    if (item.options[0] === item.answer) firstIsAnswer += 1;
  }
}

// 1. Reproduksi temuan historis: 184/184 pilihan ganda A1 berkunci opsi
// pertama. Koreksi konten sah dapat mengubah jumlah item; yang tetap diuji
// adalah data saat ini masih menaruh kunci di posisi pertama sehingga runtime
// wajib mengacaknya.
assert.ok(choiceCount >= 184, "A1 choice item count tidak boleh turun dari baseline historis");
assert.equal(firstIsAnswer, choiceCount, "authored options still place the key first; runtime must shuffle");

// Pola yang sama pada data objektif Uji A1 dan latihan mendengar.
const mock = readJson("src/data/practice/a1_mock_exam.json");
const listening = readJson("src/data/practice/a1_listening.json");
const readingSection = mock.sections.find((section) => section.kind === "reading");
let mockFirst = 0;
for (const item of readingSection.items) {
  if (item.options[0] === item.answer) mockFirst += 1;
}
assert.equal(mockFirst, 5, "mock reading: 5/5 first option is the key");
let listenFirst = 0;
let listenTotal = 0;
for (const dialogue of listening.items) {
  for (const question of dialogue.questions) {
    listenTotal += 1;
    if (question.options[0] === question.answer) listenFirst += 1;
  }
}
assert.equal(listenTotal, 10, "listening question count");
assert.equal(listenFirst, 10, "listening: 10/10 first option is the key");

// 2. Checkpoint: opsi diacak, kunci/identitas tetap, tidak ada posisi bocoran.
const SEEDS = Array.from({ length: 40 }, (_, index) => 1000 + index);
let positionSamples = 0;
let firstPositionSamples = 0;
const observedPositions = new Set();

for (const unitNo of UNIT_NOS) {
  const bank = banks.get(unitNo);
  const bankById = new Map(bank.items.map((item) => [item.id, item]));
  const planA = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(SEEDS[0]));
  const planB = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(SEEDS[0]));
  const planC = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(SEEDS[1]));
  assert.ok(planA && planB && planC, `unit ${unitNo} plans`);
  assert.deepEqual(planA.items, planB.items, `unit ${unitNo} same seed -> same order`);
  assert.notDeepEqual(
    planA.items.map((item) => item.options ?? null),
    planC.items.map((item) => item.options ?? null),
    `unit ${unitNo} different seed -> different option order`,
  );

  for (const item of planA.items) {
    assert.ok(item.key.startsWith(`A1:${unitNo}:`), `${item.key} key prefix`);
    const bankItem = bankById.get(item.key.slice(`A1:${unitNo}:`.length));
    assert.ok(bankItem, `${item.key} refers to a bank item`);
    assert.equal(item.answer, bankItem.answer, `${item.key} answer unchanged`);
    if (item.mode !== "choice") continue;
    assert.deepEqual(
      [...item.options].sort(),
      [...bankItem.options].sort(),
      `${item.key} options are the same set`,
    );
    assert.ok(item.options.includes(item.answer), `${item.key} answer stays in options`);
    assert.equal(item.key, `A1:${unitNo}:${bankItem.id}`, `${item.key} identity stable`);

    // Resume: draft menyimpan item lengkap; urutan harus identik setelah parse.
    const resumed = JSON.parse(JSON.stringify(item));
    assert.deepEqual(resumed.options, item.options, `${item.key} options stable on resume`);
  }

  for (const seed of SEEDS) {
    const plan = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(seed));
    for (const item of plan.items.filter((entry) => entry.mode === "choice")) {
      const position = answerPosition(item.options, item.answer);
      assert.ok(position >= 0, `${item.key} answer present`);
      positionSamples += 1;
      observedPositions.add(position);
      if (position === 0) firstPositionSamples += 1;
    }
  }
}

assert.ok(positionSamples > 3000, "enough option position samples");
assert.ok(
  firstPositionSamples < positionSamples * 0.4,
  `answer must not stay in first position (first=${firstPositionSamples}/${positionSamples})`,
);
assert.ok(observedPositions.size >= 3, "answer appears in several positions");

// 3. Latihan contoh pelajaran: opsi diacak, kunci dan key stabil.
const fakeLesson = {
  title: "Unit uji",
  drill: { code: "D1" },
  slides: [
    { title: "a", example_de: "Ich heiße Anna.", example_id: "Nama saya Anna." },
    { title: "b", example_de: "Ich komme aus Berlin.", example_id: "Saya berasal dari Berlin." },
    { title: "c", example_de: "Ich wohne in Bandung.", example_id: "Saya tinggal di Bandung." },
    { title: "d", example_de: "Ich bin Lehrer.", example_id: "Saya guru." },
  ],
};
const examplesA = lessonExamples(fakeLesson, mulberry32(7));
const examplesB = lessonExamples(fakeLesson, mulberry32(7));
assert.deepEqual(examplesA, examplesB, "lesson examples stable with same seed");
assert.equal(examplesA.length, 4);
for (const item of examplesA) {
  assert.ok(item.options.includes(item.answer), `${item.key} answer present`);
  assert.equal(item.key, `lesson-example:Unit uji:${examplesA.indexOf(item)}:${item.prompt}`, "lesson key stable");
}
const examplePositions = new Set();
for (let seed = 1; seed <= 40; seed++) {
  for (const item of lessonExamples(fakeLesson, mulberry32(seed))) {
    examplePositions.add(answerPosition(item.options, item.answer));
  }
}
assert.ok(examplePositions.size >= 3, "lesson example answer moves across positions");

// 4. Uji A1 + latihan mendengar: pembangun urutan opsi menjaga set dan kunci.
const listeningEntries = listening.items.flatMap((dialogue) =>
  dialogue.questions.map((question, index) => ({
    key: `${dialogue.id}:${index}`,
    options: question.options,
    answer: question.answer,
  })),
);
const readingEntries = readingSection.items.map((item, index) => ({
  key: `${readingSection.id}:${index}`,
  options: item.options,
  answer: item.answer,
}));
const examEntries = [...listeningEntries, ...readingEntries];
assert.equal(examEntries.length, 15, "Uji A1 objective items");
let examFirst = 0;
let examSamples = 0;
for (let seed = 1; seed <= 40; seed++) {
  const orders = buildOptionOrders(examEntries, mulberry32(seed));
  for (const entry of examEntries) {
    const order = orders[entry.key];
    assert.deepEqual([...order].sort(), [...entry.options].sort(), `${entry.key} option set`);
    const position = answerPosition(order, entry.answer);
    assert.ok(position >= 0, `${entry.key} key present`);
    examSamples += 1;
    if (position === 0) examFirst += 1;
  }
}
assert.ok(examFirst < examSamples * 0.4, `Uji A1 first position not a leak (${examFirst}/${examSamples})`);

// 5. Pencocokan pilihan: alternatif sah diterima, kapitalisasi tetap salah.
assert.equal(choiceMatches("auf", "auf"), true);
assert.equal(choiceMatches(" auf ", "auf"), true);
assert.equal(choiceMatches("An der", "an der", ["An der"]), true);
assert.equal(choiceMatches("an der", "an der"), true);
assert.equal(choiceMatches("musik", "Musik"), false, "capitalization distractor must stay wrong");
assert.equal(choiceMatches("Musik", "Musik"), true);
assert.equal(choiceMatches("Schwimmen", "schwimmen"), false, "noun capitalization distractor must stay wrong");
assert.equal(choiceMatches("schwimmen", "schwimmen"), true);

const unit10 = banks.get(10);
const musicItem = unit10.items.find(
  (item) => item.mode === "choice" && item.answer === "Musik" && item.options.includes("musik"),
);
const swimItem = unit10.items.find(
  (item) => item.mode === "choice" && item.answer === "schwimmen" && item.options.includes("Schwimmen"),
);
assert.ok(musicItem, "Musik/musik item exists");
assert.ok(swimItem, "schwimmen/Schwimmen item exists");
assert.equal(choiceMatches("musik", musicItem.answer), false);
assert.equal(choiceMatches("Schwimmen", swimItem.answer), false);

// 6. Bank kurang tidak boleh siap; unit tanpa kisi-kisi tetap unavailable.
const unit1Objectives = objectives.A1_OBJECTIVES.filter((objective) => objective.unit === 1);
const unit1Policy = objectives.objectivePolicy(1);
const shortCounts = new Map(unit1Objectives.map((objective) => [objective.id, 5]));
shortCounts.set(unit1Objectives[0].id, 2);
const short = evaluateReadiness(unit1Objectives, unit1Policy, shortCounts);
assert.equal(short.status, "insufficient");
assert.equal(short.missing.length, 1);
assert.equal(short.missing[0].have, 2);
assert.equal(short.missing[0].need, 3);
assert.equal(evaluateReadiness(unit1Objectives, undefined, shortCounts).status, "unavailable");

for (const unitNo of UNIT_NOS) {
  assert.equal(objectiveReadiness(unitNo).status, "ready", `unit ${unitNo} bank ready`);
  assert.equal(objectiveCheckpointAvailable(unitNo), true, `unit ${unitNo} checkpoint available`);
}
assert.equal(objectiveCheckpointAvailable(13), false, "unit 13 has no objective checkpoint");

// 7. Aturan kelulusan: 73 persen dengan satu tujuan gagal harus gagal.
const failed73 = evaluateObjectiveResult(
  { pass: 70, perObjectiveMin: 2 },
  [
    { correct: 3, total: 3 },
    { correct: 3, total: 3 },
    { correct: 2, total: 3 },
    { correct: 2, total: 3 },
    { correct: 1, total: 3 },
  ],
  11,
  15,
);
assert.equal(failed73.score, 73);
assert.equal(failed73.overallPass, true);
assert.equal(failed73.objectivesPass, false);
assert.equal(failed73.pass, false, "73 percent with one failed objective must not pass");

const perfect = evaluateObjectiveResult(
  { pass: 70, perObjectiveMin: 2 },
  Array.from({ length: 5 }, () => ({ correct: 3, total: 3 })),
  15,
  15,
);
assert.equal(perfect.pass, true);

const lowScoreAllObjectives = evaluateObjectiveResult(
  { pass: 70, perObjectiveMin: 2 },
  Array.from({ length: 5 }, () => ({ correct: 2, total: 3 })),
  10,
  15,
);
assert.equal(lowScoreAllObjectives.score, 67);
assert.equal(lowScoreAllObjectives.objectivesPass, true);
assert.equal(lowScoreAllObjectives.pass, false, "67 percent must not pass despite 2/3 per objective");

// 7b. Paritas dengan runner checkpoint (gradeCheckpoint) untuk kasus yang sama.
const parityPlan = buildObjectiveCheckpoint(4, new Set(), mulberry32(2026));
assert.ok(parityPlan, "parity plan");
const pattern = [3, 3, 2, 2, 1];
let parityCorrect = 0;
const parityAnswers = [];
parityPlan.objectives.forEach((objective, objectiveIndex) => {
  const own = parityPlan.items.filter((item) => item.objectiveId === objective.id);
  own.forEach((item, itemIndex) => {
    const correct = itemIndex < pattern[objectiveIndex];
    if (correct) parityCorrect += 1;
    parityAnswers.push({ key: item.key, correct });
  });
});
const grade = gradeCheckpoint(
  parityPlan.items,
  parityPlan.objectives,
  parityPlan.policy,
  parityAnswers,
  parityPlan.policy.pass,
);
const expected = evaluateObjectiveResult(
  parityPlan.policy,
  pattern.map((count, index) => ({
    correct: count,
    total: parityPlan.items.filter((item) => item.objectiveId === parityPlan.objectives[index].id).length,
  })),
  parityCorrect,
  parityPlan.items.length,
);
assert.equal(grade.score, 73, "runner score for 3,3,2,2,1");
assert.equal(grade.pass, false, "runner must fail 73 percent with one failed objective");
assert.equal(grade.pass, expected.pass, "runner and shared rule agree");
assert.equal(grade.objectiveResults[4].pass, false, "fifth objective fails at 1/3");
const allCorrect = gradeCheckpoint(
  parityPlan.items,
  parityPlan.objectives,
  parityPlan.policy,
  parityPlan.items.map((item) => ({ key: item.key, correct: true })),
  parityPlan.policy.pass,
);
assert.equal(allCorrect.pass, true, "runner passes all-correct attempt");

// 8. Koreksi konten yang diminta.
const unit6 = banks.get(6);
const newspaper = unit6.items.find((item) => item.id === "u6-o3-01");
assert.ok(newspaper.prompt.includes("flach"), "newspaper item needs explicit flat-position context");
assert.equal(newspaper.answer, "auf");
assert.ok(newspaper.options.includes("an"));
const picture = unit6.items.find((item) => item.id === "u6-o3-04");
assert.ok(!picture.prompt.includes("an + dem"), "an + dem hint must not contradict an der answer");
assert.equal(picture.answer, "an der");

const unit3 = banks.get(3);
const marital = unit3.items.find((item) => item.id === "u3-o4-02");
assert.ok(marital.prompt.includes("noch nie verheiratet"), "ledig item must exclude geschieden context");
assert.equal(marital.answer, "ledig");

console.log(
  "A1 option order OK:\n" +
    `  historis 184/184; kini ${firstIsAnswer}/${choiceCount} opsi pertama = kunci (runtime mengacak); ` +
    `Uji A1 ${mockFirst}/5 + mendengar ${listenFirst}/10\n` +
    `  ${positionSamples} sampel posisi checkpoint, posisi pertama ${firstPositionSamples}; ` +
    `posisi teramati ${[...observedPositions].sort().join(",")}\n` +
    "  kunci/identitas stabil, resume identik, alternatif sah diterima, " +
    "kapitalisasi Musik/musik dan schwimmen/Schwimmen tetap salah\n" +
    "  bank kurang = insufficient, 73 persen dengan satu tujuan gagal = tidak lulus, " +
    "koreksi koran/an der/ledig terverifikasi, runner gradeCheckpoint sepakat dengan aturan bersama.",
);
