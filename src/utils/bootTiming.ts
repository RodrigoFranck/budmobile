import { AppState, type AppStateStatus } from 'react-native';

export type BootLaunchKind = 'cold' | 'background_return';

type BootDetail = Record<string, string | number | boolean | null | undefined>;

const bootStartedAt = Date.now();
const marks = new Map<string, number>();
let splashDismissed = false;
let launchKind: BootLaunchKind = 'cold';
let appState: AppStateStatus = AppState.currentState;
let listenerAttached = false;

function ensureAppStateListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  AppState.addEventListener('change', (next) => {
    const prev = appState;
    appState = next;
    if ((prev === 'background' || prev === 'inactive') && next === 'active') {
      launchKind = 'background_return';
      bootMark('app_foreground', { from: prev, splashDismissed });
    }
    if (next === 'background' || next === 'inactive') {
      bootMark('app_background', { state: next, splashDismissed });
    }
  });
}

export function getBootElapsedMs(fromMark?: string): number {
  const base = fromMark ? marks.get(fromMark) : bootStartedAt;
  return Date.now() - (base ?? bootStartedAt);
}

export function getBootLaunchKind(): BootLaunchKind {
  return launchKind;
}

export function isBootSplashDismissed(): boolean {
  return splashDismissed;
}

export function bootMark(name: string, detail?: BootDetail): number {
  ensureAppStateListener();
  const elapsed = Date.now() - bootStartedAt;
  marks.set(name, Date.now());
  const extra = detail
    ? ` ${JSON.stringify({ launch: launchKind, ...detail })}`
    : ` ${JSON.stringify({ launch: launchKind })}`;
  console.log(`[boot] +${elapsed}ms ${name}${extra}`);
  return elapsed;
}

export function bootMarkOnce(name: string, detail?: BootDetail): number | null {
  if (marks.has(name)) return null;
  return bootMark(name, detail);
}

export function markBootSplashDismissed(detail?: BootDetail): void {
  if (splashDismissed) return;
  splashDismissed = true;
  bootMark('splash_dismissed', {
    ...detail,
    totalMs: Date.now() - bootStartedAt,
  });
}

export function shouldShowBootSplash(): boolean {
  ensureAppStateListener();
  return !splashDismissed;
}
