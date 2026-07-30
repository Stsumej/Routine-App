import { useEffect, useMemo, useState } from 'react';
import { THEME_PAIRS, TRANSITION_WINDOW_MINUTES, type ThemeMode } from './tokens';
import { lerpHex } from './color';
import { getSunsetLocalHour, type GeoCoords } from './sunset';

const GEOLOCATION_TIMEOUT_MS = 4000;

export interface ThemeResult {
  progress: number; // 0 (full day) .. 1 (full night)
  isNight: boolean;
  sunsetLocalHour: number | null;
  cssVars: Record<string, string>;
  debugLabel: string;
}

function computeProgress(mode: ThemeMode, now: Date, geo: GeoCoords | null): { progress: number; sunsetLocalHour: number | null } {
  if (mode === 'always-light') return { progress: 0, sunsetLocalHour: null };
  if (mode === 'always-dusk') return { progress: 1, sunsetLocalHour: null };

  const sunsetHour = getSunsetLocalHour(now, geo);
  const sunsetMin = sunsetHour * 60;
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const half = TRANSITION_WINDOW_MINUTES / 2;
  const start = sunsetMin - half;
  const end = sunsetMin + half;
  const progress = nowMin <= start ? 0 : nowMin >= end ? 1 : (nowMin - start) / TRANSITION_WINDOW_MINUTES;
  return { progress, sunsetLocalHour: sunsetHour };
}

function formatSunset(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

/**
 * Requests device geolocation once (4s timeout, falls back to null on denial/timeout/unsupported).
 */
function useGeolocation(): GeoCoords | null {
  const [geo, setGeo] = useState<GeoCoords | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        // denied / unavailable / timed out -> stay null, callers fall back to the fixed 19:00 default
      },
      { timeout: GEOLOCATION_TIMEOUT_MS },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return geo;
}

/**
 * Real sunset-anchored theme engine. Recomputes progress every 60s against the real clock
 * (never cached/simulated), and produces CSS custom property values by hex-lerping every
 * design token between its day/night pair according to progress.
 */
export function useTheme(mode: ThemeMode): ThemeResult {
  const geo = useGeolocation();
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const now = new Date(clock);
    const { progress, sunsetLocalHour } = computeProgress(mode, now, geo);

    const cssVars: Record<string, string> = {};
    for (const [token, [day, night]] of Object.entries(THEME_PAIRS)) {
      cssVars[`--${token}`] = progress <= 0 ? day : progress >= 1 ? night : lerpHex(day, night, progress);
    }

    let debugLabel: string;
    if (mode !== 'automatic') {
      debugLabel = mode === 'always-light' ? 'Manual · always Quiet ritual' : 'Manual · always Deep water';
    } else if (sunsetLocalHour != null) {
      debugLabel = `Automatic · sunset ~${formatSunset(sunsetLocalHour)} · ${Math.round(progress * 100)}% dusk${geo ? '' : ' (default time, location unavailable)'}`;
    } else {
      debugLabel = 'Automatic';
    }

    return { progress, isNight: progress >= 0.5, sunsetLocalHour, cssVars, debugLabel };
  }, [mode, clock, geo]);
}
