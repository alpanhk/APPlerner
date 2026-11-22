// Local KLAB assets copied from the reviewed interaction prototype (19 Nov 2026).
// No new/generated images here: new imagery must come from the image agent via the director.
// Titles and labels stay as HTML text so they remain accessible and translatable.
import mascotSambut from '../assets/klab/maskot-sambut.png';
import mascotFeedback from '../assets/klab/maskot-feedback.png';
import adeganKafe from '../assets/klab/adegan-kafe.webp';
import sampulImCafe from '../assets/klab/sampul-im-cafe.webp';

export const assets = {
  mascotSambut,
  mascotFeedback,
  adeganKafe,
  sampulImCafe,
} as const;

export const assetCredits = {
  mascotSambut: 'Maskot sambut KLAB, paket revisi prototipe (alpha PNG).',
  mascotFeedback: 'Maskot umpan balik KLAB, paket revisi prototipe (alpha PNG).',
  adeganKafe: 'Ilustrasi adegan kafe, paket revisi KLAB.',
  sampulImCafe: 'Sampul Im Cafe, PNG final agen gambar (ImageGen), dikonversi ke WebP; bebas tulisan.',
} as const;
