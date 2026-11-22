// Presentational session components for KLAB (Agent 4a).
// Owners 1a/2a supply data, state and callbacks; grading and navigation stay outside.
import type { InputHTMLAttributes, ReactNode } from 'react';
import Icon from '../Icon';
import Mascot from '../Mascot';
import { assets } from '../assets';
import { KButton, SegmentedProgress } from './ui';

export function FocusHeader({
  breadcrumb, progressLabel, onBack, children,
}: { breadcrumb: ReactNode; progressLabel?: string; onBack: () => void; children?: ReactNode }) {
  return <header className="focus-header">
    <KButton variant="back" onClick={onBack}><Icon name="back" />Kembali</KButton>
    <div className="breadcrumb">{breadcrumb}</div>
    {progressLabel && <div className="progress-label">{progressLabel}</div>}
    {children}
  </header>;
}

export function SessionCard({
  eyebrow, title, subtitle, meta, ribbon, art = assets.mascotSambut,
  done, total, actionLabel, onAction, secondary,
}: {
  eyebrow?: string; title: string; subtitle?: string; meta?: string;
  ribbon?: string; art?: string; done?: number; total?: number;
  actionLabel: string; onAction: () => void;
  secondary?: { label: string; onClick: () => void };
}) {
  return <section className="session-card">
    <div className="session-copy">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {ribbon && <span className="unit-ribbon" aria-hidden="true">{ribbon}</span>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
      {meta && <p className="muted">{meta}</p>}
      {typeof done === 'number' && typeof total === 'number' && (
        <div className="unit-progress"><SegmentedProgress done={done} total={total} /></div>
      )}
      <div className="actions">
        <KButton variant="primary" onClick={onAction}>{actionLabel}<Icon name="arrow" /></KButton>
        {secondary && <KButton variant="secondary" onClick={secondary.onClick}>{secondary.label}</KButton>}
      </div>
    </div>
    <img className="session-art" src={art} alt="" aria-hidden="true" />
  </section>;
}

export type ChoiceState = 'selected' | 'correct' | 'incorrect' | 'unselected';

export function Choice({
  label, state = 'unselected', statusLabel, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; state?: ChoiceState; statusLabel?: string }) {
  return <label className="choice" data-state={state}>
    <input {...rest} />
    <span>{label}</span>
    {statusLabel && <span className="choice-status">{statusLabel}</span>}
  </label>;
}

export function ChoiceGroup({
  legend, name, choices, value, onChange, disabled,
}: {
  legend: string; name: string;
  choices: Array<{ value: string; label: string; state?: ChoiceState; statusLabel?: string }>;
  value?: string; onChange?: (value: string) => void; disabled?: boolean;
}) {
  return <fieldset className="choices">
    <legend>{legend}</legend>
    {choices.map(choice => <Choice key={choice.value}
      type="radio" name={name} value={choice.value} label={choice.label}
      state={choice.state} statusLabel={choice.statusLabel}
      checked={value === choice.value} disabled={disabled}
      onChange={() => onChange?.(choice.value)} />)}
  </fieldset>;
}

export function AudioButton({
  label = 'Dengarkan', onClick, playing, disabled, status,
}: { label?: string; onClick: () => void; playing?: boolean; disabled?: boolean; status?: string }) {
  return <>
    <KButton variant="text" onClick={onClick} disabled={disabled} aria-pressed={playing}>
      <Icon name="play" />{playing ? 'Memutar...' : label}
    </KButton>
    {status && <p className="audio-status" role="status">{status}</p>}
  </>;
}

export function ComicPanel({
  bubble, art, lang = 'de', className = '',
}: { bubble: ReactNode; art?: string; lang?: string; className?: string }) {
  return <div className={`comic ${className}`.trim()}>
    {art ? <img src={art} alt="" aria-hidden="true" className="klab-mascot" /> : <Mascot />}
    <div className="bubble" lang={lang}>{bubble}</div>
  </div>;
}

export function Feedback({
  state, title, correctSentence, explanation, example, exampleOpen = false,
  onToggleExample, art = assets.mascotFeedback, actions, exampleTitleId,
}: {
  state: 'correct' | 'incorrect'; title: string; correctSentence?: ReactNode;
  explanation?: ReactNode; example?: ReactNode; exampleOpen?: boolean;
  onToggleExample?: () => void; art?: string; actions?: ReactNode; exampleTitleId?: string;
}) {
  return <section className="feedback" data-state={state}>
    <div className="feedback-body">
      <h2>{title}</h2>
      {correctSentence && <p className="correct-sentence">{correctSentence}</p>}
      {explanation && <div className="explanation">{explanation}</div>}
      {example && <div className="example-panel" id={exampleTitleId} hidden={!exampleOpen}>{example}</div>}
      {onToggleExample && <KButton variant="text" onClick={onToggleExample} aria-expanded={exampleOpen}>
        {exampleOpen ? 'Tutup contoh' : 'Lihat contoh dari materi'}
      </KButton>}
      {actions && <div className="actions">{actions}</div>}
    </div>
    <img className="feedback-art" src={art} alt="" aria-hidden="true" />
  </section>;
}
