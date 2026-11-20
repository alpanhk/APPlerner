// Satu pengendali suara untuk tuturan, suasana, idle, dan cue.
// Prioritas: tuturan > cue > suasana/idle. Default mati; hanya satu trek
// aktif. Modul ini tidak menyentuh App/routeView/pages milik 1a/4a.
export type SoundRoute = 'today' | 'explore' | 'cafe' | 'other';

export type SoundState = {
  optIn: boolean;
  route: SoundRoute;
  speechActive: boolean;
  readingActive: boolean;
  hoerenActive: boolean;
  hidden: boolean;
  cuePlayed: boolean;
};

const STORAGE_KEY = 'lernen.learning.sound.optIn';

export function soundPriority(state: SoundState) {
  const paused = state.speechActive || state.readingActive || state.hoerenActive;
  const backgroundAllowed = state.optIn && !paused && !state.hidden;
  return {
    speech: state.speechActive,
    idle: backgroundAllowed && (state.route === 'today' || state.route === 'explore'),
    ambience: backgroundAllowed && state.route === 'cafe',
    cueAllowed: !paused,
    stop: !state.optIn || state.hidden,
  };
}

export function loadOptIn(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveOptIn(value: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // Penyimpanan bisa ditolak; status tetap berlaku selama sesi.
  }
}

export type SoundController = {
  get: () => SoundState;
  setRoute: (route: SoundRoute) => void;
  setSpeech: (active: boolean) => void;
  setReading: (active: boolean) => void;
  setHoeren: (active: boolean) => void;
  setHidden: (hidden: boolean) => void;
  setOptIn: (value: boolean) => void;
  markCue: () => void;
  subscribe: (listener: (state: SoundState, priority: ReturnType<typeof soundPriority>) => void) => () => void;
};

let current: SoundState = {
  optIn: loadOptIn(),
  route: 'other',
  speechActive: false,
  readingActive: false,
  hoerenActive: false,
  hidden: false,
  cuePlayed: false,
};
const listeners = new Set<(state: SoundState, priority: ReturnType<typeof soundPriority>) => void>();

function emit() {
  const priority = soundPriority(current);
  for (const listener of listeners) listener({ ...current }, priority);
}

export const soundController: SoundController = {
  get: () => ({ ...current }),
  setRoute(route) {
    if (current.route === route) return;
    current = { ...current, route, cuePlayed: false };
    emit();
  },
  setSpeech(active) {
    if (current.speechActive === active) return;
    current = { ...current, speechActive: active };
    emit();
  },
  setReading(active) {
    if (current.readingActive === active) return;
    current = { ...current, readingActive: active };
    emit();
  },
  setHoeren(active) {
    if (current.hoerenActive === active) return;
    current = { ...current, hoerenActive: active };
    emit();
  },
  setHidden(hidden) {
    if (current.hidden === hidden) return;
    current = { ...current, hidden };
    emit();
  },
  setOptIn(value) {
    if (current.optIn === value) return;
    saveOptIn(value);
    current = { ...current, optIn: value };
    emit();
  },
  markCue() {
    if (current.cuePlayed) return;
    current = { ...current, cuePlayed: true };
    emit();
  },
  subscribe(listener) {
    listeners.add(listener);
    listener({ ...current }, soundPriority(current));
    return () => listeners.delete(listener);
  },
};
