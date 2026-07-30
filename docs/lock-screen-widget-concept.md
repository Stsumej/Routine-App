# Lock-screen widget — concept spec (not built)

The design reference includes a third frame: a dark lock-screen mockup showing the current
time/date plus a small card with the day's streak (🔥 N day streak), optionally the active
routine name, and an "X of Y left" remaining count.

**This is not implemented as part of the web app**, and it can't be: iOS and Android lock-screen
/ home-screen widgets are rendered by the OS itself from a native widget extension, not from a
web page. A PWA has no API to draw into that surface. Treat this doc as the spec for a future
native follow-up, not a task the web build can pick up.

## What it would take

**iOS — WidgetKit**
- A separate Widget Extension target (Swift/SwiftUI) added to a native or React Native host app.
- Data handed to the widget via an **App Group**-shared `UserDefaults` (or a small shared SQLite/
  file store) that the main app writes to whenever streak/routine state changes.
- A `TimelineProvider` that reloads the widget's snapshot at sensible points (e.g. on app
  background, at midnight for the day rollover, and after a checklist toggle) — widgets don't
  get to poll continuously, so the timeline has to be planned around when the numbers can change.
- Lock Screen widget family (`accessoryRectangular` / `accessoryCircular`) for iOS 16+, sized per
  Apple's constraints (no arbitrary layout — this reference's card would need to be redrawn to fit
  the accessory widget's fixed regions).

**Android — Glance / App Widgets**
- A `GlanceAppWidget` (Jetpack Glance) or classic `RemoteViews` widget, addable to the home screen
  or (on supported devices/launchers) the lock screen.
- State shared via a `DataStore`/`SharedPreferences` the widget's `GlanceStateDefinition` reads,
  updated by the app the same way as above (on toggle, and a daily rollover trigger via
  `WorkManager`).

## Content variants (from the design's `widgetContent` prop)
Carry these three forward as the widget's display modes, matching the reference:
- `streak-only` — just "🔥 N day streak".
- `streak-remaining` (default) — streak plus "X of Y left" for today's active routine.
- `streak-remaining-name` — adds the routine name ("Morning routine") above the streak.

## Data contract with the main app
Whatever native shell eventually hosts this needs to read the same source of truth this web app
already computes — `computeStreak()` (src/lib/streak.ts) and today's checklist done/total counts
(src/store/selectors.ts `useTodayLog`) — so the widget never drifts from what's shown on Home/Night.
If the native app and the PWA are meant to share one account, that also means settling on a real
backend/sync layer first (today everything is local-only via `localStorage`), since a widget
can't read another app's `localStorage`.

## Recommendation
Don't build this until there's a native (or React Native) shell to host the extension in — it's
out of scope for a web PWA by platform design, not by omission. Revisit once/if the product
commits to native distribution.
