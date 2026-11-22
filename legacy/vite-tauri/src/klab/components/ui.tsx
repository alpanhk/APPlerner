// Presentational primitives for the production KLAB shell (Agent 4a).
// No navigation, assessment, storage or native access lives here.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { SaveState } from '../contracts';
import Icon from '../Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'back';

export function KButton({
  variant = 'secondary', children, className = '', type = 'button', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  const cls = variant === 'primary' ? 'button-primary'
    : variant === 'text' ? 'button-text'
      : variant === 'back' ? 'back-button' : 'button-secondary';
  return <button type={type} className={`${cls} ${className}`.trim()} {...rest}>{children}</button>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SegmentedProgress({
  done, total, label, variant = 'segments',
}: { done: number; total: number; label?: string; variant?: 'segments' | 'meter' }) {
  const safeTotal = Math.max(0, total);
  const safeDone = Math.min(Math.max(0, done), safeTotal);
  const aria = label ?? `${safeDone} dari ${safeTotal} selesai`;
  if (variant === 'meter') {
    return <progress className="progress" value={safeDone} max={safeTotal || 1} aria-label={aria} />;
  }
  return <div className="progress-track" role="img" aria-label={aria}>
    {Array.from({ length: safeTotal }, (_, i) => <span key={i} data-done={i < safeDone} />)}
  </div>;
}

export function SaveStatus({
  state, message, onRetry,
}: { state: SaveState; message?: string; onRetry?: () => void }) {
  const failed = state === 'failed';
  const text = message ?? (state === 'saved' ? 'Tersimpan.'
    : state === 'saving' ? 'Menyimpan...'
      : state === 'dirty' ? 'Ada perubahan belum disimpan.'
        : state === 'failed' ? 'Gagal menyimpan. Perubahan tetap ada; coba lagi.'
          : 'Semua perubahan tersimpan.');
  return <p className="save-status" data-failed={failed} role={failed ? 'alert' : 'status'}
    aria-live={failed ? undefined : 'polite'}>
    {text}{' '}
    {failed && onRetry && <KButton variant="text" onClick={onRetry}>Coba lagi</KButton>}
  </p>;
}

export function EmptyState({
  icon, title, description, actionLabel, onAction,
}: { icon?: ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return <section className="state-card" data-tone="empty">
    {icon && <span className="state-icon" aria-hidden="true">{icon}</span>}
    <h2>{title}</h2>
    <p className="muted">{description}</p>
    {actionLabel && onAction && <KButton variant="primary" onClick={onAction}>{actionLabel}</KButton>}
  </section>;
}

export function ErrorState({
  title, message, detail, onRetry, onBack,
}: { title: string; message: string; detail?: string; onRetry?: () => void; onBack?: () => void }) {
  return <section className="state-card" data-tone="error" role="alert">
    <h2>{title}</h2>
    <p>{message}</p>
    {detail && <p className="muted">{detail}</p>}
    <div className="actions">
      {onRetry && <KButton variant="primary" onClick={onRetry}>Coba lagi</KButton>}
      {onBack && <KButton variant="secondary" onClick={onBack}>Kembali</KButton>}
    </div>
  </section>;
}

export function Tabs({
  items, active, onChange, label,
}: {
  items: ReadonlyArray<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return <div className="tabs" role="group" aria-label={label}>
    {items.map(item => <button key={item.id} type="button"
      aria-pressed={active === item.id}
      onClick={() => onChange(item.id)}>{item.label}</button>)}
  </div>;
}

export function LoadingState({ label = 'Menyiapkan...' }: { label?: string }) {
  return <p className="muted" role="status" aria-live="polite">{label}</p>;
}

export function RowLink({
  icon, children, meta, onClick,
}: { icon?: string; children: ReactNode; meta?: string; onClick: () => void }) {
  return <button type="button" className="profile-row" onClick={onClick}>
    {icon && <Icon name={icon as 'today' | 'explore' | 'notes' | 'profile' | 'book' | 'play'} />}
    <span>{children}</span>
    {meta && <small className="muted">{meta}</small>}
    <Icon name="arrow" />
  </button>;
}
