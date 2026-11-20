// Data agenda dan aksi navigasi disediakan oleh composition root.
// RAK-DIALOG-20261120: satu tujuan + satu tombol utama. Katalog unit/Drill/SRS
// berada di Jelajah (1a sudah menyediakannya di sana).
import type { AgendaCardData, LoadState, QuickLinkData, UnitItemData } from './viewModels';
import Icon from '../Icon';
import { EmptyState, ErrorState, KButton, LoadingState, SegmentedProgress } from '../components/ui';
import { sampleVisuals } from '../sampleVisuals';
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
  // Sampel bab aktif dipakai bila adapter belum memberi gambar khusus.
  const chapterArt = agenda?.image || sampleVisuals['hari-ini'];

  return <div className="home editorial-today">
    <header className="editorial-page-header">
      <h1>Hari Ini</h1>
    </header>

    {loadState === 'loading' && <LoadingState label="Menyiapkan Hari Ini..." />}
    {loadState === 'failed' && <ErrorState title="Hari Ini belum siap" message="Data belajar tidak dapat dimuat."
      detail="Periksa koneksi penyimpanan lokal, lalu coba lagi. Progres Anda tidak dihapus."
      onRetry={onRetry} />}

    {loadState === 'ready' && <>
      {agenda ? <section className="editorial-chapter" data-has-art="true">
        <div className="editorial-chapter-copy">
          {agenda.eyebrow && <p className="editorial-kicker">{agenda.eyebrow}</p>}
          <h2>{agenda.title}</h2>
          {agenda.subtitle && <p className="editorial-chapter-subtitle">{agenda.subtitle}</p>}
          {agenda.meta && <p className="editorial-chapter-meta">{agenda.meta}</p>}
          {hasChapterProgress && <div className="editorial-chapter-progress">
            <SegmentedProgress done={done} total={total} variant="meter" />
          </div>}
        </div>
        <div className="editorial-chapter-art">
          <img src={chapterArt} alt="" decoding="async" fetchPriority="high" />
        </div>
        <KButton className="editorial-chapter-action" variant="primary" onClick={onOpenAgenda}>
          {agenda.actionLabel ?? (agenda.meta ? 'Lanjutkan belajar' : 'Mulai belajar')}<Icon name="arrow" />
        </KButton>
      </section> : <EmptyState icon={<Icon name="today" />} title="Belum ada sesi lanjutan"
        description="Mulai dari Unit 1 untuk membangun progres pertama Anda."
        actionLabel="Mulai dari Unit 1" onAction={() => onOpenUnit(1)} />}

      {motivation && <p className="support-copy editorial-motivation">{motivation}</p>}
    </>}
  </div>;
}
