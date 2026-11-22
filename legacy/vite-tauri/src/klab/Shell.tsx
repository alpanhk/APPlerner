import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TABS, tabForRoute, type Route, type Tab } from './routes';
import Icon from './Icon';
import VocabularyFloatingPanel from './VocabularyFloatingPanel';
import AssetCollectionPage from './pages/AssetCollectionPage';
import './shell.css';

type Props = {
  route: Route;
  onNavigate: (tab: Tab) => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
  notice?: string;
  focused?: boolean;
  children: ReactNode;
};

function AppMenu({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  const menuId = useId();
  const menu = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const native = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;

  useEffect(() => {
    if (native || !fallbackOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || menu.current?.contains(target) || trigger.current?.contains(target)) return;
      if (menu.current?.contains(document.activeElement)) trigger.current?.focus();
      setFallbackOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setFallbackOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [fallbackOpen, native]);

  function select(tab: Tab) {
    if (native) menu.current?.hidePopover();
    else setFallbackOpen(false);
    onSelect(tab);
  }

  return <>
    <button type="button" className="klab-icon-button klab-nav-trigger" aria-label="Menu navigasi"
      aria-controls={menuId} popoverTarget={native ? menuId : undefined}
      aria-expanded={native ? undefined : fallbackOpen} ref={trigger}
      onClick={native ? undefined : () => setFallbackOpen(open => !open)}>
      <Icon name="grid" />
    </button>
    <nav id={menuId} ref={menu} className="klab-nav-popover" aria-label="Navigasi utama"
      popover={native ? 'auto' : undefined} hidden={!native && !fallbackOpen}>
      <ul role="list">
        {TABS.map(tab => <li key={tab.id}>
          <button type="button" aria-current={active === tab.id ? 'page' : undefined} onClick={() => select(tab.id)}>
            <Icon name={tab.id} /><span>{tab.label}</span>
          </button>
        </li>)}
      </ul>
    </nav>
  </>;
}

export default function Shell({ route, onNavigate, theme, onThemeChange, notice, focused = false, children }: Props) {
  const content = useRef<HTMLElement>(null);
  const collectionTrigger = useRef<HTMLButtonElement>(null);
  const collectionDialog = useRef<HTMLDivElement>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);

  // RUTE 1a: bila rute koleksi tersedia, 1a memakai halaman yang sama lewat
  // pages/index.ts. Tombol Shell ini menjamin Koleksi tetap terjangkau.
  useEffect(() => {
    if (!collectionOpen) return;
    const target = collectionDialog.current?.querySelector<HTMLElement>('[data-autofocus]')
      ?? collectionDialog.current;
    target?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeCollection();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [collectionOpen]);

  function closeCollection() {
    setCollectionOpen(false);
    window.requestAnimationFrame(() => collectionTrigger.current?.focus({ preventScroll: true }));
  }

  function selectTab(tab: Tab) {
    content.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    onNavigate(tab);
  }

  return <div className="klab-app klab-navigation-shell" data-theme={theme} data-focused={focused || undefined}>
    <a className="klab-skip" href="#klab-content">Lewati navigasi</a>
    <div className="klab-workspace">
      {!focused && <header className="klab-topbar klab-shell-header">
        <span className="klab-shell-brand" aria-label="Lernen">lernen</span>
        <div className="klab-shell-controls">
          {notice && <span className="klab-shell-notice">{notice}</span>}
          <button ref={collectionTrigger} className="klab-collection-trigger" type="button"
            aria-haspopup="dialog" aria-expanded={collectionOpen} aria-label="Buka koleksi aset dan pratinjau media"
            onClick={() => setCollectionOpen(true)}>
            <Icon name="book" /><span>Koleksi media</span>
          </button>
          <button className="klab-icon-button klab-theme-toggle" type="button"
            aria-label={theme === 'light' ? 'Gunakan tema gelap' : 'Gunakan tema terang'} onClick={onThemeChange}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
          </button>
          <AppMenu active={tabForRoute(route)} onSelect={selectTab} />
        </div>
      </header>}
      <main id="klab-content" className="klab-shell-content" tabIndex={-1} ref={content}>{children}</main>
    </div>
    <VocabularyFloatingPanel />
    {collectionOpen && <div className="klab-collection-overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeCollection(); }}>
      <div className="klab-collection-dialog" role="dialog" aria-modal="true"
        aria-label="Koleksi aset dan pratinjau media" ref={collectionDialog} tabIndex={-1}>
        <div className="klab-collection-dialog-head">
          <h2 data-autofocus tabIndex={-1}>Koleksi aset &amp; pratinjau media</h2>
          <button type="button" className="klab-collection-close" aria-label="Tutup koleksi"
            onClick={closeCollection}>&times;</button>
        </div>
        <div className="klab-collection-dialog-body">
          <AssetCollectionPage onBack={closeCollection} />
        </div>
      </div>
    </div>}
  </div>;
}

