import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { loadVoicePreference, ttsReadyAsync } from "./srs/tts";
import initDatabase from "./data/seedLoader";
import { PAGE_COMPONENTS } from "./ui/pages";
import { maybeAutoBackup } from "./stores/backup";
import { startStudyClock } from "./stats/studyClock";
import FatalDatabase from "./ui/FatalDatabase";
import Shell from "./klab/Shell";
import type { Route, Tab } from "./klab/routes";
import { initializeDatabase, type DbState } from "./app/bootstrap";
import { installNavBridge, loadLastRoute, navigation } from "./app/navigation";
import { loadContinueTargets, type ContinueTarget } from "./app/sessionRegistry";
import { loadPreferences, patchPreferences, effectiveTheme } from "./app/preferencesRepository";
import type { Preferences } from "./klab/contracts";
import { RouteView } from "./app/routeView";
import CoverIndex from "./app/CoverIndex";
import { effectiveReducedMotion, loadUiSettings } from "./app/uiSettings";
import "./App.css";
import "./klab/tokens.css";
import { friendlyErrorMessage } from "./klab/errorMessage";

// PILOT-AGENT-1: novel visual (src/klab/novel) adalah entry utama; aplikasi
// KLAB lama tetap dapat dibuka lewat NovelRoot ("Materi A1-B2") dan tetap
// dikompilasi utuh. Kontrak DesktopEntry (import default) dipertahankan.
export function LegacyApp() {
  const route = useStore(navigation, (state) => state.route);
  const [dbState, setDbState] = useState<DbState>("loading");
  const [dbMessage, setDbMessage] = useState("");
  const [audioError, setAudioError] = useState("");
  const [backupError, setBackupError] = useState("");
  const [setupAudio, setSetupAudio] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const [preferences, setPreferences] = useState<Preferences | undefined>(undefined);
  const [targets, setTargets] = useState<ContinueTarget[]>([]);
  const refreshTargets = () => {
    void loadContinueTargets().then(setTargets).catch(() => undefined);
  };

  // Rute/back KLAB adalah sumber navigasi; jembatan menjaga useNav lama tetap
  // konsisten untuk halaman yang belum dimigrasi.
  useEffect(() => installNavBridge(), []);

  useEffect(() => dbState === "ready" ? startStudyClock() : undefined, [dbState]);
  useEffect(() => {
    if (dbState !== "ready") return;
    let active = true;
    void loadVoicePreference().then(ttsReadyAsync).then((ready) => {
      if (active && localStorage.getItem("lernen_audio_onboarding_done") !== "1") setSetupAudio(!ready);
    });
    return () => { active = false; };
  }, [dbState]);
  useEffect(() => {
    if (dbState !== "ready") return;
    let active = true;
    void loadContinueTargets().then((found) => { if (active) setTargets(found); }).catch(() => undefined);
    // Preferensi dan rute terakhir dipulihkan dari config saat startup.
    void loadPreferences().then((saved) => {
      if (!active) return;
      setPreferences(saved);
      const systemDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(effectiveTheme(saved, systemDark));
    }).catch(() => undefined);
    void loadLastRoute().then((route) => {
      if (active && route) navigation.getState().replace(route);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [dbState]);

  const changePreference = (change: Partial<Omit<Preferences, "version">>) => {
    void patchPreferences(change).then((saved) => {
      setPreferences(saved);
      const systemDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(effectiveTheme(saved, systemDark));
    }).catch(() => undefined);
  };
  useEffect(() => {
    const onAudioError = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      setAudioError(detail || "Audio untuk teks ini tidak tersedia. Pasang Piper untuk mendengar teks bebas.");
    };
    window.addEventListener("lernen-audio-error", onAudioError);
    return () => window.removeEventListener("lernen-audio-error", onAudioError);
  }, []);

  // M0: init DB (migrasi Rust) + seed idempotent + integrity check dipertahankan.
  useEffect(() => {
    let alive = true;
    initializeDatabase(initDatabase)
      .then((msg: string) => {
        if (!alive) return;
        setDbState("ready");
        setDbMessage(msg);
        void maybeAutoBackup().catch((e) => {
          // FIX-U03: kegagalan backup otomatis dilaporkan lewat banner ramah,
          // bukan console.error (I6 menghitung error konsol).
          console.warn("auto backup tertunda:", e);
          if (alive) setBackupError(friendlyErrorMessage(e, "backup"));
        });
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!alive) return;
        setDbState("error");
        setDbMessage(friendlyErrorMessage(err, "database"));
      });
    return () => { alive = false; };
  }, []);

  // Desktop Alt+Left memakai back yang sama dengan tombol ruang belajar.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" || !event.altKey || event.defaultPrevented) return;
      if (navigation.getState().back()) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // INTERAKSI-LERNEN-01: gerakan dikurangi aplikasi = prefers-reduced-motion OS.
  useEffect(() => {
    let alive = true;
    const apply = () => {
      const query = typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
      void loadUiSettings().then((settings) => {
        if (!alive) return;
        document.documentElement.dataset.reducedMotion =
          effectiveReducedMotion(settings, query) ? "on" : "off";
      }).catch(() => undefined);
    };
    apply();
    return () => { alive = false; };
  }, [dbState]);

  // Fokus judul baru saat konteks berpindah; jangan mencuri fokus dialog media.
  useEffect(() => {
    if (dbState !== "ready") return;
    if (document.querySelector('[data-testid="cafe-dialog"][open]')) return;
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("#klab-content h1, #klab-content h2");
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [route.name, route.name === "explore" ? route.section : "", dbState]);

  if (dbState === "error") return <FatalDatabase message={dbMessage} />;

  const navigate = (next: Route) => navigation.getState().push(next);
  const back = () => { navigation.getState().back(); };
  const selectTab = (tab: Tab) => navigation.getState().selectTab(tab);
  // PORT-EDITORIAL: satu sesi fokus U4 L2 tidak menampilkan tombol kembali
  // generik/banner onboarding; navigasi tetap lewat Shell dan tombol sesi.
  const focusedLesson = route.name === "lesson" && route.unitNo === 4 && route.lessonNo === 2;

  return (
    <Shell
      route={route}
      onNavigate={selectTab}
      theme={theme}
      onThemeChange={() => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        changePreference({ theme: next });
      }}
      notice={dbState === "loading" ? "Menyiapkan data…" : "Belajar di perangkatmu"}
    >
      {audioError && <div role="alert" className="mb-4 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Audio tidak dapat diputar: {audioError}{" "}
        <button className="underline" onClick={() => { setAudioError(""); navigate({ name: "profile", section: "settings" }); }}>Buka Pengaturan</button>{" · "}
        <button className="underline" onClick={() => setAudioError("")}>Tutup</button>
      </div>}
      {backupError && <div role="alert" className="mb-4 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
        Backup otomatis gagal: {backupError}{" "}
        <button className="underline" onClick={() => { setBackupError(""); navigate({ name: "profile", section: "recovery" }); }}>Periksa backup</button>{" · "}
        <button className="underline" onClick={() => setBackupError("")}>Tutup</button>
      </div>}
      {setupAudio && route.name === "profile" && route.section === "overview" &&
        <div className="mb-4 rounded border border-gold bg-cream p-4 text-sm">
        <b>Siapkan audio bahasa Jerman.</b> Klip bawaan sudah mencakup materi A1 inti. Untuk teks bebas A2-B2, siapkan Piper saat terhubung internet.
        <div className="mt-2 flex gap-3">
          <button className="btn-gold" onClick={() => { setSetupAudio(false); localStorage.setItem("lernen_audio_onboarding_done", "1"); navigate({ name: "profile", section: "settings" }); }}>Siapkan suara</button>
          <button className="underline" onClick={() => { setSetupAudio(false); localStorage.setItem("lernen_audio_onboarding_done", "1"); }}>Lanjut tanpa suara</button>
        </div>
      </div>}
      {!focusedLesson && route.name !== "reader" && route.name !== "today" && route.name !== "explore" &&
        route.name !== "notes" && route.name !== "profile" && (
        <button type="button" className="klab-back" onClick={back}>← Kembali</button>
      )}
      {dbState === "ready" && <CoverIndex />}
      {dbState === "ready"
        ? <RouteView
            route={route}
            navigate={navigate}
            back={back}
            targets={targets}
            legacyPages={PAGE_COMPONENTS}
            refreshTargets={refreshTargets}
            preferences={preferences}
            onPreferenceChange={changePreference}
          />
        : <div>Menyiapkan aplikasi…</div>}
    </Shell>
  );
}

// Kontrak lama: DesktopEntry.tsx memakai import default.
export default LegacyApp;
