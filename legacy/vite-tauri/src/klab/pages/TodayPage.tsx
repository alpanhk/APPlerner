// UIUX-VISUAL-NOVEL-20261121 / 4a — Hari Ini memakai bahasa visual referensi.
// Satu tujuan + satu tombol; katalog unit/Drill/SRS tetap di Jelajah (1a).
import type { AgendaCardData, LoadState, QuickLinkData, UnitItemData } from './viewModels';
import Icon from '../Icon';
import { EmptyState, ErrorState, KButton, LoadingState, SegmentedProgress } from '../components/ui';
import { sampleVisuals } from '../sampleVisuals';
import { bgSrc } from '../components/visual';
import '../editorial.css';

export type TodayPageProps = {
  loadState: LoadState;
  agenda: AgendaCardData | null;
  quickLinks?: QuickLinkData[];
  progress?: { title: string; done: number; total: number; units: UnitItemData[] } | null;
  motivation?: string;
  secondaryAction?: { label: string; onClick: () => void };
  onOpenAgenda: () => void;
  onOpenQuickLink?: (id: string) => void;
  onOpenUnit: (unitNo: number) => void;
  onRetry: () => void;
};

export default function TodayPage({
  loadState, agenda, motivation, onOpenAgenda, onOpenUnit, onRetry,
}: TodayPageProps) {
  const { done, total } = agenda ?? {};
  const hasChapterProgress = typeof done === 'number' && typeof total === 'number' && total > 0;
  const chapterArt = agenda?.image || sampleVisuals['hari-ini'];

  return <div className="home editorial-today">
    {loadState === 'loading' && <LoadingState label="Menyiapkan Hari Ini..." />}
    {loadState === 'failed' && <ErrorState title="Hari Ini belum siap" message="Data belajar tidak dapat dimuat."
      detail="Periksa koneksi penyimpanan lokal, lalu coba lagi. Progres Anda tidak dihapus."
      onRetry={onRetry} />}

    {loadState === 'ready' && <>
      {agenda ? <section className="vn-title vn-fade">
        <img src={bgSrc('judul')} alt="" />
        <p className="vn-kicker">{agenda.eyebrow ?? 'A1 · Pelajaran 2'}</p>
        <h1>{agenda.title}</h1>
        <p>{agenda.subtitle}</p>
        <img className="vn-title-art" src={chapterArt} alt="" />
        {hasChapterProgress && <div className="editorial-chapter-progress">
          <SegmentedProgress done={done} total={total} variant="meter" />
        </div>}
        <div className="vn-title-actions">
          <KButton className="editorial-chapter-action" variant="primary" onClick={onOpenAgenda}>
            {agenda.actionLabel ?? (agenda.meta ? 'Lanjutkan belajar' : 'Mulai belajar')}<Icon name="arrow" />
          </KButton>
        </div>
      </section> : <EmptyState icon={<Icon name="today" />} title="Belum ada sesi lanjutan"
        description="Mulai dari Unit 1 untuk membangun progres pertama Anda."
        actionLabel="Mulai dari Unit 1" onAction={() => onOpenUnit(1)} />}

      {motivation && <p className="support-copy editorial-motivation vn-muted">{motivation}</p>}
    </>}
  </div>;
}
