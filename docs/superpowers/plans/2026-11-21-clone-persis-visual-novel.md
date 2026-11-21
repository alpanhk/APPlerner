# Clone Persis Visual Novel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Lernen Windows app open directly into a pixel-faithful clone of the `german-learning-visual-novel` reference, keeping existing data as dormant adapters for later work.

**Architecture:** Replace the presentation layer with the reference's Title/Create/Stage/Story/Result screens and Tailwind styles. A small async bootstrap loads SQLite first, then hands a synchronous `ProgressStore`-shaped adapter to the reference components. The old 4-tab shell and learning modules stay in the repo as dormant modules, not on the main path.

**Tech Stack:** React 19, Tauri 2, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, SQLite via existing `src/data`/`config` plumbing.

**Spec:** `docs/superpowers/specs/2026-11-21-clone-persis-visual-novel-design.md`

## Global Constraints
- Work only in `<clone APPlerner-verify>`, branch `clone-persis-20261121` from `18edbf85fe2249fb12b06c48a1b2ee21057296ad`.
- Reference: `<referensi-visual-novel-20261121>`; manifest `src/data/ref-visual-novel-manifest.json` (96 files, aggregate `a562f171…`).
- No commit, push, PR, merge, force push, reset, clean, Xfigura, image agent, participant profiles, pilot package changes, or shortcut changes before a passing build.
- No new external network calls at runtime; all fonts/audio/images must be embedded.
- Keep `console.error = 0`, 0 QA processes left, DB restored to pre-test state, existing data intact.
- One owner per file area; use existing OpenCode worker sessions, no duplicates.

## Review Focus
- First run with no saved progress → Title shows "Cerita baru" only; no crash from missing `Progress`. Test: `test_novel_clone.cjs` first-run case.
- Restart with saved progress → `stage`, `flags`, `prologCompleted`, `attempts` survive; adapter must not drop fields. Test: round-trip through `createNovelLocalStore`.
- Offline font/audio → Caveat 600 and Atkinson italic 400 resolve locally; no Google Fonts link. Test: build output contains 4 TTF files and `index.html` has no `fonts.googleapis.com`.
- Small viewport 900×600 and reduced motion → controls remain usable, no overflow. Test: CDP screenshot + overflow check in QA harness.
- Rapid clicks / audio default silent → no stacked tracks, no double submit. Test: QA rapid-click step with probe before click.

---

### Task 1: Fondasi build, Tailwind, offline fonts

**Files:**
- Modify: `package.json`, `vite.config.ts`, `index.html`
- Create: `src/klab/novel/index.css` (copy of reference `src/index.css` with local `@font-face`)
- Verify: `scripts/qa/test_novel_clone.cjs`

**Interfaces:**
- Consumes: reference `index.html`, `src/index.css`, `src/assets/fonts/*` already downloaded in `src/assets/fonts/`.
- Produces: Vite build that compiles Tailwind classes from reference components; `index.html` with no Google Fonts link.

- [ ] **Step 1: Add Tailwind v4 + `@tailwindcss/vite` to `package.json` and Vite config**
  Use exact versions from reference: `@tailwindcss/vite@4.1.17`, `tailwindcss@4.1.17`. Keep existing Vite plugins intact.

- [ ] **Step 2: Copy reference `src/index.css` to `src/klab/novel/index.css` and replace Google Fonts dependency with local `@font-face`**
  Declare: Atkinson Regular/Bold/Italic and Caveat SemiBold from `src/assets/fonts/*.ttf`. Keep all reference classes and `@theme` values verbatim.

- [ ] **Step 3: Remove `<link>` to `fonts.googleapis.com` / `fonts.gstatic.com` from `index.html`**
  Expected: no external font URL remains.

- [ ] **Step 4: Add assertions to `scripts/qa/test_novel_clone.cjs`**
  Assert `index.html` has no `fonts.googleapis.com`; assert 4 font files exist; assert Tailwind dependency present.

- [ ] **Step 5: Run `node scripts/qa/test_novel_clone.cjs` and `pnpm exec tsc --noEmit`**
  Expected: PASS / exit 0. No commit/push.

### Task 2: Port reference data model, story engine, and synchronous store adapter

**Files:**
- Create: `src/klab/novel/types.ts`, `src/klab/novel/engine/story.ts`, `src/klab/novel/engine/matchers.ts`, `src/klab/novel/data/story/prolog.ts`, `src/klab/novel/data/{curriculum,readings,cover-map,a1_objectives}.json`, `src/klab/novel/data/media-manifest.ts`, `src/klab/novel/storage/progress.ts`
- Modify: `src/app/novelProgress.ts` only to expose a SQLite seed reader if missing
- Test: `scripts/qa/test_novel_clone.cjs`

**Interfaces:**
- Consumes: reference `src/types.ts`, `src/engine/*`, `src/data/*`, `src/storage/progress.ts`; existing `novelProgress.ts` for persisted seed.
- Produces: `createNovelLocalStore(seed: { progress: Progress | null; settings: Settings }): ProgressStore` where `ProgressStore` is the reference interface (`loadProgress`, `saveProgress`, `loadSettings`, `saveSettings`). Types `Progress`, `Settings`, `Game`, `StoryNode` exported from `src/klab/novel/types.ts`.

- [ ] **Step 1: Copy reference types/engine/story/data into `src/klab/novel/` with import paths adjusted only**
  No behavioral changes. `PROLOG_START` must remain exported.

- [ ] **Step 2: Implement `createNovelLocalStore(seed)` in `src/klab/novel/storage/progress.ts`**
  Keep state in memory; `saveProgress`/`saveSettings` call an injected async persister that writes through the existing SQLite config keys. Do not drop `stage`, `flags`, `prologCompleted`, `attempts`, `history`.

- [ ] **Step 3: Add adapter round-trip test to `scripts/qa/test_novel_clone.cjs`**
  Assert progress with non-empty `stage`, `flags`, `prologCompleted=true`, 2 attempts survives `save`→`load` with deep equality.

- [ ] **Step 4: Run test and `tsc`**
  Expected: PASS / exit 0.

### Task 3: Port reference visual components and assets

**Files:**
- Create: `src/klab/novel/components/{TitleScreen,CharacterCreator,Stage,DialogPanel,Portrait,ResultScreen,Panels}.tsx`, `src/klab/novel/audio/AudioController.ts`, `src/klab/novel/assets/**` (bg, covers, scenes, audio, fonts)
- Modify: `src/klab/novel/data/media-manifest.ts` import paths
- Test: `scripts/qa/test_novel_clone.cjs`

**Interfaces:**
- Consumes: Task 2 types/engine, Task 1 CSS/theme, reference component files.
- Produces: components with the same props as reference `App.tsx` call sites: `TitleScreen({hasSave, saveName, onStart, onContinue, onSettings, onLibrary})`, `CharacterCreator({initial, onDone, onBack})`, `Stage({stage, player, speakingChar, mouthOpen, reducedMotion, dim})`, `DialogPanel`, `ResultScreen`, `Panels`.

- [ ] **Step 1: Copy reference components and assets into `src/klab/novel/`**
  Adjust only import paths. Do not restyle.

- [ ] **Step 2: Copy `AudioController.ts` and wire it to local WAV/Opus from `src/klab/novel/assets/audio/`**
  Default `soundOn=false`; no external URLs.

- [ ] **Step 3: Assert asset manifest coverage in test**
  All 96 manifest paths resolve; 5 audio files exist locally; no `https://` in media URLs.

- [ ] **Step 4: Run test and `tsc`**
  Expected: PASS / exit 0.

### Task 4: New async entry and dormant old modules

**Files:**
- Create: `src/klab/novel/App.tsx`
- Modify: `src/main.tsx` (or current entry) to render `App` from `src/klab/novel/App.tsx`
- Modify: `src/App.tsx` — keep file, but export as `LegacyApp` only; no render from main path
- Create: `docs/superpowers/DATA-BERIKUTNYA.md`

**Interfaces:**
- Consumes: Task 1 CSS, Task 2 `createNovelLocalStore`, Task 3 components, existing DB bootstrap.
- Produces: `App` default export that renders reference screens only.

- [ ] **Step 1: Implement async bootstrap in `src/klab/novel/App.tsx`**
  Call existing DB initialization/integrity/auto-backup first, read `NovelProgress`/`NovelSettings` from SQLite, build `localStore`, then render Title. Keep a minimal loading state; no `console.error`.

- [ ] **Step 2: Port reference `screen` state machine and panel wiring**
  Screens: `title | create | story`; panels: `journal | library | history | settings`. Same callbacks as reference.

- [ ] **Step 3: Confirm old shell is unreachable from main path**
  `main.tsx` imports only new `App`; `LegacyApp` remains exported but unreferenced. Document dormant modules in `DATA-BERIKUTNYA.md`.

- [ ] **Step 4: Run `pnpm build` and `tsc`**
  Expected: exit 0; `dist` contains fonts, audio, images, Tailwind CSS.

- [ ] **Step 5: Smoke via CDP: open app, capture Title screenshot, check `console.error=0`**
  Expected: PASS.

### Task 5: Kandidat build, visual diff, and handoff

**Files:**
- Create: `outputs/penyelesaian-windows/clone-persis-20261121/kandidat-qa/**`
- Create: `outputs/penyelesaian-windows/clone-persis-20261121/laporan-qa.md`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: one EXE + SHA + WIB + evidence; no shortcut change yet.

- [ ] **Step 1: Build with `pnpm tauri build --no-bundle` using config `tauri.qa.clone.conf.json`, isolated `CARGO_TARGET_DIR`**
  Expected: `BUILD_EXIT=0`; do not overwrite `bbf336c9` / `77994b89` / pilot.

- [ ] **Step 2: Run CDP QA on unique profile/port**
  Verify Title, Create, Stage/Story, Result, all panels, keyboard, reduced motion, 900×600, 1280×800, offline, restart, `console.error=0`, 0 processes, DB restored.

- [ ] **Step 3: Screenshot-by-screenshot comparison against reference**
  Produce side-by-side PNGs; report any pixel difference honestly; SESAI only if every screen matches.

- [ ] **Step 4: Report to AD**
  Include EXE path, SHA-256, WIB, evidence, and remaining human-listening limits. AD will decide about shortcut/repo afterward. No commit/push.

## Self-Review
- Spec coverage: entry clone (T4), Tailwind/fonts (T1), data model/adapter (T2), components/assets (T3), acceptance (T5) — covered.
- Types: `ProgressStore`, `Progress`, `Settings`, `Game` defined in T2 and consumed by T4; component props from reference preserved in T3.
- Review Focus: each input class has a test in T1/T2/T3/T5.
- No commit/push steps by design constraint.
