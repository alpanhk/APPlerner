"use client";

import { useEffect, useRef, useState } from "react";
import { api, device, type Profile, type ProfileData, type ProgressRow } from "@/lib/client";
import { stopSpeak } from "@/lib/media";
import { CHAPTER_BY_ID, CHAPTERS } from "@/story/chapters";
import type { Attempt, Game } from "@/story/types";
import Journey from "./Journey";
import Play from "./Play";
import Result from "./Result";
import Title from "./Title";

type Screen = { name: "loading" } | { name: "title" } | { name: "map" } | { name: "play"; chapterId: string; fresh: boolean; run: number } | { name: "result"; chapterId: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const [data, setData] = useState<ProfileData | null>(null);
  const [known, setKnown] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; g: Game } | null>(null);
  const runs = useRef(0);

  // Muat profil yang dikenal perangkat ini.
  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = device.ids();
      const loaded = await Promise.all(ids.map((id) => api.load(id).catch(() => null)));
      if (!alive) return;
      ids.forEach((id, i) => loaded[i] === null && device.forget(id));
      const ok = loaded.filter((x): x is ProfileData => x !== null);
      setKnown(ok.map((x) => x.profile));
      const active = ok.find((x) => x.profile.id === device.active());
      if (active) {
        setData(active);
        setScreen({ name: "map" });
      } else setScreen({ name: "title" });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const profileId = data?.profile.id;

  function push(g: Game) {
    if (!profileId) return;
    api
      .saveProgress(profileId, g)
      .then(() => setOffline(false))
      .catch(() => setOffline(true));
  }

  function flush() {
    if (!pending.current) return;
    clearTimeout(pending.current.timer);
    push(pending.current.g);
    pending.current = null;
  }

  function save(g: Game) {
    setData((d) => {
      if (!d) return d;
      const old = d.progress.find((r) => r.chapterId === g.chapterId);
      const row: ProgressRow = {
        chapterId: g.chapterId,
        status: g.done || old?.status === "selesai" ? "selesai" : "aktif",
        state: g.done ? null : g,
        notes: [...new Set([...(old?.notes ?? []), ...g.notes])],
      };
      return { ...d, progress: [...d.progress.filter((r) => r.chapterId !== g.chapterId), row] };
    });
    if (pending.current) clearTimeout(pending.current.timer);
    if (g.done) {
      pending.current = null;
      push(g);
    } else {
      pending.current = { g, timer: setTimeout(flush, 700) };
    }
  }

  function attempt(a: Attempt) {
    if (!profileId) return;
    setData((d) => (d ? { ...d, attempts: [...d.attempts, a] } : d));
    api.saveAttempt(profileId, a).catch(() => setOffline(true));
  }

  const play = (chapterId: string, fresh: boolean) => setScreen({ name: "play", chapterId, fresh, run: ++runs.current });

  async function create(name: string, avatar: string) {
    setBusy(true);
    setError(null);
    try {
      const { profile } = await api.create(name, avatar);
      device.add(profile.id);
      setKnown((k) => [...k, profile]);
      setData({ profile, progress: [], attempts: [] });
      play(CHAPTERS[0].id, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profil gagal dibuat.");
    } finally {
      setBusy(false);
    }
  }

  async function select(id: string) {
    setBusy(true);
    try {
      const d = await api.load(id);
      device.setActive(id);
      setData(d);
      setScreen({ name: "map" });
    } catch {
      setError("Profil tidak bisa dimuat. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.remove(id).catch(() => null);
    device.forget(id);
    setKnown((k) => k.filter((p) => p.id !== id));
  }

  function toMap() {
    flush();
    stopSpeak();
    setScreen({ name: "map" });
  }

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (screen.name === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink text-cream">
        <p className="font-display text-4xl font-semibold">Lernen</p>
      </main>
    );
  }

  if (screen.name === "title" || !data) {
    return <Title key={known.length} known={known} busy={busy} error={error} onCreate={create} onSelect={select} onDelete={remove} />;
  }

  const banner = offline && (
    <p role="status" className="fixed inset-x-0 bottom-0 z-[60] bg-terra px-4 py-2 text-center text-sm font-bold text-cream">
      Progres belum tersimpan ke server. Kami akan mencoba lagi pada langkah berikutnya.
    </p>
  );

  if (screen.name === "play") {
    const chapter = CHAPTER_BY_ID[screen.chapterId];
    const row = data.progress.find((r) => r.chapterId === chapter.id);
    const saved = !screen.fresh && row?.state && chapter.nodes[row.state.nodeId] ? row.state : null;
    return (
      <>
        <Play
          key={screen.run}
          chapter={chapter}
          name={data.profile.name}
          avatar={data.profile.avatar}
          initial={saved}
          notes={row?.notes ?? []}
          onSave={save}
          onAttempt={attempt}
          onExit={toMap}
          onDone={() => setScreen({ name: "result", chapterId: chapter.id })}
        />
        {banner}
      </>
    );
  }

  if (screen.name === "result") {
    const chapter = CHAPTER_BY_ID[screen.chapterId];
    const next = CHAPTERS[CHAPTERS.indexOf(chapter) + 1] ?? null;
    return (
      <>
        <Result
          chapter={chapter}
          nextChapter={next}
          name={data.profile.name}
          attempts={data.attempts}
          notes={data.progress.find((r) => r.chapterId === chapter.id)?.notes ?? []}
          onNext={() => next && play(next.id, true)}
          onMap={toMap}
          onReplay={() => play(chapter.id, true)}
        />
        {banner}
      </>
    );
  }

  return (
    <>
      <Journey
        data={data}
        onPlay={play}
        onLogout={() => {
          device.setActive(null);
          setData(null);
          setScreen({ name: "title" });
        }}
      />
      {banner}
    </>
  );
}
