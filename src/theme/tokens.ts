// Design Tokens — "Quiet ritual" (day) -> "Deep water" (night), from the design handoff README.
// Each entry is [dayHex, nightHex]; every themed value in the app is derived by lerping between these.
export const THEME_PAIRS = {
  bg: ['#F7F3EB', '#EEF1F2'],
  card: ['#F0E8D9', '#DCE3E6'],
  divider: ['#E3D8C2', '#CBD6DA'],
  border: ['#DACEB6', '#A9BCC2'],
  text: ['#38352E', '#1C2830'],
  text2: ['#918A7A', '#5E7C87'],
  text3: ['#B3AB98', '#8FA3AB'],
  accent: ['#C97B4A', '#2E4550'],
  'accent-tint': ['#EAD9C0', '#B9C7CC'],
  'accent-mid': ['#9C6B3F', '#3F5964'],
  'text-on-accent': ['#FBF1E8', '#EEF1F2'],
} as const satisfies Record<string, readonly [string, string]>;

export type ThemeToken = keyof typeof THEME_PAIRS;

export type ThemeMode = 'automatic' | 'always-light' | 'always-dusk';

export const DEFAULT_SUNSET_HOUR = 19; // fixed fallback: 7:00 PM local
export const TRANSITION_WINDOW_MINUTES = 100; // centered on sunset: -50min .. +50min
