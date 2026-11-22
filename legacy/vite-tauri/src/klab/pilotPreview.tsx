// Isolated visual review harness for LANJUT-PILOT-01 (Agent 4a).
// Fixtures only: DOM/CSS states mirroring the pilot screens. No DB, native bridge,
// 2a LessonFlow imports or 3a EXE/port. Evidence from this file is PREVIEW evidence.
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { assets } from './assets';
import { AudioButton, FocusHeader } from './components/session';
import { BookCard, BookPreview, Reader, Shelf } from './components/book';
import { KButton } from './components/ui';
import TodayPage from './pages/TodayPage';
import ExplorePage from './pages/ExplorePage';
import './tokens.css';

type Case = 'answer' | 'save-error' | 'summary' | 'example' | 'shelf'
  | 'beginner-home' | 'beginner-explore' | 'order-question' | 'reading';

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return <><h1 className="klab-heading">{title}</h1>{children}</>;
}

function AnswerCase({ fail }: { fail: boolean }) {
  return <Frame title="Soal 2 · jawaban terkirim">
    <section className="exercise">
      <FocusHeader breadcrumb={<>A1 · Unit 4 · Pelajaran 2 · Latihan 2</>} progressLabel="Soal 2 dari 2" onBack={() => undefined} />
      <p className="question">Lengkapi: Zusammen oder ___?</p>
      <form>
        <input aria-label="Jawaban latihan" defaultValue="getrennt" />
        <div className="actions"><KButton variant="primary" disabled>Cek jawaban</KButton></div>
      </form>
      <div className="feedback" data-state="correct">
        <div className="feedback-body"><h2>Jawabanmu benar</h2><p>Zusammen oder getrennt? berarti 'bersama atau terpisah?'.</p></div>
      </div>
      <div className="actions screen-footer">
        <KButton variant="primary" disabled={fail}>{fail ? 'Menyimpan…' : 'Selesai'}</KButton>
        <KButton variant="secondary" onClick={() => undefined}>Coba lagi</KButton>
        {fail && <p role="alert">Progres belum tersimpan. Tekan Selesai untuk mencoba lagi.</p>}
      </div>
    </section>
  </Frame>;
}

function SummaryCase() {
  return <Frame title="Ringkasan setelah buka ulang">
    <section className="exercise">
      <div className="panel"><p role="status">Progres tersimpan: 50% · lp-u4-l2-01: ein (salah) · lp-u4-l2-02: getrennt (benar)</p></div>
      <p className="question">Ich möchte ___ Apfelsaft, bitte.</p>
      <div className="choices">
        <label className="choice" data-state="incorrect"><input type="radio" name="q1" defaultChecked /><span>ein</span><span className="choice-status">Pilihanmu</span></label>
        <label className="choice" data-state="correct"><input type="radio" name="q1" /><span>einen</span><span className="choice-status">Jawaban benar</span></label>
      </div>
    </section>
  </Frame>;
}

function ExampleCase() {
  const [open, setOpen] = useState(true);
  const opener = useRef<HTMLButtonElement>(null);
  return <Frame title="Contoh dari materi · fokus setelah ditutup">
    <section className="exercise">
      <div className="feedback" data-state="incorrect">
        <div className="feedback-body"><h2>Belum tepat</h2>
          <div className="explanation"><h3>Mengapa einen?</h3><p><span lang="de">Saft</span> berartikel <span lang="de">der</span>, sehingga setelah <span lang="de">möchte</span> memakai <span lang="de">einen</span>.</p>
            <div className="example-panel" hidden={!open}>
              <h3>Contoh dari materi</h3>
              <p lang="de"><mark>Ich möchte einen Kaffee, bitte.</mark></p>
              <AudioButton status="Klip tidak tersedia; contoh teks tetap tampil." onClick={() => undefined} />
            </div>
          </div>
          <div className="actions">
            <button ref={opener} type="button" className="button-secondary" aria-expanded={open}
              onClick={() => setOpen(value => !value)}>{open ? 'Tutup contoh' : 'Lihat contoh dari materi'}</button>
            <KButton variant="secondary" onClick={() => opener.current?.focus()}>Uji kembalikan fokus</KButton>
          </div>
        </div>
      </div>
    </section>
  </Frame>;
}

function ShelfCase() {
  const [preview, setPreview] = useState(false);
  return <Frame title="Rak Im Café">
    <p className="shelf-count">67 buku di rak · pilih sampul untuk melihat cuplikan</p>
    <Shelf title="Rak bacaan" description="Pilih buku untuk melihat cuplikan.">
      <BookCard title="Im Café" meta="A1 · Bacaan" label="A1 · Restoran" image={assets.sampulImCafe}
        onOpen={() => setPreview(true)} />
    </Shelf>
    {preview && <BookPreview entering title="Im Café" label="A1 · Restoran" image={assets.sampulImCafe}
      eyebrow="Cuplikan" lead="Ich möchte einen Kaffee, bitte." description="A1 · Bacaan"
      actions={<><KButton variant="primary">Baca</KButton><KButton variant="secondary">Dengarkan</KButton><KButton variant="text" onClick={() => setPreview(false)}>Kembali ke rak</KButton></>} />}
  </Frame>;
}

function BeginnerHomeCase() {
  return <TodayPage loadState="ready"
    agenda={{ eyebrow: 'A1 · Unit 4 · Pelajaran 2', title: 'Lanjutkan memesan minuman', ribbon: '04', done: 1, total: 4, meta: 'Lanjutkan belajar' }}
    quickLinks={[
      { id: 'srs', label: 'Ulangi kosakata (SRS)', icon: 'book', meta: 'Menunggu antrean' },
      { id: 'reading', label: 'Baca & dengarkan', icon: 'book', meta: 'Rak Im Café' },
    ]}
    progress={{ title: 'Buku belajarku', done: 3, total: 42, units: [
      { unitNo: 1, title: 'Salam & perkenalan', meta: 'A1', level: 'A1', status: 'done' },
      { unitNo: 4, title: 'Makanan & minuman', meta: 'A1', level: 'A1', status: 'active' },
      { unitNo: 101, title: 'A2 pertama', meta: 'A2', level: 'A2', status: 'available' },
    ] }}
    secondaryAction={{ label: 'Coba alur koreksi', onClick: () => undefined }}
    onOpenAgenda={() => undefined} onOpenQuickLink={() => undefined} onOpenUnit={() => undefined} onRetry={() => undefined} />;
}

function BeginnerExploreCase() {
  return <ExplorePage section="materials" loadState="ready"
    units={[
      { unitNo: 4, title: 'Makanan & minuman', meta: 'A1', level: 'A1', status: 'active' },
      { unitNo: 11, title: 'Bepergian', meta: 'A1', level: 'A1', status: 'available' },
      { unitNo: 101, title: 'A2 pertama', meta: 'A2', level: 'A2', status: 'available' },
      { unitNo: 201, title: 'B1 pertama', meta: 'B1', level: 'B1', status: 'available' },
    ]}
    books={[{ id: 'im-cafe', title: 'Im Café', meta: 'A1 · Bacaan', label: 'A1 · Restoran', image: assets.sampulImCafe, lead: 'Ich möchte einen Kaffee, bitte.' }]}
    practiceLinks={[
      { id: 'listening', label: 'Mendengar' }, { id: 'writing', label: 'Menulis' },
      { id: 'conversation', label: 'Percakapan bercabang' }, { id: 'drills', label: 'Drill D1–D10' },
      { id: 'exam', label: 'Uji Tiruan A1' },
    ]}
    onSectionChange={() => undefined} onOpenUnit={() => undefined} onOpenBook={() => undefined}
    onOpenPractice={() => undefined} onOpenSrs={() => undefined} onRetry={() => undefined} />;
}

function OrderQuestionCase() {
  const tokens = ['Ich', 'nehme', 'meinen', 'Reisepass', 'mit.'];
  const [typed, setTyped] = useState('');
  return <Frame title="Soal susun kata · U11 L1">
    <section className="exercise" data-state="unselected">
      <FocusHeader breadcrumb={<>A1 · Unit 11 · Pelajaran 1 · Latihan 3</>} progressLabel="Soal 3 dari 3" onBack={() => undefined} />
      <h1>Stelle den Satz zusammen.</h1>
      <p className="question">Ich nehme meinen Reisepass mit.</p>
      <form onSubmit={(event) => event.preventDefault()}>
        <div className="choices">
          {tokens.map((token, index) => <button key={index} className="choice" type="button"
            onClick={() => setTyped(value => `${value}${value ? ' ' : ''}${token}`)}>
            <span lang="de">{token}</span>
          </button>)}
          <button className="button-secondary" type="button" onClick={() => setTyped('')}>Hapus susunan</button>
        </div>
        <input aria-label="Jawaban latihan" value={typed} onChange={event => setTyped(event.target.value)} />
        <div className="actions"><KButton variant="primary" disabled={!typed.trim()}>Cek jawaban</KButton></div>
      </form>
    </section>
  </Frame>;
}

function ReadingCase() {
  return <Frame title="Ruang baca · Im Café">
    <Reader title="Im Café" lines={[
      { de: 'Ich möchte einen Kaffee, bitte.', id: 'Saya ingin secangkir kopi, tolong.' },
      { de: 'Der Kaffee ist heiß.', id: 'Kopinya panas.' },
      { de: 'Ich möchte einen Tee, bitte.', id: 'Saya ingin secangkir teh, tolong.' },
      { de: 'Der Tee ist auch gut.', id: 'Tehnya juga enak.' },
      { de: 'Die Rechnung, bitte.', id: 'Bonnya, tolong.' },
      { de: 'Zusammen oder getrennt?', id: 'Dibayar bersama atau terpisah?' },
    ]}
      actions={<><KButton variant="primary">Baca</KButton><KButton variant="secondary">Dengarkan</KButton><KButton variant="text">Kembali ke rak</KButton></>} />
  </Frame>;
}

const CASES: ReadonlyArray<{ id: Case; label: string }> = [
  { id: 'beginner-home', label: 'Pemula: Hari Ini' },
  { id: 'beginner-explore', label: 'Pemula: Jelajah' },
  { id: 'answer', label: 'Kolom jawaban' },
  { id: 'save-error', label: 'Gagal simpan' },
  { id: 'summary', label: 'Ringkasan skor' },
  { id: 'example', label: 'Contoh + fokus' },
  { id: 'order-question', label: 'Susun kata' },
  { id: 'reading', label: 'Ruang baca' },
  { id: 'shelf', label: 'Rak Im Café' },
];

// Eksplisit memetakan setiap kasus ke komponennya agar tidak ada deklarasi
// yang terbaca sebagai unused oleh noUnusedLocals saat build produksi.
const CASE_VIEWS: Record<Case, ReactNode> = {
  'answer': <AnswerCase fail={false} />,
  'save-error': <AnswerCase fail />,
  'summary': <SummaryCase />,
  'example': <ExampleCase />,
  'order-question': <OrderQuestionCase />,
  'reading': <ReadingCase />,
  'beginner-home': <BeginnerHomeCase />,
  'beginner-explore': <BeginnerExploreCase />,
  'shelf': <ShelfCase />,
};

function Harness() {
  return <div className="klab-app" data-theme="light">
    <a className="klab-skip" href="#pilot-content">Lewati navigasi</a>
    <div className="klab-workspace">
      <header className="klab-topbar"><span className="klab-preview-label">PRATINJAU VISUAL · LANJUT-PILOT-01</span></header>
      <main id="pilot-content" tabIndex={-1}>
        <div className="shelf">
          {CASES.map(item => <section key={item.id} className="panel" data-case={item.id}>
            <h2 className="panel-heading">{item.label}</h2>
            {CASE_VIEWS[item.id]}
          </section>)}
        </div>
      </main>
    </div>
  </div>;
}

// Guard against duplicate createRoot() when Vite re-executes this entry on HMR.
const host = document.getElementById('root') as HTMLElement & { __pilotRoot?: ReturnType<typeof createRoot> };
host.__pilotRoot ??= createRoot(host);
host.__pilotRoot.render(<Harness />);
