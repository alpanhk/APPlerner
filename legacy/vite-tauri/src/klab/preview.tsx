// Isolated preview composition for the KLAB production visual system (4a).
// Fixtures only; no database, native bridge, browser storage or real learner data.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { useStore } from 'zustand';
import { createNavigation } from './navigation';
import type { Route } from './routes';
import type { SaveState } from './contracts';
import Shell from './Shell';
import Icon from './Icon';
import { assets } from './assets';
import { AudioButton, ComicPanel, Feedback, FocusHeader, SessionCard } from './components/session';
import { BookPreview, Reader } from './components/book';
import { SegmentedProgress } from './components/ui';
import TodayPage from './pages/TodayPage';
import ExplorePage from './pages/ExplorePage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import type { ExploreSection, NoteItemData, PreferencesView, ProfileSection } from './pages/viewModels';
import './tokens.css';

const navigation = createNavigation();
const lesson: Route = { name: 'lesson', unitNo: 4, lessonNo: 2, sessionId: 'preview-u4' };
const units = ['Salam & perkenalan diri', 'Angka, waktu, harga', 'Keluarga & hubungan', 'Makanan & minuman']
  .map((title, index) => ({ unitNo: index + 1, title, meta: 'A1', level: 'A1' as const, status: (index < 3 ? 'done' : 'active') as 'done' | 'active' }));
const books = [{ id: 'im-cafe', title: 'Im Café', meta: 'A1 · 6 kalimat', label: 'A1 · Restoran', image: assets.sampulImCafe, lead: 'Ich möchte einen Kaffee, bitte.' }];
// Preview-only stress fixtures: expose the full legacy asset counts without touching
// production data. Level distribution follows UNITS_ALL (A1 1-12, A2 101-110, ...).
const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
const FULL_UNIT_NOS = [
  ...Array.from({ length: 12 }, (_, i) => i + 1),
  ...Array.from({ length: 10 }, (_, i) => 101 + i),
  ...Array.from({ length: 10 }, (_, i) => 201 + i),
  ...Array.from({ length: 10 }, (_, i) => 301 + i),
];
const levelFor = (index: number) => LEVELS[Math.min(3, Math.floor(index / 12))] ?? 'A1';
const fullUnits = FULL_UNIT_NOS.map((unitNo, i) => ({
  unitNo, title: `Unit ${unitNo}`, meta: levelFor(i), level: levelFor(i), status: 'available' as const,
}));
const fullBooks = Array.from({ length: 67 }, (_, i) => ({
  id: `text-${i + 1}`,
  title: i === 0 ? 'Im Café' : `Bacaan ${i + 1}`,
  meta: `${levelFor(i)} · teks`,
  label: `${levelFor(i)} · Bacaan`,
  image: assets.sampulImCafe,
  lead: i === 0 ? 'Ich möchte einen Kaffee, bitte.' : `Kalimat pembuka ${i + 1}`,
}));
const fullVocabulary = Array.from({ length: 2134 }, (_, i) => ({
  word: `Wort ${i + 1}`,
  translation: `Kata ${i + 1}`,
  due: i % 7 === 0 ? 1 : undefined,
  level: levelFor(Math.floor(i / 534)),
}));

const fixtureNotes: NoteItemData[] = [
  { id: 'n1', title: 'Pola memesan', body: 'Ich möchte + objek. Untuk der Tee: einen Tee.', updatedAt: 'contoh', sourceLabel: 'A1 · Unit 4 · Materi 2' },
];

function Preview() {
  const route = useStore(navigation, state => state.route);
  const push = useStore(navigation, state => state.push);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [note] = useState(fixtureNotes[0]);
  const [draft, setDraft] = useState({ title: note.title, body: note.body, saveState: 'clean' as SaveState });
  const [failSave, setFailSave] = useState(false);
  const [fullLoad, setFullLoad] = useState(false);
  const [exploreSection, setExploreSection] = useState<ExploreSection>('materials');
  const [profileSection, setProfileSection] = useState<ProfileSection>('overview');
  const [preferences, setPreferences] = useState<PreferencesView>({
    theme: 'system', learningMode: 'ordered', textScale: 1, reducedMotion: 'system',
    reactions: true, reactionSound: false, reactionVolume: 0.3, quietMode: false, onboardingCompleted: true,
  });
  const [exampleOpen, setExampleOpen] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');

  const back = () => { if (!navigation.getState().back()) navigation.getState().selectTab('today'); };
  const navigate = (tab: 'today' | 'explore' | 'notes' | 'profile') => { setFailSave(false); navigation.getState().selectTab(tab); };

  let content: ReactNode;
  if (route.name === 'today') {
    content = <TodayPage loadState="ready"
      agenda={{ eyebrow: 'A1 · Unit 4 · Pelajaran 2', title: 'Siap lanjut?', subtitle: 'Memesan dengan sopan · Materi 1 dari 4', actionLabel: 'Lanjutkan memesan minuman', ribbon: '04', done: 1, total: 4 }}
      quickLinks={[
        { id: 'remedial', label: 'Perbaiki 3 kesalahan', icon: 'notes' },
        { id: 'srs', label: 'Ulangi kosakata (SRS)', icon: 'book', meta: '12 siap diulang' },
      ]}
      progress={{ title: 'Buku belajarku', done: 3, total: 12, units }}
      motivation="Belajar sedikit setiap hari lebih efektif daripada sekali saja."
      secondaryAction={{ label: 'Coba alur koreksi', onClick: () => push({ name: 'checkpoint', unitNo: 4, sessionId: 'preview-result' }) }}
      onOpenAgenda={() => push(lesson)}
      onOpenQuickLink={id => push(id === 'remedial' ? { name: 'checkpoint', unitNo: 4, sessionId: 'preview-result' } : { name: 'srs', sessionId: 'preview-srs' })}
      onOpenUnit={unitNo => push({ name: 'unit', unitNo })}
      onRetry={() => undefined} />;
  } else if (route.name === 'explore') {
    content = <ExplorePage section={exploreSection} loadState="ready"
      units={fullLoad ? fullUnits : units} books={fullLoad ? fullBooks : books}
      vocabulary={fullLoad ? fullVocabulary : [
        { word: 'der Kaffee', translation: 'kopi', due: 4, level: 'A1' as const },
        { word: 'der Tee', translation: 'teh', due: 2, level: 'A1' as const },
        { word: 'die Rechnung', translation: 'bon', level: 'A1' as const },
      ]}
      practiceLinks={[
        { id: 'listening', label: 'Mendengar' }, { id: 'writing', label: 'Menulis' },
        { id: 'conversation', label: 'Percakapan bercabang' }, { id: 'drills', label: 'Drill D1-D10' },
        { id: 'exam', label: 'Uji Tiruan A1' },
      ]}
      onSectionChange={setExploreSection}
      onOpenSrs={() => push({ name: 'srs', sessionId: 'preview-srs' })}
      onOpenUnit={unitNo => push({ name: 'unit', unitNo })}
      onOpenBook={(id, mode) => push(mode === 'read' ? { name: 'reader', textId: 92 } : { name: 'practice', kind: 'listening', contentId: id, sessionId: 'preview-listen' })}
      onOpenPractice={id => push(id === 'drills' ? { name: 'drills' } : id === 'exam' ? { name: 'exam' } : { name: 'practice', kind: id as 'listening' | 'writing' | 'conversation', contentId: id, sessionId: `preview-${id}` })}
      onRetry={() => undefined} />;
  } else if (route.name === 'notes') {
    content = <NotesPage loadState="ready" notes={[note]} selectedId={note.id} draft={draft}
      onSelect={() => undefined}
      onDraftChange={change => setDraft(value => ({ ...value, ...change, saveState: 'dirty' }))}
      onSave={() => setDraft(value => ({ ...value, saveState: failSave ? 'failed' : 'saved' }))}
      onNew={() => setDraft({ title: '', body: '', saveState: 'clean' })}
      onRetry={() => setDraft(value => ({ ...value, saveState: 'saved' }))} />;
  } else if (route.name === 'profile') {
    content = <ProfilePage section={profileSection} loadState="ready" preferences={preferences}
      stats={{ cardsReviewed: 12, lessonsCompleted: 3, note: 'Contoh untuk pemeriksaan tampilan; bukan data belajar.' }}
      onSectionChange={setProfileSection}
      onPreferenceChange={change => setPreferences(value => ({ ...value, ...change }))}
      onRetry={() => undefined} />;
  } else if (route.name === 'lesson') {
    content = <>
      <FocusHeader breadcrumb={<><span>A1</span> / <span>Unit 4</span> / <span>Materi 2</span></>} progressLabel="Materi 2 dari 3" onBack={back} />
      <article className="lesson">
        <div className="lesson-heading"><h1>Memesan dengan sopan</h1><p className="lede">A1 · Unit 4 · Materi 2</p></div>
        <div className="lesson-grid">
          <div className="stack">
            <ComicPanel art={assets.adeganKafe} bubble={<>Ich möchte<br /><mark>einen Tee,</mark><br />bitte.</>} />
            <div className="panel"><p lang="de"><strong>Ich möchte <mark>einen Tee</mark>, bitte.</strong></p><p>Saya ingin secangkir teh.</p></div>
            <AudioButton status={audioStatus} onClick={() => setAudioStatus('Klip tidak tersedia; teks contoh tetap dapat dibaca.')} />
            <button type="button" className="button-primary" onClick={() => push({ name: 'checkpoint', unitNo: 4, sessionId: 'preview-result' })}>Lihat contoh hasil<Icon name="arrow" /></button>
          </div>
          <aside className="panel"><h2>Catatan saya</h2><p className="muted">Contoh panel catatan disambungkan 1a ke penyimpanan nyata.</p></aside>
        </div>
      </article>
    </>;
  } else if (route.name === 'checkpoint') {
    content = <>
      <FocusHeader breadcrumb={<>A1 / Unit 4 / Hasil</>} progressLabel="11/15 benar" onBack={back} />
      <article className="exercise">
        <h1>Hasil Unit 4</h1>
        <p className="lede">Contoh koreksi untuk pemeriksaan tampilan; bukan hasil belajar tersimpan.</p>
        <div className="unit-progress"><SegmentedProgress done={11} total={15} /></div>
        <Feedback state="incorrect" title="Masih perlu latihan"
          correctSentence={<>Ich möchte <strong>einen Kaffee</strong>, bitte.</>}
          explanation={<><h3>Mengapa einen?</h3><p><span lang="de">Tee</span> berartikel <span lang="de">der</span>; setelah <span lang="de">möchte</span>, <span lang="de">ein</span> menjadi <span lang="de">einen</span>.</p></>}
          example={<><h3>Contoh dari materi</h3><p lang="de">Ich möchte einen Tee, bitte.</p><AudioButton status={audioStatus} onClick={() => setAudioStatus('Klip tidak tersedia; contoh teks tetap tampil.')} /></>}
          exampleOpen={exampleOpen} onToggleExample={() => setExampleOpen(value => !value)} exampleTitleId="example-title" />
      </article>
    </>;
  } else if (route.name === 'reader') {
    content = <>
      <FocusHeader breadcrumb={<>Jelajah / Bacaan / Im Café</>} onBack={back} />
      <BookPreview title="Im Café" lead="Pertama, saya memesan di kafe." label="A1 · Restoran" image={assets.sampulImCafe}
        actions={<><button type="button" className="button-primary">Baca</button><button type="button" className="button-secondary">Dengarkan</button></>} />
      <Reader title="Im Café" lines={[
        { de: 'Ich möchte einen Kaffee, bitte.', id: 'Saya ingin secangkir kopi, tolong.' },
        { de: 'Der Kaffee ist heiß.', id: 'Kopinya panas.' },
      ]} />
    </>;
  } else {
    content = <><FocusHeader breadcrumb={<>KLAB</>} onBack={back} />
      <SessionCard title="Rute siap disambungkan" meta="Fitur aplikasi awal tetap menjadi sumber perilaku."
        actionLabel="Kembali ke Jelajah" onAction={() => navigation.getState().selectTab('explore')} art={assets.mascotSambut} /></>;
  }

  return <Shell route={route} onNavigate={navigate} theme={theme} notice="Preview frontend KLAB · data contoh"
    onThemeChange={() => setTheme(value => value === 'light' ? 'dark' : 'light')}>
    {content}
    <details className="klab-preview-tools"><summary>Alat pemeriksaan preview</summary>
      <label><input type="checkbox" checked={failSave} onChange={e => setFailSave(e.target.checked)} />Simulasikan gagal simpan catatan</label>
      <label><input type="checkbox" checked={fullLoad} onChange={e => setFullLoad(e.target.checked)} />Simulasikan beban penuh: 42 unit / 67 buku / 2134 kata</label>
      <p>Data dan pilihan hanya ada selama preview terbuka; komponen ini tidak menulis ke penyimpanan.</p>
    </details>
  </Shell>;
}

// Guard against duplicate createRoot() when Vite re-executes this entry on HMR.
type RootHost = HTMLElement & { __klabRoot?: ReturnType<typeof createRoot> };
const host = document.getElementById('root') as RootHost;
host.__klabRoot ??= createRoot(host);
host.__klabRoot.render(<Preview />);
