import type { Progress } from '../types';
import { PROLOG_META } from '../data/story/prolog';
import { CHAPTER_ONE, CHAPTER_TWO, CHAPTER_THREE, CHAPTER_FOUR } from '../data/story/chapters';
import { profileKey } from './profiles';
import { savedChapterTwoStep, sceneTitleForStep } from './chapterTwoCheckpoint';

export type ContinueDestination = 'story' | 'chapter-one' | 'kiosk' | 'chapter-three' | 'chapter-four';
/** Exactly the recovery path used by Continue, including pre-profile saves. */
export function continueDestination(saved: Progress | null): ContinueDestination {
  if (!saved?.prologCompleted || !saved.flags?.letterOpened) return 'story';
  if (localStorage.getItem(profileKey('lernen.chapter04.active')) === '1') return 'chapter-four';
  if (localStorage.getItem(profileKey('lernen.chapter03.active')) === '1') return 'chapter-three';
  return localStorage.getItem(profileKey('lernen.chapter02.active')) === '1' ? 'kiosk' : 'chapter-one';
}
export function checkpointTitle(destination: ContinueDestination): {label:string; title:string; scene?:string} {
  if (destination === 'chapter-four') return {label:'Bab 04',title:CHAPTER_FOUR.title,scene:CHAPTER_FOUR.scenes[0].title};
  if (destination === 'chapter-three') {
    let index=localStorage.getItem(profileKey('lernen.chapter03.family-count.v1')) ? 1 : 0;
    try {const c=JSON.parse(localStorage.getItem(profileKey('lernen.chapter03.continuation.v1'))||'null');if(c){const scene=String(c.scene??'');index=scene.startsWith('status')||scene==='reveal'?1:scene.startsWith('visit')||scene==='owners'?2:scene.startsWith('independent')?3:4;}} catch { /* Preserve old checkpoint. */ }
    return {label:'Bab 03', title:CHAPTER_THREE.title, scene:CHAPTER_THREE.scenes[index].title};
  }
  if (destination === 'chapter-one') return {label:'Bab 01', title:CHAPTER_ONE.title};
  if (destination === 'kiosk') return {label:'Bab 02', title:CHAPTER_TWO.title, scene:sceneTitleForStep(savedChapterTwoStep())};
  return {label:'Prolog', title:PROLOG_META.title};
}
