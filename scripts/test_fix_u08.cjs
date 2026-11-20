// FIX-U08: bukti [P] pada navigation store nyata bahwa klik tab Jelajah dari
// tengah pelajaran (soal 4/4 rute lesson) mengganti route ke root Jelajah.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    assert.ok(Object.hasOwn(mocks, id), `dependency tak terduga ${id} di ${file}`);
    return mocks[id];
  }, mod, mod.exports);
  return mod.exports;
}

(async () => {
  const routes = load("src/klab/routes.ts", {});
  const klabNav = load("src/klab/navigation.ts", {
    "zustand/vanilla": require("zustand/vanilla"),
    "./routes": routes,
  });
  const legacy = {
    page: "hari-ini",
    listeners: new Set(),
    getState() { return { page: this.page }; },
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    setState(patch) { Object.assign(this, patch); this.listeners.forEach((fn) => fn(this.getState())); },
  };
  const appNav = load("src/app/navigation.ts", {
    "../klab/navigation": klabNav,
    "../klab/routes": routes,
    "../stores/nav": { useNav: legacy },
  });
  const nav = appNav.navigation;
  const lesson = { name: "lesson", unitNo: 11, lessonNo: 1, sessionId: "u11l1-s1" };

  // Python-free represetasi "soal 4 dari 4" tetap berada pada rute lesson yang sama.
  nav.getState().push(lesson);
  assert.equal(nav.getState().tab, "explore", "rute pelajaran memang termasuk tab explore");
  assert.deepEqual(nav.getState().route, lesson);

  // Handler yang sama dengan tombol Jelajah di Shell: onNavigate={selectTab}.
  nav.getState().selectTab("explore");
  assert.deepEqual(
    nav.getState().route,
    { name: "explore", section: "materials" },
    "FIX-U08: klik Jelajah mengganti route ke root Jelajah, bukan pelajaran",
  );
  assert.equal(nav.getState().tab, "explore");

  // Nav lain yang sudah benar tidak berubah.
  nav.getState().push(lesson);
  nav.getState().selectTab("today");
  assert.deepEqual(nav.getState().route, { name: "today" });
  nav.getState().push(lesson);
  nav.getState().selectTab("notes");
  assert.deepEqual(nav.getState().route, { name: "notes" });
  nav.getState().push(lesson);
  nav.getState().selectTab("profile");
  assert.deepEqual(nav.getState().route, { name: "profile", section: "overview" });

  // Klik Jelajah sekali lagi dari rute pelajaran harus tetap ke root (idempoten).
  nav.getState().push(lesson);
  nav.getState().selectTab("explore");
  assert.deepEqual(nav.getState().route, { name: "explore", section: "materials" });

  console.log("FIX-U08: klik Jelajah dari tengah pelajaran mengganti route ke root Jelajah; nav lain tidak berubah.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
