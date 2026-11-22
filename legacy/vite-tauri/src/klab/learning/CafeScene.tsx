// Adegan Im Café — 7 layer WebP cel menurut manifest produksi.
// Urutan belakang→depan: latar, pemelajar, barista, meja, kopi.
// Pose mengikuti pembicara; cangkir muncul saat giliran pesanan.
// Folder aset ini milik 2a; tidak menyentuh src/assets (1a) maupun CSS 4a.
import background from './assets/cafe-cel/cafe-background.webp';
import learnerNeutral from './assets/cafe-cel/learner-neutral.webp';
import learnerSpeaking from './assets/cafe-cel/learner-speaking.webp';
import baristaNeutral from './assets/cafe-cel/barista-neutral.webp';
import baristaSpeaking from './assets/cafe-cel/barista-speaking.webp';
import counter from './assets/cafe-cel/counter.webp';
import coffee from './assets/cafe-cel/coffee-cup.webp';
import { CAFE_LAYERS } from './logic';

export type CafeSpeaker = 'barista' | 'learner';

export type CafeSceneProps = {
  speaker?: CafeSpeaker;
  showCoffee?: boolean;
};

const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;

function layerStyle(rectPx: readonly [number, number, number, number], zIndex: number) {
  return {
    position: 'absolute' as const,
    left: `${(rectPx[0] / STAGE_WIDTH) * 100}%`,
    top: `${(rectPx[1] / STAGE_HEIGHT) * 100}%`,
    width: `${(rectPx[2] / STAGE_WIDTH) * 100}%`,
    height: `${(rectPx[3] / STAGE_HEIGHT) * 100}%`,
    zIndex,
    objectFit: 'contain' as const,
  };
}

const [cafeRect, learnerRect, baristaRect, counterRect, coffeeRect] = CAFE_LAYERS.map((entry) => entry.rectPx);

export function CafeScene({ speaker, showCoffee = false }: CafeSceneProps) {
  return (
    <div
      className="cafe-port-scene"
      data-speaker={speaker ?? 'none'}
      data-coffee={showCoffee ? 'shown' : 'hidden'}
      data-testid="cafe-scene"
      aria-hidden="true"
      style={{ position: 'relative', width: '100%', aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`, overflow: 'hidden' }}
    >
      <img src={background} alt="" data-layer="cafe" style={layerStyle(cafeRect, 0)} />
      <img src={learnerNeutral} alt="" data-layer="learner" data-pose="listening"
        style={layerStyle(learnerRect, 1)} hidden={speaker === 'learner'} />
      <img src={learnerSpeaking} alt="" data-layer="learner" data-pose="speaking"
        style={layerStyle(learnerRect, 1)} hidden={speaker !== 'learner'} />
      <img src={baristaNeutral} alt="" data-layer="barista" data-pose="listening"
        style={layerStyle(baristaRect, 2)} hidden={speaker === 'barista'} />
      <img src={baristaSpeaking} alt="" data-layer="barista" data-pose="speaking"
        style={layerStyle(baristaRect, 2)} hidden={speaker !== 'barista'} />
      <img src={counter} alt="" data-layer="counter" style={layerStyle(counterRect, 3)} />
      {showCoffee ? (
        <img src={coffee} alt="" data-layer="coffee" data-testid="cafe-coffee"
          style={layerStyle(coffeeRect, 4)} />
      ) : null}
    </div>
  );
}
