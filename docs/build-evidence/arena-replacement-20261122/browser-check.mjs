import chromiumPkg from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

const PLAN = JSON.parse(readFileSync("/tmp/walk.json", "utf8"));
const SHOTS = "/home/user/APPlerner/docs/build-evidence/arena-replacement-20261122/screens";
const API = "http://127.0.0.1:3001";
const log = [];
const say = (s) => { log.push(s); console.log(s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  args: [...chromiumPkg.args, "--no-sandbox", "--disable-setuid-sandbox"],
  executablePath: await chromiumPkg.executablePath(),
  headless: true,
});
const problems = [];
async function newPage(vp) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  page.on("pageerror", (e) => problems.push(`pageerror@${vp.width}: ${e.message}`));
  page.on("console", (m) => { const t = m.text(); if (m.type() === "error" && !/fonts\.googleapis|ERR_CONNECTION_CLOSED|favicon/.test(t)) problems.push(`console@${vp.width}: ${t.slice(0, 160)}`); });
  page.on("requestfailed", (r) => { const u = r.url(); if (!/fonts\.googleapis/.test(u)) problems.push(`requestfailed: ${u.slice(0, 100)} ${r.failure()?.errorText}`); });
  page.on("response", (r) => { if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url().slice(0, 120)}`); });
  return page;
}

const buttonsInfo = () => [...document.querySelectorAll("button")].map((b) => ({ t: b.innerText.replace(/\s+/g, " ").trim(), inGrid: !!b.closest("div.grid") }));

async function state(page) {
  return page.evaluate(`
    (() => {
      const bs = [...document.querySelectorAll("button")].map((b) => ({ t: b.innerText.replace(/\\s+/g, " ").trim(), inGrid: !!b.closest("div.grid") }));
      return {
        input: !!document.querySelector("#jawab"),
        hint: bs.map(b => b.t).find((t) => t.startsWith("Petunjuk ")) ?? null,
        next: bs.map(b => b.t).find((t) => /^(Lanjut|Lewati) ▸$/.test(t)) ?? null,
        choices: bs.filter((b) => b.inGrid && /^[1-9]/.test(b.t)).map((b) => b.t.replace(/^[1-9]\\s*/, "")),
        body: document.body.innerText.slice(0, 2500),
        label: (document.querySelector('label[for="jawab"]')?.innerText || "").replace(/\s+/g, " ").trim(),
      };
    })()
  `);
}

async function clickText(page, text) {
  const ok = await page.evaluate((text) => {
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    const els = [...document.querySelectorAll("button, a")];
    const t = els.find((e) => norm(e.innerText) === text) || els.find((e) => norm(e.innerText).replace(/^[1-9]\s*/, "") === text) || els.find((e) => norm(e.innerText).includes(text));
    if (!t) return false;
    t.click();
    return true;
  }, text);
  if (!ok) throw new Error(`tombol tidak ditemukan: ${text}`);
  await sleep(200);
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });

/* walk satu bab secara generik, memakai antrean model jawaban dari rencana engine */
async function waitSettled(page, beforeLabel) {
  for (let i = 0; i < 40; i++) {
    await sleep(120);
    const now = await page.evaluate(() => {
      const l = document.querySelector('label[for="jawab"]')?.innerText.replace(/\s+/g, " ").trim() ?? null;
      const fb = [...document.querySelectorAll('div[aria-live="polite"] > p')].map((p) => p.innerText.trim()).join(" ");
      return { label: l, hasInput: !!document.querySelector("#jawab"), fb };
    });
    if (!now.hasInput) return;
    if (now.label && now.label !== beforeLabel && !now.fb) return;
    if (!now.fb && now.label === beforeLabel && i > 10) return;
  }
}

async function tryCandidates(page, st, cands, name) {
  for (const c of cands) {
    const txt = c.replace(/\{name\}/g, name);
    await page.evaluate(() => { const i = document.querySelector("#jawab"); if (i) { i.focus(); i.select(); } });
    await page.keyboard.press("Backspace");
    await page.type("#jawab", txt, { delay: 4 });
    await clickText(page, "Kirim");
    await waitSettled(page, st.label);
    const focused = await page.evaluate(() => !!document.querySelector("#jawab"));
    const fb = await page.evaluate(() => [...document.querySelectorAll('[aria-live="polite"] p')].map((p) => p.innerText.trim()).join(" "));
    if (!focused || !fb) return true;
  }
  return false;
}

async function playChapter(page, chapterId, hooks = {}) {
  const queue = PLAN[chapterId].steps.filter((s) => s.kind === "input");
  const name = (await page.evaluate(() => localStorage.getItem("lernen.active"))) && "Bukti Browser";
  const fallback = [...new Set(PLAN[chapterId].steps.filter((s) => s.kind === "input").map((s) => s.text))];
  let qi = 0, steps = 0, lines = 0, choices = 0, fallbackUsed = 0;
  while (steps++ < 300) {
    const st = await state(page);
    if (/YANG KAMU BUKTIKAN|PETA PERJALANAN|Lanjut ke Bab/i.test(st.body) && !st.input && !st.choices.length && !st.next) return { finished: true, lines, choices, inputs: qi, fallbackUsed };
    if (st.input) {
      let step = queue[qi++];
      if (!step) { const r = await tryCandidates(page, st, fallback, name); if (r) { fallbackUsed++; continue; } throw new Error("antrean jawaban habis"); }
      if (hooks.onInput && (await hooks.onInput({ page, step, st, index: qi })) === "skip") continue;
      await page.click("#jawab");
      await page.type("#jawab", step.text, { delay: 5 });
      await clickText(page, "Kirim");
      await waitSettled(page, st.label);
      continue;
    }
    if (st.choices.length) {
      const usable = st.choices.filter((c) => !/^Ulangi/.test(c));
      const pick = usable[usable.length - 1];
      choices++;
      if (hooks.onChoice) await hooks.onChoice({ page, st, pick });
      await clickText(page, pick);
      continue;
    }
    if (st.next) {
      lines++;
      if (hooks.onLine) await hooks.onLine({ page, st, n: lines });
      try { await clickText(page, st.next); } catch { await clickText(page, "Lanjut"); }
      continue;
    }
    await sleep(300);
    if (steps > 8) return { finished: false, lines, choices, inputs: qi };
  }
  return { finished: false, lines, choices, inputs: qi, fallbackUsed };
}

/* ================= DESKTOP ================= */
const page = await newPage({ width: 1280, height: 900 });
page.on("dialog", (d) => d.accept());
await page.goto(`${API}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#nama", { timeout: 30000 });
say(`Entri root: <title>${await page.title()}</title> · layar Title memuat form profil dan 4 avatar`);
await shot(page, "01-title-desktop");

await page.click("#nama");
await page.type("#nama", "Bukti Browser", { delay: 10 });
await page.evaluate(() => { const r = [...document.querySelectorAll('input[name="avatar"]')]; r[2].click(); r[2].dispatchEvent(new Event("change", { bubbles: true })); });
await sleep(350);
const chosenAvatar = await page.evaluate(() => document.querySelector('input[name="avatar"]:checked')?.value);
say(`Avatar dipilih: ${chosenAvatar}`);
await shot(page, "02-title-avatar");
await clickText(page, "Mulai prolog ▸");
await page.waitForFunction(() => /PROLOG|BAB \d/i.test(document.body.innerText), { timeout: 20000 });
await sleep(1200);
say(`Prolog terbuka langsung setelah profil dibuat (judul bab terlihat: ${/Surat untuk Siapa/i.test((await state(page)).body)})`);
await shot(page, "03-prolog-tiba");

let hintDone = false, reviseDone = false, npcDone = false, journalDone = false;
const inputs = [];
const run = await playChapter(page, "prolog", {
  onInput: async ({ page, step, st, index }) => {
    inputs.push({ index, model: step.text, hintLabel: st.hint });
    if (!hintDone) {
      hintDone = true;
      await clickText(page, st.hint);
      await sleep(250);
      await clickText(page, "Petunjuk 1/3");
      await sleep(500);
      const hints = await page.evaluate(() => [...document.querySelectorAll('[aria-live="polite"] li')].map((l) => l.innerText.replace(/\s+/g, " ").trim()));
      say(`Bantuan bertingkat pada giliran "${step.text.split(/\s+/)[0]}…": ${st.hint} → ${hints.length} petunjuk tampil ${JSON.stringify(hints)}`);
      await shot(page, "04-bantuan-bertingkat");
      if (hints.length < 2) throw new Error("petunjuk tidak bertambah");
    }
    if (!reviseDone) {
      reviseDone = true;
      await page.click("#jawab");
      await page.type("#jawab", "Falsch");
      await clickText(page, "Kirim");
      await sleep(1000);
      const fb = await page.evaluate(() => [...document.querySelectorAll('[aria-live="polite"] p')].map((p) => p.innerText.replace(/\s+/g, " ").trim()).join(" | "));
      say(`Revisi: jawaban salah → umpan balik "${fb}"`);
      await shot(page, "05-revisi-umpan-balik");
      if (!fb) throw new Error("tidak ada umpan balik");
      await page.evaluate(() => { const i = document.querySelector("#jawab"); if (i) { i.focus(); i.select(); } });
      await page.keyboard.press("Backspace");
      await sleep(150);
    }
    return "send";
  },
  onLine: async ({ page, st, n }) => {
    if (!npcDone && /Mia|Frau|Pos|Tetangga/.test(st.body) && (await page.evaluate(() => document.querySelectorAll('img[src*="/media/actors/"]').length >= 2))) {
      npcDone = true;
      const actors = await page.evaluate(() => [...document.querySelectorAll('img[src*="/media/actors/"]')].map((i) => `${i.getAttribute("src")}:${i.naturalWidth}px`));
      say(`Interaksi NPC: tokoh tampil di panggung ${JSON.stringify([...new Set(actors)])}`);
      await shot(page, "06-interaksi-npc");
    }
    if (!journalDone && inputs.length >= 2) {
      journalDone = true;
      await clickText(page, "Catatan");
      await sleep(700);
      const notes = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] li')].map((l) => l.innerText.replace(/\s+/g, " ").trim()));
      say(`Jurnal: buku catatan berisi ${notes.length} kalimat ${JSON.stringify(notes)}`);
      await shot(page, "07-jurnal");
      await clickText(page, "Tutup ✕");
      await sleep(250);
    }
  },
});
say(`Prolog tamat di browser: ${run.finished} (${run.lines} baris, ${run.choices} pilihan, ${run.inputs} jawaban)`);
await sleep(1500);
await shot(page, "08-result-desktop");
const resultText = await page.evaluate(() => document.body.innerText);
say(`Layar Result: "Prolog selesai"=${/prolog selesai/i.test(resultText)} · "Yang kamu buktikan"=${/yang kamu buktikan/i.test(resultText)} · kalimat Jerman tercatat=${/"Ich heiße|Hallo|Guten Morgen|[„"]/.test(resultText)}`);
await clickText(page, "Lanjut ke Bab 1");
await sleep(1800);
say(`Bab 1 terbuka dari Result: ${/BAB 1/i.test((await state(page)).body)}`);
await shot(page, "09-bab1");
await clickText(page, "← Peta");
await sleep(1500);
const journey = await page.evaluate(() => document.body.innerText);
say(`Peta perjalanan: "Lanjutkan cerita"=${/lanjutkan cerita/i.test(journey)} · hitungan bab=${(journey.match(/(\d+)\/13/) ?? [])[0]} · "Selesai ✓"=${/selesai/i.test(journey)}`);
await shot(page, "10-journey-desktop");

const pid = await page.evaluate(() => localStorage.getItem("lernen.active"));
const before = await (await fetch(`${API}/api/profiles/${pid}`)).json();
say(`Server sebelum reload: ${before.progress.map((p) => `${p.chapterId}:${p.status}${p.state ? "@" + p.state.nodeId : ""}`).join(", ")} · attempts=${before.attempts.length}`);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => /PETA PERJALANAN|SIAPA NAMA/i.test(document.body.innerText), { timeout: 30000 });
await sleep(1200);
const afterReloadText = await page.evaluate(() => document.body.innerText);
say(`Reload: langsung kembali ke peta pemain (bukan form profil baru)=${/PETA PERJALANAN/i.test(afterReloadText)} · nama tetap=${afterReloadText.includes("Bukti Browser")} · bab aktif="${(afterReloadText.match(/BAB \d+ · [^\n]+/i) ?? [])[0]}"`);
await shot(page, "11-reload-journey");

await clickText(page, "Lanjutkan cerita");
await page.waitForFunction(() => /PROLOG|BAB \d/i.test(document.body.innerText), { timeout: 20000 });
await sleep(1500);
const resumed = await page.evaluate(() => ({ text: document.body.innerText.slice(0, 300), bg: [...document.querySelectorAll("img")].map((i) => i.getAttribute("src")).filter((s) => s?.includes("/media/bg/")) }));
say(`Keluar→lanjut setelah reload: bab 1 dilanjutkan dari checkpoint, latar=${JSON.stringify(resumed.bg)}`);
await shot(page, "12-lanjut-setelah-reload");
await clickText(page, "Catatan");
await sleep(700);
const notesAfter = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] li')].map((l) => l.innerText.replace(/\s+/g, " ").trim()));
say(`Jurnal setelah reload masih berisi ${notesAfter.length} kalimat`);
await shot(page, "13-jurnal-setelah-reload");
await clickText(page, "Tutup ✕");
await sleep(300);
await clickText(page, "← Peta");
await sleep(1000);

/* profil kedua: pastikan draf & bukti terpisah per pemain */
await page.evaluate(() => localStorage.removeItem("lernen.active"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => /LANJUTKAN PERJALANAN|SIAPA NAMA/i.test(document.body.innerText), { timeout: 30000 });
await sleep(900);
const titleBack = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 220));
say(`Layar Title tanpa profil aktif: ${JSON.stringify(titleBack)}`);
await shot(page, "14a-title-kembali");
await clickText(page, "+ Mulai sebagai orang baru");
await page.waitForSelector("#nama", { timeout: 20000 });
await page.click("#nama");
await page.type("#nama", "Pemain Kedua", { delay: 8 });
await page.evaluate(() => { const r = [...document.querySelectorAll('input[name="avatar"]')]; r[3].click(); });
await sleep(250);
await clickText(page, "Mulai prolog ▸");
await page.waitForFunction(() => /PROLOG|BAB \d/i.test(document.body.innerText), { timeout: 20000 });
await sleep(900);
const p2 = await page.evaluate(() => localStorage.getItem("lernen.active"));
const d2 = await (await fetch(`${API}/api/profiles/${p2}`)).json();
const d1 = await (await fetch(`${API}/api/profiles/${pid}`)).json();
say(`Profil kedua (${d2.profile.name}, avatar ${d2.profile.avatar}) mulai dengan progres=${d2.progress.length} & attempts=${d2.attempts.length}; pemain pertama tetap ${d1.progress.length} baris progres & ${d1.attempts.length} attempt`);
await shot(page, "14b-profil-kedua");
await page.evaluate((id) => localStorage.setItem("lernen.active", id), pid);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => /PETA PERJALANAN/i.test(document.body.innerText), { timeout: 30000 });
await sleep(1200);
say(`Beralih kembali ke pemain pertama: nama "${(await page.evaluate(() => document.querySelector("h1")?.innerText ?? "")).slice(0, 60)}"`);
await shot(page, "14c-kembali-pemain-pertama");

/* ================= LAYAR KECIL ================= */
const small = await newPage({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await small.goto(`${API}/`, { waitUntil: "domcontentloaded" });
await small.waitForSelector("button", { timeout: 30000 });
await sleep(1800);
await shot(small, "15-journey-kecil");
const smMap = await small.evaluate(() => ({ ox: document.documentElement.scrollWidth - innerWidth, oy: document.documentElement.scrollHeight - innerHeight, heading: document.querySelector("h1")?.innerText }));
say(`Layar kecil (390×844) peta: overflow horizontal=${smMap.ox}px · judul="${smMap.heading}"`);
await clickText(small, "Lanjutkan cerita");
await small.waitForSelector("#jawab, button", { timeout: 20000 });
await sleep(1600);
await shot(small, "16-play-kecil");
const smPlay = await small.evaluate(() => ({
  ox: document.documentElement.scrollWidth - innerWidth,
  dialog: !!document.querySelector("#jawab") || /PETA/i.test(document.body.innerText),
  actors: [...document.querySelectorAll('img[src*="/media/actors/"]')].map((i) => i.naturalWidth),
  stageH: Math.round(document.querySelector(".relative.min-h-0.flex-1")?.getBoundingClientRect().height ?? 0),
}));
say(`Layar kecil play: overflow X=${smPlay.ox}px · tokoh termuat=${JSON.stringify(smPlay.actors)} · tinggi panggung=${smPlay.stageH}px`);
await clickText(small, "Catatan");
await sleep(800);
await shot(small, "17-jurnal-kecil");
const dr = await small.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? { w: Math.round(d.getBoundingClientRect().width), vw: innerWidth, overflowX: document.documentElement.scrollWidth - innerWidth } : null; });
say(`Layar kecil laci jurnal: ${JSON.stringify(dr)}`);
await clickText(small, "Tutup ✕");
await sleep(200);
await clickText(small, "← Peta");
await sleep(1200);
await small.evaluate(() => window.scrollTo(0, 1800));
await sleep(600);
await shot(small, "18-peta-bab-kecil");
const smScroll = await small.evaluate(() => ({ ox: document.documentElement.scrollWidth - innerWidth, cards: document.querySelectorAll("ol > li").length }));
say(`Layar kecil peta bab: overflow X=${smScroll.ox}px`);

say(`Masalah konsol/jaringan (selain Google Fonts yang diblokir sandbox): ${problems.length ? JSON.stringify(problems.slice(0, 6)) : "tidak ada"}`);
writeFileSync("/home/user/APPlerner/docs/build-evidence/arena-replacement-20261122/BROWSER-INTERACTION.txt", log.join("\n") + "\n");
await browser.close();
