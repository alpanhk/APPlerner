// Profil - production presentational page (Agent 4a).
// Preferences/statistics are supplied by 1a; no XP or pass counts computed here.
import type { LoadState, PreferencesView, ProfileSection, StatsSummary } from './viewModels';
import Icon from '../Icon';
import { EmptyState, ErrorState, LoadingState, RowLink, Tabs, KButton } from '../components/ui';
import { sampleVisuals } from '../sampleVisuals';

export type ProfilePageProps = {
  section: ProfileSection;
  loadState: LoadState;
  preferences?: PreferencesView;
  stats?: StatsSummary;
  onSectionChange: (section: ProfileSection) => void;
  onPreferenceChange?: (change: Partial<PreferencesView>) => void;
  onOpenRecovery?: () => void;
  onOpenLegacyTool?: (id: string) => void;
  onRetry: () => void;
};

const SECTIONS: ReadonlyArray<{ id: ProfileSection; label: string }> = [
  { id: 'overview', label: 'Ringkasan' },
  { id: 'stats', label: 'Statistik' },
  { id: 'settings', label: 'Pengaturan' },
  { id: 'recordings', label: 'Rekaman' },
  { id: 'recovery', label: 'Pemulihan' },
  { id: 'legacy-tools', label: 'Peralatan lama' },
];

function ChoiceRow({
  label, options, value, onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="klab-field" style={{ marginTop: 12 }}>
    <span>{label}</span>
    <div className="actions" role="group" aria-label={label}>
      {options.map(option => <KButton key={option.value} variant="secondary"
        aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</KButton>)}
    </div>
  </div>;
}

export default function ProfilePage({
  section, loadState, preferences, stats, onSectionChange,
  onPreferenceChange, onOpenRecovery, onOpenLegacyTool, onRetry,
}: ProfilePageProps) {
  return <div className="shelf">
    <h1>Profil</h1>
    <Tabs items={SECTIONS} active={section} onChange={id => onSectionChange(id as ProfileSection)} label="Bagian profil" />

    {loadState === 'loading' && <LoadingState label="Memuat profil..." />}
    {loadState === 'failed' && <ErrorState title="Profil belum siap" message="Data profil tidak dapat dimuat."
      onRetry={onRetry} />}

    {loadState === 'ready' && section === 'overview' && <section className="panel">
      <h2>Ringkasan belajar</h2>
      <p className="muted">Lihat statistik, pengaturan, dan pemulihan data dari satu tempat.</p>
      <div className="profile-overview-visual">
        <img src={sampleVisuals.profil} alt="" decoding="async" />
      </div>
      <div className="profile-section-list">
        <RowLink icon="profile" onClick={() => onSectionChange('stats')}>Statistik</RowLink>
        <RowLink icon="today" onClick={() => onSectionChange('settings')}>Pengaturan</RowLink>
        <RowLink icon="notes" onClick={() => onSectionChange('recordings')}>Rekaman saya</RowLink>
        <RowLink icon="book" onClick={() => onSectionChange('recovery')}>Backup & Pemulihan data</RowLink>
      </div>
    </section>}

    {loadState === 'ready' && section === 'stats' && (
      stats ? <section className="panel">
        <h2>Statistik</h2>
        <div className="profile-grid">
          {stats.cardsReviewed !== undefined && <div className="profile-stat"><strong>{stats.cardsReviewed}</strong><span>Kartu diulang</span></div>}
          {stats.lessonsCompleted !== undefined && <div className="profile-stat"><strong>{stats.lessonsCompleted}</strong><span>Pelajaran selesai</span></div>}
          {stats.wordsKnown !== undefined && <div className="profile-stat"><strong>{stats.wordsKnown}</strong><span>Kata dikenal</span></div>}
          {stats.streakDays !== undefined && <div className="profile-stat"><strong>{stats.streakDays}</strong><span>Hari berurutan</span></div>}
        </div>
        {stats.note && <p className="muted" style={{ marginTop: 12 }}>{stats.note}</p>}
        {stats.nextSteps && stats.nextSteps.length > 0 && <div className="next-step-list">
          <h3>Langkah berikutnya</h3>
          {stats.nextSteps.map(step => <div className="next-step-item" key={step.id}>
            <strong>{step.label}</strong>
            <span className="muted">{step.detail}</span>
          </div>)}
          <p className="muted">Tindakan dari data aplikasi, bukan penilaian kemampuan.</p>
        </div>}
        <p className="muted" style={{ marginTop: 12 }}>Angka di atas berasal dari data tersimpan; riwayat lama tidak diubah menjadi jumlah pasti.</p>
      </section> : <EmptyState icon={<Icon name="profile" />} title="Belum ada statistik" description="Data statistik akan muncul setelah ada aktivitas belajar." />
    )}

    {loadState === 'ready' && section === 'settings' && (
      preferences && onPreferenceChange ? <section className="panel">
        <h2>Pengaturan tampilan</h2>
        <ChoiceRow label="Tema" value={preferences.theme}
          options={[{ value: 'system', label: 'Sistem' }, { value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }]}
          onChange={value => onPreferenceChange({ theme: value as PreferencesView['theme'] })} />
        <ChoiceRow label="Cara belajar" value={preferences.learningMode}
          options={[{ value: 'ordered', label: 'Terurut' }, { value: 'free', label: 'Bebas' }]}
          onChange={value => onPreferenceChange({ learningMode: value as PreferencesView['learningMode'] })} />
        <ChoiceRow label="Ukuran teks" value={String(preferences.textScale)}
          options={[{ value: '1', label: 'Sedang' }, { value: '1.125', label: 'Besar' }, { value: '1.25', label: 'Lebih besar' }]}
          onChange={value => onPreferenceChange({ textScale: Number(value) as PreferencesView['textScale'] })} />
        <ChoiceRow label="Geriakan" value={preferences.reactions ? 'on' : 'off'}
          options={[{ value: 'on', label: 'Aktif' }, { value: 'off', label: 'Matikan' }]}
          onChange={value => onPreferenceChange({ reactions: value === 'on' })} />
        <p className="muted" style={{ marginTop: 12 }}>Perubahan ditampilkan segera; status tersimpan mengikuti konfirmasi penyimpanan dari aplikasi.</p>
      </section> : <EmptyState icon={<Icon name="profile" />} title="Pengaturan belum tersedia" description="Preferensi belum dapat dimuat dari penyimpanan." />
    )}

    {loadState === 'ready' && section === 'recordings' && <EmptyState
      icon={<Icon name="play" />} title="Belum ada rekaman"
      description="Rekaman pelafalan akan tampil di sini. Izin mikrofon tidak diperlukan untuk belajar." />}

    {loadState === 'ready' && section === 'recovery' && <section className="panel">
      <h2>Backup & Pemulihan data</h2>
      <p className="muted">Cadangkan atau pulihkan data lokal. Mekanisme lama tetap dapat diakses untuk kompatibilitas Windows.</p>
      <div className="actions"><KButton variant="primary" onClick={onOpenRecovery}>Buka pemulihan</KButton></div>
    </section>}

    {loadState === 'ready' && section === 'legacy-tools' && <section className="panel">
      <h2>Peralatan lama</h2>
      <p className="muted">Impor/ekspor dan alat diagnostik lama tetap tersedia selama masa transisi.</p>
      <div className="profile-section-list">
        {['impor', 'ekspor', 'diagnostik'].map(id => <RowLink key={id} icon="notes"
          onClick={() => onOpenLegacyTool?.(id)}>{id.charAt(0).toUpperCase() + id.slice(1)}</RowLink>)}
      </div>
    </section>}
  </div>;
}
