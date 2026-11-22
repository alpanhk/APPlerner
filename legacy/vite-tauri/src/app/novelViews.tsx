// ROMBAK UI/UX / 1a — tampilan DEFAULT untuk rute title/create/story.
// Dipakai sampai 4a/2a mendaftarkan komponen visual/engine lewat
// registerFeatureView(). Semua data berasal dari novelStore (SQLite) dan
// mediaResolver (manifest 96 hash); tidak ada angka/status fiktif.
import { useEffect, useRef, useState } from "react";
import type { ViewProps } from "./routeView";
import type { StoryPanel } from "../klab/routes";
import {
  novelStore, DEFAULT_NOVEL_PLAYER, DEFAULT_NOVEL_STAGE,
  type NovelProgress, type NovelSettings, type SavePhase,
} from "./novelProgress";
import { allCovers, bgSrc, coverSrc, sceneSrc } from "./mediaResolver";
// Node awal milik 2a (a_intro). Memakai konstanta engine, bukan literal, agar
// progres yang disimpan CreateView bisa dilanjutkan StoryFlow tanpa node invalid.
import { PROLOG_START } from "../klab/learning/story/prolog";

export const PANELS: ReadonlyArray<{ id: StoryPanel; label: string }> = [
  { id: "journal", label: "Jurnal" },
  { id: "library", label: "Perpustakaan" },
  { id: "history", label: "Riwayat" },
  { id: "settings", label: "Pengaturan" },
];

// Ingatan pemicu panel, mengikuti pola shelfReturn di routeView: fokus kembali
// ke tombol yang membuka panel, bukan ke elemen arbitrer.
let panelTrigger: string | null = null;

export function openPanel(navigate: ViewProps["navigate"], id: StoryPanel, triggerId: string) {
  panelTrigger = triggerId;
  navigate({ name: "story", panel: id });
}

function closePanel(navigate: ViewProps["navigate"]) {
  navigate({ name: "story" });
}

function usePanelFocus(panel: StoryPanel | undefined, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('[data-testid="novel-panel"] h2');
      heading?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [panel, open]);

  useEffect(() => {
    if (open || !panelTrigger) return;
    const triggerId = panelTrigger;
    panelTrigger = null;
    const frame = requestAnimationFrame(() => {
      const trigger = document.querySelector<HTMLElement>(`[data-testid="${triggerId}"]`);
      trigger?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);
}

function loadState<T>(setter: (value: T | null) => void, failed: () => void, loader: () => Promise<T | null>) {
  let active = true;
  void loader()
    .then((value) => { if (active) setter(value); })
    .catch(() => { if (active) failed(); });
  return () => { active = false; };
}

export function TitleView({ navigate }: ViewProps) {
  const [saved, setSaved] = useState<NovelProgress | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "failed">("loading");
  const launching = useRef(false);
  useEffect(() => loadState(
    (value) => { setSaved(value); setPhase("ready"); },
    () => setPhase("failed"),
    () => novelStore.loadProgress(),
  ), []);
  const launch = () => {
    if (launching.current) return; // anti klik ganda
    launching.current = true;
    navigate({ name: "story" });
  };
  return <section className="klab-stack" data-testid="novel-title">
    <h1 tabIndex={-1} data-testid="story-title">Lernen · Cerita</h1>
    <p className="klab-muted">Belajar bahasa Jerman lewat percakapan bergambar. Progres tersimpan di perangkatmu.</p>
    <img src={bgSrc("judul")} alt="Panorama kota sebagai latar layar judul" className="novel-bg" />
    <div className="klab-stack" role="group" aria-label="Awal cerita">
      <button type="button" className="klab-button" data-testid="novel-new" onClick={() => navigate({ name: "create" })}>
        Cerita baru
      </button>
      <button type="button" className="klab-button" data-testid="novel-continue" disabled={!saved} onClick={launch}>
        {phase === "loading" ? "Memuat progres…" : saved ? `Lanjutkan · ${saved.player.name}` : "Belum ada progres"}
      </button>
      {phase === "failed" && <p role="alert" data-testid="novel-title-error">Progres tidak dapat dibaca. Kamu tetap bisa memulai cerita baru.</p>}
      <button type="button" className="klab-button" data-testid="novel-title-library"
        onClick={() => openPanel(navigate, "library", "novel-title-library")}>Perpustakaan</button>
      <button type="button" className="klab-button" data-testid="novel-title-settings"
        onClick={() => openPanel(navigate, "settings", "novel-title-settings")}>Pengaturan</button>
      <button type="button" className="klab-button" data-testid="novel-title-home" onClick={() => navigate({ name: "today" })}>
        Kembali ke Hari Ini
      </button>
    </div>
    <StoryPanels routePanel={undefined} navigate={navigate} saved={saved} />
  </section>;
}

export function CreateView({ navigate }: ViewProps) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<SavePhase>("idle");
  const saving = useRef(false);
  const start = async () => {
    if (saving.current || !name.trim()) return; // anti klik ganda & jawaban kosong
    saving.current = true;
    setPhase("saving");
    try {
      await novelStore.saveProgress({
        version: 1,
        player: { ...DEFAULT_NOVEL_PLAYER, name: name.trim() },
        nodeId: PROLOG_START,
        stage: DEFAULT_NOVEL_STAGE,
        flags: {}, hintCounts: {}, attempts: [], history: [],
        prologCompleted: false, updatedAt: Date.now(),
      });
      setPhase("saved");
      navigate({ name: "story" });
    } catch {
      setPhase("failed"); // status gagal nyata, pengguna boleh mengulang
      saving.current = false;
    }
  };
  return <section className="klab-stack" data-testid="novel-create">
    <h1 tabIndex={-1}>Buat tokohmu</h1>
    <label htmlFor="novel-name">Nama panggilan</label>
    <input id="novel-name" data-testid="novel-name" value={name} maxLength={24}
      onChange={(event) => { setName(event.target.value); if (phase === "failed") setPhase("idle"); }} />
    <button type="button" className="klab-button" data-testid="novel-create-start" disabled={!name.trim() || phase === "saving"}
      onClick={() => { void start(); }}>
      {phase === "saving" ? "Menyimpan…" : "Mulai cerita"}
    </button>
    {phase === "failed" && <p role="alert" data-testid="novel-create-error">Gagal menyimpan. Periksa penyimpanan, lalu coba lagi.</p>}
    <button type="button" className="klab-button" data-testid="novel-create-back" onClick={() => navigate({ name: "title" })}>Kembali</button>
  </section>;
}

export function StoryPanels({ routePanel, navigate, saved }: {
  routePanel: StoryPanel | undefined;
  navigate: ViewProps["navigate"];
  saved: NovelProgress | null;
}) {
  const open = Boolean(routePanel);
  // Semua hook dipanggil sebelum return agar urutan hook stabil saat panel
  // dibuka/ditutup (RouteView me-render komponen ini terus, hanya routePanel
  // yang berubah).
  usePanelFocus(routePanel, open);
  const [settings, setSettings] = useState<NovelSettings | null>(null);
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const writing = useRef(false);
  // State panel sengaja dibuat lokal per panel; efek di bawah memuat data nyata.
  useEffect(() => {
    if (!routePanel) return;
    let active = true;
    void novelStore.loadSettings().then((value) => { if (active) setSettings(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [routePanel]);
  if (!routePanel) return null;
  const changeSetting = async (change: Partial<NovelSettings>) => {
    if (writing.current || !settings) return;
    writing.current = true;
    setSavePhase("saving");
    try {
      await novelStore.saveSettings({ ...settings, ...change });
      setSettings(await novelStore.loadSettings());
      setSavePhase("saved");
    } catch { setSavePhase("failed"); }
    finally { writing.current = false; }
  };
  return <section className="klab-panel" data-testid="novel-panel" role="dialog" aria-modal="true" aria-label="Panel cerita">
    <h2 tabIndex={-1}>{PANELS.find((item) => item.id === routePanel)?.label ?? "Panel"}</h2>
    {routePanel === "journal" && (saved?.attempts.length
      ? <ul>{saved.attempts.map((attempt, index) => <li key={`${attempt.at}-${index}`}>{attempt.text} · {attempt.objective}</li>)}</ul>
      : <p>Belum ada jawaban yang tercatat.</p>)}
    {routePanel === "history" && (saved?.history.length
      ? <ul>{saved.history.map((item, index) => <li key={`${item.speaker}-${index}`}><b>{item.speaker}:</b> {item.text}</li>)}</ul>
      : <p>Riwayat percakapan masih kosong.</p>)}
    {routePanel === "library" && <ul className="novel-library">
      {allCovers().map((cover) => <li key={cover.textId} data-text-id={cover.textId} data-title={cover.title} data-src={cover.src}>
        <img src={cover.src} alt={cover.title} loading="lazy" /> <span>{cover.title}</span>
      </li>)}
    </ul>}
    {routePanel === "settings" && settings && <div className="klab-stack">
      <label><input type="checkbox" data-testid="novel-sound" checked={settings.soundOn}
        onChange={(event) => { void changeSetting({ soundOn: event.target.checked }); }} /> Suara aktif</label>
      <label><input type="checkbox" data-testid="novel-motion" checked={settings.reducedMotion}
        onChange={(event) => { void changeSetting({ reducedMotion: event.target.checked }); }} /> Kurangi gerakan</label>
      {savePhase !== "idle" && <p role="status" data-testid="novel-settings-status">
        {savePhase === "saving" ? "Menyimpan…" : savePhase === "saved" ? "Tersimpan" : "Gagal menyimpan — coba lagi"}
      </p>}
    </div>}
    <button type="button" className="klab-button" data-testid="novel-panel-close" onClick={() => closePanel(navigate)}>Tutup</button>
  </section>;
}

export function StoryView({ route, navigate, back }: ViewProps) {
  const panel = route.name === "story" ? route.panel : undefined;
  const [saved, setSaved] = useState<NovelProgress | null>(null);
  useEffect(() => loadState(setSaved, () => setSaved(null), () => novelStore.loadProgress()), []);
  const name = saved?.player.name ?? "";
  const bg = bgSrc(saved?.stage.bg ?? "kamar") ?? bgSrc("kamar");
  const scene = sceneSrc(1);
  return <section className="klab-stack" data-testid="novel-story">
    <h1 tabIndex={-1}>Cerita{name ? ` · ${name}` : ""}</h1>
    <header className="novel-topbar" role="toolbar" aria-label="Panel cerita">
      {PANELS.map((item) => <button key={item.id} type="button" className="klab-button"
        data-testid={`novel-panel-${item.id}`} aria-expanded={panel === item.id}
        onClick={() => openPanel(navigate, item.id, `novel-panel-${item.id}`)}>{item.label}</button>)}
      <button type="button" className="klab-button" data-testid="novel-story-title"
        onClick={() => navigate({ name: "title" })}>Judul</button>
    </header>
    <div className="novel-stage" data-testid="novel-stage" data-bg={bg} data-scene={scene}>
      {bg && <img src={bg} alt="Latar adegan" />}
      {scene && <img src={scene} alt="Ilustrasi adegan unit 1" />}
      {coverSrc(10) && <img src={coverSrc(10)} alt="Sampul Im Café" />}
    </div>
    <p data-testid="novel-dialogue">
      {saved?.prologCompleted ? "Prolog selesai. Pilih panel untuk meninjau progresmu." : "Prolog dimulai. Jawaban dan koreksi ditampilkan di sini oleh mesin cerita."}
    </p>
    {!panel && <button type="button" className="klab-button" data-testid="novel-story-back" onClick={back}>Kembali</button>}
    <StoryPanels routePanel={panel} navigate={navigate} saved={saved} />
  </section>;
}
