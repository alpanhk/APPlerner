import { createStore } from 'zustand/vanilla';
import { homeRoute, tabForRoute, type Route, type Tab } from './routes';

type NavigationState = {
  route: Route;
  tab: Tab;
  stacks: Record<Tab, Route[]>;
  push: (route: Route) => void;
  replace: (route: Route) => void;
  selectTab: (tab: Tab) => void;
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
    },
    push(route) {
      const tab = tabForRoute(route);
      const stack = get().stacks[tab];
      if (sameRoute(stack[stack.length - 1], route)) {
        set({ tab, route });
        return;
      }
      const next = [...stack, route];
      const bounded = next.length > 20 ? [next[0], ...next.slice(-19)] : next;
      set({ tab, route, stacks: { ...get().stacks, [tab]: bounded } });
    },
    replace(route) {
      const tab = tabForRoute(route);
      const stack = get().stacks[tab];
      const next = stack.length === 1 ? [stack[0], route] : [...stack.slice(0, -1), route];
      set({ tab, route, stacks: { ...get().stacks, [tab]: sameRoute(stack[0], route) ? [route] : next } });
    },
    selectTab(tab) {
      const stack = get().stacks[tab];
      set({ tab, route: stack[stack.length - 1] });
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
