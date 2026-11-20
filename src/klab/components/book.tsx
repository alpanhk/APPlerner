// Sampul menyimpan judul sebagai teks agar tetap terbaca dan bisa diakses.
import { Children } from 'react';
import type { MouseEventHandler, ReactNode, Ref } from 'react';
import Icon from '../Icon';
import type { LevelCodeView } from '../pages/viewModels';
import { EmptyState, KButton } from './ui';
import '../editorial.css';

type BookCoverProps = {
  title: string;
  meta?: string;
  label?: string;
  level?: LevelCodeView;
  image?: string;
  coverKind?: 'special' | 'thematic';
  entering?: boolean;
  decorative?: boolean;
  priority?: boolean;
};

export function BookCover({
  title, meta, label, level, image, coverKind, entering = false, decorative, priority,
}: BookCoverProps) {
  return <span className="book-cover editorial-book" data-level={level}
    data-cover-kind={coverKind} data-entering={entering || undefined} aria-hidden={decorative}>
    <span className="editorial-book-print">
      {(level ?? label ?? meta) && <span className="editorial-book-level">{level ?? label ?? meta}</span>}
      <span className="editorial-book-title" lang="de">{title}</span>
    </span>
    <span className="editorial-book-art" aria-hidden="true">
      {image && <img src={image} alt="" decoding="async"
        loading={priority ? undefined : 'lazy'} fetchPriority={priority ? 'high' : undefined} />}
    </span>
  </span>;
}

export function BookCard({
  title, meta, label, level, image, coverKind, textId, priority, actionLabel = 'Buka cuplikan', onOpen,
}: Omit<BookCoverProps, 'entering' | 'decorative'> & { textId?: string; actionLabel?: string; onOpen: MouseEventHandler<HTMLButtonElement> }) {
  return <button type="button" className="book-card editorial-book-card" data-cover-kind={coverKind}
    data-text-id={textId} data-testid={textId ? `book-card-${textId}` : undefined} onClick={onOpen}>
    <BookCover title={title} meta={meta} label={label} level={level} image={image} coverKind={coverKind} priority={priority} />
    <span className="book-action editorial-book-action">{actionLabel}<Icon name="arrow" /></span>
  </button>;
}

export function Shelf({
  title, description, children, empty,
}: { title?: string; description?: string; children?: ReactNode; empty?: ReactNode }) {
  return <section className="shelf editorial-book-shelf">
    <header className="editorial-shelf-heading">
      {title && <h2>{title}</h2>}
      {description && <p className="shelf-count">{description}</p>}
    </header>
    <ul className="shelf-grid editorial-shelf-grid" role="list">
      {Children.map(children, child => <li>{child}</li>)}
    </ul>
    {empty}
  </section>;
}

export function BookPreview({
  title, lead, leadLang, description, image, coverKind, label, level, eyebrow, entering = false,
  headingLevel = 1, headingRef, actions, children,
}: {
  title: string; lead?: string; leadLang?: string; description?: string; image?: string;
  coverKind?: 'special' | 'thematic';
  label?: string; level?: LevelCodeView; eyebrow?: string; entering?: boolean;
  headingLevel?: 1 | 2; headingRef?: Ref<HTMLHeadingElement>; actions?: ReactNode; children?: ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return <section className="book-preview editorial-book-preview" data-entering={entering || undefined}>
    <div className="preview-content editorial-preview-content">
      <BookCover title={title} label={label} level={level} image={image} coverKind={coverKind} decorative entering={entering} priority />
      <div className="preview-copy editorial-preview-copy">
        {eyebrow && <p className="editorial-kicker">{eyebrow}</p>}
        <Heading className="editorial-preview-heading" lang="de" ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}>{title}</Heading>
        {(description ?? level ?? label) && <p className="muted">{description ?? level ?? label}</p>}
        {lead && <blockquote className="editorial-excerpt" lang={leadLang}>{lead}</blockquote>}
        {children}
        {actions && <div className="actions editorial-preview-actions">{actions}</div>}
      </div>
    </div>
  </section>;
}

export function Reader({
  title, lines, actions, children,
}: {
  title?: string;
  lines?: Array<{ de: string; id?: string; state?: string }>;
  actions?: ReactNode; children?: ReactNode;
}) {
  return <article className="reader">
    {title && <h1>{title}</h1>}
    <div className="reader-content">
      {lines && <ol className="reading-lines">
        {lines.map((line, i) => <li className="reading-pair" key={line.id ?? i} data-state={line.state}>
          <p lang="de">{line.de}</p>
          {line.id && <p lang="id">{line.id}</p>}
        </li>)}
      </ol>}
      {children}
    </div>
    {actions && <div className="actions">{actions}</div>}
  </article>;
}

export function ShelfEmpty({ onReset }: { onReset?: () => void }) {
  return <EmptyState icon={<Icon name="book" />} title="Belum ada bacaan di sini"
    description="Kategori ini belum memuat buku. Coba kategori lain atau mulai dari materi."
    actionLabel={onReset ? 'Lihat materi' : undefined} onAction={onReset} />;
}

export function PreviewActions({
  onRead, onListen, onBack, readLabel = 'Baca',
}: { onRead: () => void; onListen: () => void; onBack: () => void; readLabel?: string }) {
  return <>
    <KButton variant="primary" onClick={onRead}>{readLabel}</KButton>
    <KButton variant="secondary" onClick={onListen}><Icon name="play" />Dengarkan</KButton>
    <KButton variant="text" onClick={onBack}><Icon name="back" />Kembali ke rak</KButton>
  </>;
}
