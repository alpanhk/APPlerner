import { createStore } from 'zustand/vanilla';
import { groupForRoute, homeGroupRoute, homeRoute, type NavGroup, type Route } from './routes';

type NavigationState = {
  route: Route;
  /** Grup aktif; 'story' bukan tab produksi dan tidak dirender Shell. */
  tab: NavGroup;
  stacks: Record<NavGroup, Route[]>;
  push: (route: Route) => void;
  replace: (route: Route) => void;
  selectTab: (tab: NavGroup) => void;
  back: () => boolean;
};

function sameRoute(a: Route, b: Route): boolean {
  const keys = Object.keys(a) as Array<keyof Route>;
  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
}

export function createNavigation() {
  return createStore<NavigationState>((set, get) => ({
    route: homeRoute('today'),
    tab: 'today',
    stacks: {
      today: [homeRoute('today')], explore: [homeRoute('explore')],
      notes: [homeRoute('notes')], profile: [homeRoute('profile')],
      // ROMBAK UI/UX: cerita punya stack sendiri; tombol Kembali di story
      // tidak pernah memunculkan rute produksi yang sedang dikerjakan peserta.
      story: [homeGroupRoute('story')],
    },
    push(route) {
      const group = groupForRoute(route);
      const stack = get().stacks[group];
      if (sameRoute(stack[stack.length - 1], route)) {
        set({ tab: group, route });
        return;
      }
      const next = [...stack, route];
      const bounded = next.length > 20 ? [next[0], ...next.slice(-19)] : next;
      set({ tab: group, route, stacks: { ...get().stacks, [group]: bounded } });
    },
    replace(route) {
      const group = groupForRoute(route);
      const stack = get().stacks[group];
      const next = stack.length === 1 ? [stack[0], route] : [...stack.slice(0, -1), route];
      set({ tab: group, route, stacks: { ...get().stacks, [group]: sameRoute(stack[0], route) ? [route] : next } });
    },
    selectTab(group) {
      const stack = get().stacks[group];
      set({ tab: group, route: stack[stack.length - 1] });
    },
    back() {
      const { tab, stacks } = get();
      if (stacks[tab].length <= 1) return false;
      const next = stacks[tab].slice(0, -1);
      set({ route: next[next.length - 1], stacks: { ...stacks, [tab]: next } });
      return true;
    },
  }));
}
