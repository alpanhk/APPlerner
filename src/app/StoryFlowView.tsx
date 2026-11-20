// ROMBAK UI/UX / KONF-01 / 1a — host rute `story`.
// Komponen cerita nyata adalah `StoryView` milik 2a (src/klab/learning), yang
// merender StoryFlow + adapter SQLite + PROLOG_START. 1a tetap memegang
// registerFeatureView dan merangkai panel + fokus balik yang sudah lolos N3.
// Tidak menyunting file 2a.
import { useEffect, useState, type ComponentType } from "react";
import type { ViewProps } from "./routeView";
import { StoryView as StoryView2a } from "../klab/learning";
import type { StoryViewProps } from "../klab/learning/StoryView";
import { novelStore, type NovelProgress } from "./novelProgress";
import { PANELS, openPanel, StoryPanels } from "./novelViews";

export default function StoryFlowView({
  route, navigate, back, storyView: Story = StoryView2a,
}: ViewProps & { storyView?: ComponentType<StoryViewProps> }) {
  const panel = route.name === "story" ? route.panel : undefined;
  const [saved, setSaved] = useState<NovelProgress | null>(null);
  useEffect(() => {
    let active = true;
    void novelStore.loadProgress()
      .then((value) => { if (active) setSaved(value); })
      .catch(() => { if (active) setSaved(null); });
    return () => { active = false; };
  }, [panel]);

  return (
    <section className="klab-stack" data-testid="novel-story-host">
      <header className="novel-topbar" role="toolbar" aria-label="Panel cerita">
        {PANELS.map((item) => (
          <button key={item.id} type="button" className="klab-button"
            data-testid={`novel-panel-${item.id}`} aria-expanded={panel === item.id}
            onClick={() => openPanel(navigate, item.id, `novel-panel-${item.id}`)}>
            {item.label}
          </button>
        ))}
        <button type="button" className="klab-button" data-testid="novel-story-title"
          onClick={() => navigate({ name: "title" })}>Judul</button>
      </header>
      <Story route={route} back={back} />
      <StoryPanels routePanel={panel} navigate={navigate} saved={saved} />
    </section>
  );
}
