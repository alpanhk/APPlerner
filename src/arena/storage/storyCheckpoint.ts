import type { Progress } from '../types';
import { PROLOG_META } from '../data/story/prolog';
import { CHAPTER_ONE, CHAPTER_TWO, KIOSK_SCENE } from '../data/story/chapters';
import { profileKey } from './profiles';

export type ContinueDestination = 'story' | 'chapter-one' | 'kiosk';
/** Exactly the recovery path used by Continue, including pre-profile saves. */
export function continueDestination(saved: Progress | null): ContinueDestination {
  if (!saved?.prologCompleted || !saved.flags?.letterOpened) return 'story';
  return localStorage.getItem(profileKey('lernen.chapter02.active')) === '1' ? 'kiosk' : 'chapter-one';
}
export function checkpointTitle(destination: ContinueDestination): {label:string; title:string; scene?:string} {
  if (destination === 'chapter-one') return {label:'Bab 01', title:CHAPTER_ONE.title};
  if (destination === 'kiosk') return {label:'Bab 02', title:CHAPTER_TWO.title, scene:KIOSK_SCENE.title};
  return {label:'Prolog', title:PROLOG_META.title};
}
