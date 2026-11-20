// KONF-01 — StoryView milik 2a yang benar-benar merender mesin cerita.
// 1a tetap pemilik pendaftaran featureViews; file ini hanya komponen yang
// dapat diimpor/didaftarkan, bukan pengganti routeView/novelViews 1a.
import { useEffect, useState } from 'react';
import { novelStore, type NovelProgress as StoreProgress } from '../../app/novelProgress';
import { resolveMedia } from '../../app/mediaResolver';
import { PROLOG_START } from './story/prolog';
import { StoryFlow, type NovelStore, type NovelProgress, type StoryPanel } from './StoryFlow';
import type { PlayerProfile, Attempt, HistoryItem } from './story/types';
import { soundController } from './soundController';

export type StoryViewProps = {
  route?: { name?: string; panel?: StoryPanel; textId?: number };
  back?: () => void;
  navigate?: (route: { name: string; panel?: StoryPanel }) => void;
};

const adapter: NovelStore = {
  async loadProgress(): Promise<NovelProgress | null> {
    const value = await novelStore.loadProgress();
    if (!value) return null;
    return {
      player: value.player as PlayerProfile,
      nodeId: value.nodeId,
      flags: value.flags,
      hintCounts: value.hintCounts,
      attempts: value.attempts as Attempt[],
      history: value.history as HistoryItem[],
      updatedAt: value.updatedAt,
    };
  },
  async saveProgress(progress: NovelProgress): Promise<void> {
    const current = await novelStore.loadProgress();
    const payload: StoreProgress = {
      version: 1,
      player: progress.player as StoreProgress['player'],
      nodeId: progress.nodeId,
      stage: current?.stage ?? {
        bg: 'kamar', chars: [], overlay: null, ambience: 'none',
      },
      flags: progress.flags,
      hintCounts: progress.hintCounts,
      attempts: progress.attempts as StoreProgress['attempts'],
      history: progress.history as StoreProgress['history'],
      prologCompleted: current?.prologCompleted ?? false,
      updatedAt: progress.updatedAt,
    };
    await novelStore.saveProgress(payload);
  },
};

export function StoryView({ route, back }: StoryViewProps) {
  const [saved, setSaved] = useState<NovelProgress | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([novelStore.loadProgress(), novelStore.loadSettings()])
      .then(([progress, settings]) => {
        if (!active) return;
        if (progress) {
          setSaved({
            player: progress.player as PlayerProfile,
            nodeId: progress.nodeId,
            flags: progress.flags,
            hintCounts: progress.hintCounts,
            attempts: progress.attempts as Attempt[],
            history: progress.history as HistoryItem[],
            updatedAt: progress.updatedAt,
          });
        }
        // Suara default mati; hanya aktifkan bila pengguna menyimpan opt-in.
        soundController.setOptIn(Boolean(settings?.soundOn));
        setReady(true);
      })
      .catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  if (!ready) {
    return <section className="novel-story" data-testid="story-view"><p>Memuat cerita…</p></section>;
  }

  const initialNodeId = saved?.nodeId || PROLOG_START;
  return (
    <section className="novel-story" data-testid="story-view">
      <StoryFlow
        store={adapter}
        initialPlayer={saved?.player}
        initialNodeId={initialNodeId}
        route={route}
        panel={route?.panel}
        mediaSrc={(assetId) => {
          if (!assetId) return undefined;
          const id = assetId.startsWith('speech:') ? assetId.slice(7) : assetId;
          return resolveMedia('scene', id)?.src ?? resolveMedia('cover', id)?.src;
        }}
        onBack={back}
        onExit={back}
      />
    </section>
  );
}
