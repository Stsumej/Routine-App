# Ritual

A mobile-first PWA for tracking morning/night health routines, mood check-ins, a
mood-vs-routine insights view, and a reflections journal. Built from a design handoff
spec (`design-reference.dc.html` + README) into a real React app.

## Stack

React 19 + TypeScript, Vite, React Router (client-side routing/transitions), Zustand
(state, persisted to `localStorage`), Lucide icons. No backend — all data lives on-device.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks, builds, then injects hashed bundle paths into the service worker
npm run preview   # serve the production build locally
```

## Project structure

- `src/theme/` — the sunset-based day/night theme engine (NOAA sunset equation, hex-lerp
  across the 12 design tokens, 100-minute transition window, manual overrides). Applies
  CSS custom properties at `:root`; no component hardcodes a color.
- `src/store/` — Zustand store: routine step definitions (shared by Home/Night/Builder),
  per-date daily logs, reflections journal, settings, plus derived selectors (streak,
  consistency, mood correlations, energy chart data).
- `src/lib/` — pure algorithms: mood-correlation ranking, quadratic-Bézier energy chart
  smoothing, streak/consistency math, date helpers, quote-of-the-day.
- `src/screens/` — Home, Night, Insights, Reflections (archive), Routine Builder, Profile
  (theme mode + integration settings; not in the original 6-screen spec, added because the
  theme engine's manual overrides need a UI surface somewhere).
- `src/components/` — shared UI primitives (Card, Pills, CheckRow, TabBar, etc).
- `docs/lock-screen-widget-concept.md` — the lock-screen widget from the design is a native
  OS-widget concept, not a web feature; that doc specs what a future native extension would need.

## Data model notes

Everything is local-first (`localStorage` via Zustand's persist middleware) — there's no
account system or sync yet. Mood correlations and the energy chart are computed from real
logged check-ins, not mock data, so they start empty and fill in as you use the app day to
day. See `src/lib/correlation.ts` and `src/lib/streak.ts` for the exact algorithms (mirrors
the design spec's rolling-window mood-correlation and streak-threshold logic).

## Deploying

See the deployment notes shared alongside this build for Vercel/Netlify setup and HTTPS
requirements for testing "Add to Home Screen" on a real device.
