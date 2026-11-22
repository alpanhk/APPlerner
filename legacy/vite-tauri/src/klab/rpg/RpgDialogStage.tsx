// Komponen interaktif RPG untuk KLAB (4a). Presentasional + satu audio port.
// Cocok untuk integrasi lokal/preview sebelum persetujuan seni; tidak menulis
// dialog, tidak mengubah rute produksi, tidak mempromosikan gambar final.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { RpgAssetManifest, RpgAudioPort, RpgLayerSpec, RpgSource } from './contracts';
import './rpg.css';

export type RpgDialogStageProps = {
  sources: RpgSource[];
  manifest: RpgAssetManifest;
  audio?: RpgAudioPort;
  initialSourceId?: string;
  reduceMotion?: boolean;
  onExit?: () => void;
};

function layerStyle(spec?: RpgLayerSpec): CSSProperties {
  if (!spec) return {};
  return {
    left: spec.left, top: spec.top, width: spec.width,
    height: spec.height, transform: spec.transform,
  };
}

export default function RpgDialogStage({
  sources, manifest, audio, initialSourceId, reduceMotion, onExit,
}: RpgDialogStageProps) {
  const [sourceId, setSourceId] = useState(initialSourceId || sources[0]?.id || '');
  const [turnIndex, setTurnIndex] = useState(0);
  const [systemMotion, setSystemMotion] = useState(false);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const [audioStatus, setAudioStatus] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const source = useMemo(
    () => sources.find(item => item.id === sourceId) || sources[0],
    [sources, sourceId],
  );
  const turns = source?.dialog.turns || [];
  const turn = turns[Math.min(turnIndex, Math.max(0, turns.length - 1))];
  const reduced = motionOverride ?? reduceMotion ?? systemMotion;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemMotion(query.matches);
    const listener = (event: MediaQueryListEvent) => setSystemMotion(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(() => { setTurnIndex(0); setAudioStatus(''); }, [sourceId]);
  useEffect(() => {
    setAudioStatus('');
    return () => audio?.stop?.();
  }, [sourceId, turnIndex, audio]);

  const speakerId = turn?.speakerId || 'narrator';
  const speakerSlot = manifest.characters[speakerId];
  const narrator = speakerId === 'narrator' || speakerSlot?.visible === false;
  const visibleOthers = Object.keys(manifest.characters)
    .filter(id => manifest.characters[id].visible !== false && !manifest.characters[id].static && id !== speakerId);
  const listenerId = turn && !narrator
    ? (speakerId === 'kellner' ? ('ich' in manifest.characters ? 'ich' : visibleOthers[0])
      : ('kellner' in manifest.characters ? 'kellner' : visibleOthers[0]))
    : undefined;
  const speakerPose = turn?.pose || 'offscreen';
  const speakerFile = speakerSlot?.poses[speakerPose] || null;
  const listenerFile = listenerId ? (manifest.characters[listenerId]?.poses.offscreen
    || Object.values(manifest.characters[listenerId]?.poses || {})[0]) : null;
  const mascotSlot = manifest.characters.mascot;
  const mascotFile = mascotSlot?.poses.rest || null;
  const backgroundMap = manifest.backgrounds || manifest.background || {};
  const backgroundFile = backgroundMap[turn?.backgroundId || 'cafe'];
  const counterFile = manifest.counter || manifest.props.counter;

  const setTurn = (next: number) => {
    if (next < 0 || next >= turns.length) return;
    setTurnIndex(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setTurn(turnIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setTurn(turnIndex - 1); }
    if (event.key === 'Home') { event.preventDefault(); setTurn(0); }
    if (event.key === 'End') { event.preventDefault(); setTurn(turns.length - 1); }
  };
  const playAudio = async () => {
    if (!turn?.audio || turn.audioStatus !== 'exact-match' || !audio) return;
    const result = await audio.play(turn.audio);
    setAudioStatus(result.ok ? `Memutar ${turn.audio}.` : `Audio tidak tersedia: ${result.reason}`);
  };

  const label = (id: string) => source?.dialog.assetContract.characters[id]?.label
    || manifest.characters[id]?.label || id;
  const propLabel = (id: string) => source?.dialog.assetContract.props[id]?.label || id;
  const canPlay = !!(turn?.audio && turn.audioStatus === 'exact-match' && audio);
  const assetNote = manifest.statusText || manifest.status || manifest.versionLabel || '';

  return <div className={`klab-rpg ${reduced ? 'is-reduced' : ''}`}
    ref={rootRef} tabIndex={0} role="region" aria-label="Adegan percakapan Im Café"
    onKeyDown={onKeyDown} data-version={manifest.versionLabel?.startsWith('v02') ? 'v02' : 'v01'}>
    <a className="klab-rpg-skip" href="#klab-rpg-text">Lewati ke teks dialog</a>
    <header className="klab-rpg-head">
      <div>
        <p className="klab-rpg-eyebrow">Kandidat pengembangan · bukan seni final</p>
        <h2>{source?.dialog.title || 'Im Café'}</h2>
      </div>
      <div className="klab-rpg-tools">
        <label>Konten
          <select value={sourceId} onChange={event => setSourceId(event.target.value)}
            aria-label="Pilih bacaan atau percakapan">
            {sources.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" aria-pressed={reduced} className="klab-rpg-secondary"
          onClick={() => setMotionOverride(!reduced)}>Kurangi gerakan</button>
        {onExit && <button type="button" className="klab-rpg-secondary" onClick={onExit}>Keluar</button>}
      </div>
    </header>

    <p className="klab-rpg-status" role="status">{assetNote}{manifest.audioNote ? ` ${manifest.audioNote}` : ''}</p>
    {source?.note && <p className="klab-rpg-note">{source.note}</p>}

    <section className="klab-rpg-stage" aria-label="Panggung adegan">
      <div className="klab-rpg-layer klab-rpg-bg" style={{
        ...layerStyle(manifest.layout?.background),
        backgroundImage: backgroundFile ? `url("${manifest.assetPackage}${backgroundFile}")` : undefined,
      }} aria-hidden="true">
        {!backgroundFile && <span className="klab-rpg-placeholder">Latar: kafe · aset belum tersedia</span>}
      </div>
      {counterFile && <div className="klab-rpg-layer klab-rpg-counter" style={{
        ...layerStyle(manifest.layout?.counter),
        backgroundImage: `url("${manifest.assetPackage}${counterFile}")`,
      }} aria-hidden="true" />}

      <div className="klab-rpg-layer klab-rpg-characters">
        {mascotFile && <div className="klab-rpg-character" style={{
          ...layerStyle(manifest.layout?.characters?.mascot),
          backgroundImage: `url("${manifest.assetPackage}${mascotFile}")`,
        }} data-speaking="false" aria-hidden="true" />}
        {listenerId && <div className="klab-rpg-character" style={{
          ...layerStyle(manifest.layout?.characters?.[listenerId]),
          backgroundImage: listenerFile ? `url("${manifest.assetPackage}${listenerFile}")` : undefined,
        }} data-speaking="false" aria-hidden="true">
          {!listenerFile && <span className="klab-rpg-placeholder">Pendengar: {label(listenerId)}</span>}
        </div>}
        {!narrator && <div className="klab-rpg-character is-speaker" style={{
          ...layerStyle(manifest.layout?.characters?.[speakerId]),
          backgroundImage: speakerFile ? `url("${manifest.assetPackage}${speakerFile}")` : undefined,
        }} data-speaking={reduced ? 'static' : 'true'} aria-hidden="true">
          {!speakerFile && <span className="klab-rpg-placeholder">Pembicara: {label(speakerId)} · pose {speakerPose} · aset belum tersedia</span>}
        </div>}
      </div>

      <div className="klab-rpg-layer klab-rpg-props" aria-hidden="true">
        {(turn?.propIds || []).map(id => {
          const file = manifest.props[id];
          return <div key={id} className="klab-rpg-prop" data-prop={id}
            style={{
              ...layerStyle(manifest.layout?.props?.[id]),
              backgroundImage: file ? `url("${manifest.assetPackage}${file}")` : undefined,
            }}>
            {!file && <span className="klab-rpg-placeholder">Properti: {propLabel(id)} · belum tersedia</span>}
          </div>;
        })}
      </div>

      <div className="klab-rpg-layer klab-rpg-text">
        <div id="klab-rpg-text" className="klab-rpg-panel" role="group" aria-live="polite" aria-atomic="true"
          data-narrator={narrator ? 'true' : 'false'}>
          <p className="klab-rpg-speaker">{narrator ? 'Narasi (di luar layar)' : label(speakerId)}
            {turn?.kind === 'adaptation' ? ' · adaptasi' : ''}
            {turn?.stageDirection ? ' · arahan panggung' : ''}
          </p>
          <p className="klab-rpg-de" lang="de">{turn?.de || 'Dialog belum tersedia.'}</p>
          <p className="klab-rpg-id" lang="id">{turn?.id || ''}</p>
          <p className="klab-rpg-meta">Pose: {speakerPose}
            {(turn?.propIds || []).length ? ` · Properti: ${turn.propIds.map(propLabel).join(', ')}` : ''}
          </p>
        </div>
      </div>
    </section>

    <nav className="klab-rpg-controls" aria-label="Navigasi giliran">
      <button type="button" className="klab-rpg-secondary" disabled={turnIndex === 0}
        onClick={() => setTurn(turnIndex - 1)}>Kembali</button>
      <span aria-live="polite">{turns.length ? `${turnIndex + 1} / ${turns.length}` : '0 / 0'}</span>
      <button type="button" className="klab-rpg-primary" disabled={turnIndex >= turns.length - 1}
        onClick={() => setTurn(turnIndex + 1)}>Lanjut</button>
      {canPlay && <button type="button" className="klab-rpg-secondary" onClick={() => void playAudio()}>Dengarkan lagi</button>}
    </nav>
    <p className="klab-rpg-audio-status" role="status">{audioStatus || (canPlay ? '' : turn?.audioStatus === 'adaptation-no-audio'
      ? 'Adaptasi tanpa audio; klip lama tidak dipakai.' : 'Klip tidak tersedia; teks tetap dapat dibaca.')}</p>
    <p className="klab-rpg-hint">Keyboard: ←/→ giliran, Home/End awal/akhir. Fokus tidak dicuri saat giliran berubah.</p>
  </div>;
}
