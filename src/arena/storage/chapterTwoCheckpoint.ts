import { profileKey } from './profiles';
import { CHAPTER_TWO } from '../data/story/chapters';
export const CHAPTER_TWO_KEY = 'lernen.chapter02.kiosk.v1';
export const STEPS = ['crate','question','basket','end','clock','clock-new','clock-eight','clock-quarter-after','clock-quarter-before','weekdays','day','day-new','market-question','pre-day','pre-morning','pre-hour','pre-month','pre-season','pre-none','pre-compose','message','pre-new','transfer-question','transfer-time','journal','review'] as const;
export type Step = typeof STEPS[number];
export function sceneForStep(step: string): string {
 if (['crate','question','basket'].includes(step)) return 's01';
 if (['end','clock','clock-new','clock-eight','clock-quarter-after','clock-quarter-before','weekdays','day','day-new','market-question'].includes(step)) return 's02';
 if (['pre-day','pre-morning','pre-hour','pre-month','pre-season','pre-none','pre-compose','message','pre-new'].includes(step)) return 's03';
 if (['transfer-question','transfer-time'].includes(step)) return 'transfer';
 return 'penutup';
}
export function sceneTitleForStep(step:string):string {const id=sceneForStep(step);return CHAPTER_TWO.scenes.find(scene=>scene.id===id)?.title ?? CHAPTER_TWO.title;}
export function savedChapterTwoStep():Step {try {const raw=JSON.parse(localStorage.getItem(profileKey(CHAPTER_TWO_KEY))||'null');return STEPS.includes(raw?.step) ? raw.step : 'crate';}catch{return 'crate';}}
