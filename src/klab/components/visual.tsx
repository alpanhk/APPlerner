// UIUX-VISUAL-NOVEL-20261121 / 4a — komponen referensi yang diadaptasi ke React/TS.
// CSS murni lewat visual.css; tidak menambah dependency Tailwind.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

export type VnBgId = 'kamar' | 'jendela' | 'pintu' | 'jalan' | 'judul';
export type VnSide = 'left' | 'right' | 'center';
export type VnCharacter = { id: string; name: string; side: VnSide; skin?: string; hair?: string; outfit?: string };

export function bgSrc(id: VnBgId): string { return `/media/bg/${id}.jpg`; }

/* Potret sederhana bergaya cel referensi; mulut berubah saat penutur bicara. */
export function VnPortrait({
  name, skin = '#e6b48f', hair = '#2f2520', outfit = '#2c3e6b', speaking = false,
  expression = 'neutral', className = '',
}: { name: string; skin?: string; hair?: string; outfit?: string; speaking?: boolean; expression?: string; className?: string }) {
  const brow = expression === 'think' ? 8 : 0;
  return <svg viewBox="0 0 320 440" className={className} role="img" aria-label={`Potret ${name}`}>
    <ellipse cx="160" cy="424" rx="118" ry="14" fill="#10152655" />
    <path d="M60 440 Q64 306 160 300 Q256 306 260 440 Z" fill={outfit} stroke="#2a2333" strokeWidth="3" />
    <path d="M124 306 L160 356 L196 306" fill="#f7efdd" opacity=".9" />
    <rect x="138" y="262" width="44" height="52" rx="16" fill={skin} stroke="#2a2333" strokeWidth="3" />
    <ellipse cx="160" cy="176" rx="92" ry="104" fill={hair} stroke="#2a2333" strokeWidth="3" />
    <ellipse cx="160" cy="188" rx="74" ry="84" fill={skin} stroke="#2a2333" strokeWidth="3" />
    <path d={`M118 ${148 + brow} q18 -12 36 0 M166 ${148 - brow} q18 -12 36 0`} stroke="#2a2333" strokeWidth="4" fill="none" strokeLinecap="round" />
    <ellipse cx="136" cy="184" rx="7" ry="10" fill="#2a2333" />
    <ellipse cx="184" cy="184" rx="7" ry="10" fill="#2a2333" />
    <path d="M150 218 q10 8 20 0" stroke="#2a2333" strokeWidth="3" fill="none" strokeLinecap="round" />
    {speaking ? <ellipse cx="160" cy="240" rx="13" ry="10" fill="#8c3f38" stroke="#2a2333" strokeWidth="2" />
      : <path d="M148 240 q12 6 24 0" stroke="#2a2333" strokeWidth="3" fill="none" strokeLinecap="round" />}
  </svg>;
}

/* Layar judul. */
export function TitleScreen({ hasSave, saveName, onStart, onContinue, onSettings, onLibrary }: {
  hasSave: boolean; saveName?: string; onStart: () => void; onContinue: () => void;
  onSettings: () => void; onLibrary: () => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return <section className="vn-title vn-fade">
    <img src={bgSrc('judul')} alt="" />
    <p className="vn-kicker">Visual novel bahasa Jerman</p>
    <h1>Lernen</h1>
    <p>Prolog: <strong>Surat untuk Siapa?</strong></p>
    <nav className="vn-title-actions" aria-label="Menu utama">
      {hasSave && <button ref={first} type="button" className="vn-btn vn-btn-primary" onClick={onContinue}>
        Lanjutkan{saveName ? ` sebagai ${saveName}` : ''}
      </button>}
      <button ref={hasSave ? undefined : first} type="button" className={`vn-btn ${hasSave ? 'vn-btn-secondary' : 'vn-btn-primary'}`} onClick={onStart}>
        Mulai cerita{hasSave ? ' baru' : ''}
      </button>
      <button type="button" className="vn-btn vn-btn-secondary" onClick={onLibrary}>Perpustakaan</button>
      <button type="button" className="vn-btn vn-btn-ghost" onClick={onSettings}>Pengaturan</button>
    </nav>
    <p className="vn-muted">Untuk penutur bahasa Indonesia · A1 Unit 1 „Salam &amp; perkenalan diri“</p>
  </section>;
}

/* Pembuat karakter. */
export type VnProfile = { name: string; skin: string; hair: string; outfit: string };
export function CharacterCreator({ initial, onDone, onBack }: {
  initial: VnProfile; onDone: (p: VnProfile) => void; onBack: () => void;
}) {
  const [profile, setProfile] = useState<VnProfile>(initial);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);
  const palettes: Array<{ key: keyof VnProfile; label: string; values: Array<[string, string]> }> = [
    { key: 'skin', label: 'Warna kulit', values: [['#f1d2b8', 'Terang'], ['#e6b48f', 'Sawo'], ['#c48a5a', 'Cokelat'], ['#8d5a3a', 'Gelap']] },
    { key: 'hair', label: 'Warna rambut', values: [['#2f2520', 'Hitam'], ['#5a3a28', 'Cokelat'], ['#8a4b2a', 'Kemerahan'], ['#d8a85a', 'Pirang']] },
    { key: 'outfit', label: 'Warna pakaian', values: [['#2c3e6b', 'Biru tua'], ['#b5533c', 'Merah bata'], ['#3f7d7a', 'Hijau laut'], ['#8a6d3b', 'Kuning tanah']] },
  ];
  function submit(event: FormEvent) {
    event.preventDefault();
    const name = profile.name.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 16) {
      setError('Nama panggilan harus 2–16 huruf.');
      nameRef.current?.focus();
      return;
    }
    onDone({ ...profile, name });
  }
  return <section className="vn-creator vn-fade">
    <div className="vn-creator-preview">
      <VnPortrait name={profile.name || 'Kamu'} skin={profile.skin} hair={profile.hair} outfit={profile.outfit} expression="smile" className="vn-portrait" />
      <p>Pratinjau: {profile.name.trim() || '—'}</p>
    </div>
    <form onSubmit={submit}>
      <h2>Siapa kamu di kota ini?</h2>
      <label className="vn-field">Nama panggilan
        <input ref={nameRef} value={profile.name} maxLength={20} placeholder="mis. Rina, Dito, Mia…"
          aria-describedby="vn-name-help" onChange={(e) => { setError(''); setProfile({ ...profile, name: e.target.value }); }} />
      </label>
      <small id="vn-name-help" className="vn-muted">Nama ini dipakai tokoh sepanjang cerita.</small>
      {error && <p role="alert" className="vn-error">✎ {error}</p>}
      {palettes.map((group) => <fieldset key={group.key} className="vn-fieldset">
        <legend>{group.label}</legend>
        <div className="vn-swatches" role="radiogroup" aria-label={group.label}>
          {group.values.map(([value, label]) => <button key={value} type="button" role="radio"
            aria-checked={profile[group.key] === value} className="vn-swatch"
            onClick={() => setProfile({ ...profile, [group.key]: value })}>
            <span className="vn-swatch-dot" style={{ background: value }} />{label}
            {profile[group.key] === value && <span aria-hidden="true">✓</span>}
          </button>)}
        </div>
      </fieldset>)}
      <div className="vn-actions">
        <button type="button" className="vn-btn vn-btn-secondary" onClick={onBack}>‹ Kembali</button>
        <button type="submit" className="vn-btn vn-btn-primary">Mulai prolog ▸</button>
      </div>
    </form>
  </section>;
}

/* Panggung adegan. */
export function Stage({ bg, chars, speakingId, reducedMotion, children }: {
  bg: VnBgId; chars: VnCharacter[]; speakingId?: string | null; reducedMotion?: boolean; children?: ReactNode;
}) {
  return <div className={`vn-stage ${reducedMotion ? '' : 'vn-stage-fade'}`}>
    <img className="vn-bg" src={bgSrc(bg)} alt="" />
    <div className="vn-shade" />
    {chars.map((char) => <div key={char.id} className="vn-char" data-side={char.side}
      data-speaking={speakingId === char.id ? 'true' : 'false'}>
      <VnPortrait name={char.name} skin={char.skin} hair={char.hair} outfit={char.outfit}
        speaking={speakingId === char.id} className="vn-portrait" />
    </div>)}
    {children}
  </div>;
}

/* Panel dialog + aksi. */
export function DialogPanel({ speaker, text, translation, showTranslation, onToggleTranslation,
  canListen, onListen, isSpeaking, audioStatus, children }: {
  speaker: string; text: string; translation?: string; showTranslation: boolean;
  onToggleTranslation: () => void; canListen?: boolean; onListen?: () => void;
  isSpeaking?: boolean; audioStatus?: string; children?: ReactNode;
}) {
  return <section className="vn-dialog vn-fade" aria-live="polite">
    <div className="vn-dialog-head">
      <span className="vn-speaker">{speaker}</span>
      <span className="vn-badge-de">DE</span>
      <span className="vn-actions">
        {canListen && <button type="button" className="vn-btn vn-btn-ghost" aria-label="Dengar lagi kalimat ini" onClick={onListen}>
          {isSpeaking ? '■ Berhenti' : '▶ Dengar lagi'}
        </button>}
        {translation && <button type="button" className="vn-btn vn-btn-ghost" aria-pressed={showTranslation} onClick={onToggleTranslation}>
          {showTranslation ? 'Sembunyikan arti' : 'Arti'}
        </button>}
      </span>
    </div>
    <p className="vn-line" lang="de">{text}</p>
    {showTranslation && translation && <p className="vn-translation">{translation}</p>}
    {audioStatus && <p className="vn-muted">{audioStatus}</p>}
    {children && <div className="vn-actions">{children}</div>}
  </section>;
}

export function NextButton({ onClick, label = 'Lanjut ▸' }: { onClick: () => void; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return <button ref={ref} type="button" className="vn-btn vn-btn-primary" onClick={onClick}>{label}</button>;
}

export function ChoiceList({ prompt, options, onPick }: {
  prompt?: string; options: Array<{ label: string; value?: string }>; onPick: (option: { label: string; value?: string }) => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus({ preventScroll: true }); }, []);
  return <div>
    {prompt && <p className="vn-prompt">{prompt}</p>}
    <ul className="vn-choice-list" role="list">
      {options.map((option, index) => <li key={option.label}>
        <button ref={index === 0 ? first : undefined} type="button" className="vn-btn vn-btn-choice" onClick={() => onPick(option)}>
          <span aria-hidden="true" className="vn-accent-text">◆</span> {option.label}
        </button>
      </li>)}
    </ul>
  </div>;
}

export function AnswerInput({ prompt, value, onChange, onSubmit, chips = [], hints = [], hintLevel = 0,
  onHint, feedback, busy, skip }: {
  prompt: string; value: string; onChange: (value: string) => void; onSubmit: () => void;
  chips?: string[]; hints?: string[]; hintLevel?: number; onHint?: () => void;
  feedback?: string; busy?: boolean; skip?: { label: string; onSkip: () => void };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, [prompt]);
  function submit(event: FormEvent) { event.preventDefault(); if (!busy) onSubmit(); }
  function addChip(chip: string) {
    const punctuation = /^[.!?,]$/.test(chip);
    const next = punctuation ? value.trimEnd() + chip : (!value || /\s$/.test(value) ? value + chip : value + ' ' + chip);
    onChange(next); inputRef.current?.focus();
  }
  return <form onSubmit={submit} className="vn-answer">
    <div className="vn-dialog-head"><span className="vn-turn">Giliranmu</span><p className="vn-prompt">{prompt}</p></div>
    <div className="vn-chips" aria-label="Susun jawaban dari kata">
      {chips.map((chip) => <button key={chip} type="button" className="vn-chip" onClick={() => addChip(chip)}>{chip}</button>)}
      {value && <button type="button" className="vn-chip" onClick={() => onChange('')}>Hapus</button>}
    </div>
    <div className="vn-answer-row">
      <input ref={inputRef} data-answer-input type="text" lang="de" autoComplete="off" spellCheck={false}
        value={value} aria-label="Jawabanmu dalam bahasa Jerman" placeholder="Ketik jawabanmu dalam bahasa Jerman…"
        onChange={(e) => onChange(e.target.value)} />
      <button type="submit" className="vn-btn vn-btn-primary" disabled={busy}>Kirim</button>
    </div>
    <div className="vn-answer-tools">
      {onHint && hintLevel < hints.length && <button type="button" className="vn-btn vn-btn-ghost" onClick={onHint}>? Petunjuk</button>}
      {skip && <button type="button" className="vn-btn vn-btn-ghost" onClick={skip.onSkip}>{skip.label}</button>}
      <small className="vn-muted">ß boleh ditulis „ss“. Huruf besar/kecil &amp; tanda baca bebas.</small>
    </div>
    {hintLevel > 0 && <ul className="vn-hints" aria-label="Petunjuk tutor">
      {hints.slice(0, hintLevel).map((hint, i) => <li key={i}><strong>Tutor {i + 1}:</strong> {hint}</li>)}
    </ul>}
    {feedback && <p role="alert" className="vn-error">✎ {feedback}</p>}
  </form>;
}

/* Panel-panel referensi. */
export function JournalPanel({ title = 'Jurnal', children }: { title?: string; children?: ReactNode }) {
  return <section className="vn-panel vn-fade"><h2>{title}</h2><div className="vn-panel-body">{children}</div></section>;
}
export function LibraryPanel({ title = 'Perpustakaan', children }: { title?: string; children?: ReactNode }) {
  return <section className="vn-panel vn-fade"><h2>{title}</h2><div className="vn-library-grid">{children}</div></section>;
}
export function HistoryPanel({ children }: { children?: ReactNode }) {
  return <section className="vn-panel vn-fade"><h2>Riwayat</h2><div className="vn-panel-body">{children}</div></section>;
}
export function SettingsPanel({ children }: { children?: ReactNode }) {
  return <section className="vn-panel vn-fade"><h2>Pengaturan</h2><div className="vn-panel-body">{children}</div></section>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children?: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  return <div className="vn-modal-overlay" role="presentation">
    <section className="vn-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="vn-dialog-head"><h2>{title}</h2>
        <button ref={closeRef} type="button" className="vn-btn vn-btn-ghost" onClick={onClose}>Tutup ✕</button></div>
      {children}
    </section>
  </div>;
}

/* Layar hasil. */
export function ResultScreen({ title, summary, details, onRetry, onContinue }: {
  title: string; summary: string; details?: string[]; onRetry?: () => void; onContinue: () => void;
}) {
  return <section className="vn-result vn-fade">
    <p className="vn-kicker">Hasil belajar</p>
    <h2>{title}</h2>
    <p className="vn-result-summary">{summary}</p>
    {details && <ul role="list">{details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
    <div className="vn-actions">
      {onRetry && <button type="button" className="vn-btn vn-btn-secondary" onClick={onRetry}>Coba lagi</button>}
      <button type="button" className="vn-btn vn-btn-primary" onClick={onContinue}>Lanjut ▸</button>
    </div>
  </section>;
}
