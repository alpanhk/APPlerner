import type { LevelCode } from '../lessons/units';
import type { DrillCode } from '../drills/items';

export type Tab = 'today' | 'explore' | 'notes' | 'profile';
export type Route =
  | { name: 'today' }
  | { name: 'explore'; section: 'materials' | 'vocabulary' | 'reading' | 'practice'; level?: LevelCode }
  | { name: 'unit'; unitNo: number }
  | { name: 'lesson'; unitNo: number; lessonNo: number; sessionId: string }
  | { name: 'checkpoint'; unitNo: number; sessionId: string }
  | { name: 'drills'; code?: DrillCode }
  | { name: 'srs'; sessionId: string }
  | { name: 'reader'; textId: number }
  | { name: 'practice'; kind: 'listening' | 'writing' | 'conversation'; contentId: string; sessionId: string }
  | { name: 'exam'; sessionId?: string }
  | { name: 'notes'; noteId?: string }
  | { name: 'profile'; section: 'overview' | 'stats' | 'settings' | 'recordings' | 'recovery' | 'legacy-tools' };

export const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'explore', label: 'Jelajah' },
  { id: 'notes', label: 'Catatan' },
  { id: 'profile', label: 'Profil' },
];

export function homeRoute(tab: Tab): Route {
  if (tab === 'explore') return { name: 'explore', section: 'materials' };
  if (tab === 'profile') return { name: 'profile', section: 'overview' };
  return { name: tab };
}

export function tabForRoute(route: Route): Tab {
  if (route.name === 'today' || route.name === 'srs') return 'today';
  if (route.name === 'notes') return 'notes';
  if (route.name === 'profile') return 'profile';
  return 'explore';
}

// Compatibility mapping only; the current production navigation is untouched.
export function legacyRoute(page: string): Route | null {
  const routes: Record<string, Route> = {
    'hari-ini': { name: 'today' },
    kurikulum: { name: 'explore', section: 'materials' },
    drill: { name: 'drills' },
    kosakata: { name: 'explore', section: 'vocabulary' },
    membaca: { name: 'explore', section: 'reading' },
    latihan: { name: 'explore', section: 'practice' },
    'uji-a1': { name: 'exam' },
    statistik: { name: 'profile', section: 'stats' },
    pengaturan: { name: 'profile', section: 'settings' },
  };
  return Object.prototype.hasOwnProperty.call(routes, page) ? routes[page] : null;
}
