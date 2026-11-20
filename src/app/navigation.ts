// Router/back KLAB + jembatan kompatibilitas ke useNav lama.
// src/klab/navigation tetap sumber rute; useNav dipertahankan agar halaman lama
// yang memanggil setPage/startDrill tidak putus selama migrasi bertahap.
import { createNavigation } from "../klab/navigation";
import { groupForRoute, homeGroupRoute, legacyRoute, tabForRoute, type NavGroup, type Route } from "../klab/routes";
import { useNav } from "../stores/nav";

const baseNavigation = createNavigation();
const baseSelectTab = baseNavigation.getState().selectTab;

function sameRoute(a: Route, b: Route): boolean {
  const keys = Object.keys(a) as Array<keyof Route>;
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

// FIX-U08: rute sesi (lesson/checkpoint/...) secara sengaja termasuk tab explore.
// Jadi selectTab('explore') dari tengah pelajaran dulu memulihkan stack explore
// yang berisi pelajaran itu sendiri — nav menyala tetapi konten tidak berubah.
// Klik tab yang sedang aktif dari rute bertingkat harus kembali ke root tab.
baseNavigation.setState({
  selectTab(tab: NavGroup) {
    const state = baseNavigation.getState();
    const root = homeGroupRoute(tab);
    if (groupForRoute(state.route) === tab && !sameRoute(state.route, root)) {
      baseNavigation.setState({
        tab,
        route: root,
        stacks: { ...state.stacks, [tab]: [root] },
      });
      return;
    }
    baseSelectTab(tab);
  },
});

export const navigation = baseNavigation;
export type Navigation = typeof navigation;

export function pageForRoute(route: Route): string {
  switch (route.name) {
    case "today": return "hari-ini";
    case "srs": return "hari-ini";
    case "explore":
      if (route.section === "vocabulary") return "kosakata";
      if (route.section === "reading") return "membaca";
      if (route.section === "practice") return "latihan";
      return "kurikulum";
    case "unit":
    case "lesson":
    case "checkpoint": return "kurikulum";
    case "drills": return "drill";
    case "reader": return "membaca";
    case "practice": return "latihan";
    case "exam": return "uji-a1";
    case "profile":
      return route.section === "stats" ? "statistik"
        : route.section === "settings" ? "pengaturan" : "hari-ini";
    default: return "hari-ini";
  }
}

function routeForPage(page: string): Route | null {
  return legacyRoute(page);
}

// Pasang jembatan dua arah sekali di App. Guard `syncing` mencegah loop karena
// kedua store saling mengubah. Mengembalikan fungsi lepas pasang untuk HMR/test.
export function installNavBridge(): () => void {
  let syncing = false;
  const fromLegacy = useNav.subscribe((legacy) => {
    if (syncing) return;
    const route = routeForPage(legacy.page);
    if (!route) return;
    const current = navigation.getState().route;
    if (pageForRoute(current) === legacy.page) return;
    syncing = true;
    try { navigation.getState().replace(route); } finally { syncing = false; }
    void persistLastRoute(route);
  });
  const fromKlab = navigation.subscribe((state) => {
    if (syncing) return;
    const page = pageForRoute(state.route);
    syncing = true;
    try {
      if (useNav.getState().page !== page) useNav.setState({ page });
    } finally { syncing = false; }
    void persistLastRoute(state.route);
  });
  return () => { fromLegacy(); fromKlab(); };
}

const LAST_ROUTE_KEY = "ui_navigation_v1";

// Rute terakhir yang tervalidasi disimpan di config. Kegagalan tulis tidak
// menghalangi belajar; tidak ada status "tersimpan" yang dipalsukan.
export async function persistLastRoute(route: Route): Promise<void> {
  try {
    const { default: getDb } = await import("../stores/db");
    const db = await getDb();
    await db.execute(
      "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [
        LAST_ROUTE_KEY,
        JSON.stringify(route.name === "reader" ? { name: "reader", textId: route.textId } : route),
      ],
    );
  } catch { /* config bisa gagal; rute tetap berlaku di memori */ }
}

export async function loadLastRoute(): Promise<Route | null> {
  try {
    const { default: getDb } = await import("../stores/db");
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [LAST_ROUTE_KEY]);
    if (!rows.length) return null;
    const value = JSON.parse(rows[0].value) as Route;
    if (value?.name === "reader") {
      return Number.isInteger(value.textId) && value.textId >= 1
        ? { name: "reader", textId: value.textId }
        : null;
    }
    return value && typeof value === "object" && typeof value.name === "string" ? value : null;
  } catch { return null; }
}

export { tabForRoute };
