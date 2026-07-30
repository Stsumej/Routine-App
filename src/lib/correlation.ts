import type { DailyLog, RoutinePeriod, RoutineStepDef } from '../store/types';
import { lastNDaysISO } from './date';

export const MOOD_SCALE = ['Rough', 'Low', 'Okay', 'Good', 'Great'] as const;
export const ENERGY_SCALE = ['Low', 'Medium', 'High'] as const;

export function moodValueToLabel(v: number | undefined): (typeof MOOD_SCALE)[number] | null {
  return v && v >= 1 && v <= 5 ? MOOD_SCALE[v - 1] : null;
}
export function moodLabelToValue(label: (typeof MOOD_SCALE)[number]): number {
  return MOOD_SCALE.indexOf(label) + 1;
}
export function energyValueToLabel(v: string | undefined): (typeof ENERGY_SCALE)[number] | null {
  if (!v) return null;
  const found = ENERGY_SCALE.find((e) => e.toLowerCase() === v);
  return found ?? null;
}

// Numeric mapping used only for the "Energy, past 7 days" chart (0-100 scale).
const ENERGY_SCORE: Record<string, number> = { low: 30, medium: 60, high: 90 };

export function energyScoreForLog(log: DailyLog | undefined): number {
  if (!log) return 0;
  const scores = [log.energy, log.eveningEnergy].filter(Boolean).map((e) => ENERGY_SCORE[e as string]);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Same-day mood: average of morning + evening mood entries, whichever are present. */
export function effectiveMood(log: DailyLog | undefined): number | undefined {
  if (!log) return undefined;
  const vals = [log.mood, log.eveningMood].filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function hasRoutineSnapshot(log: DailyLog | undefined): boolean {
  return !!log && (log.morningStepIds.length > 0 || log.nightStepIds.length > 0);
}

export interface MoodCorrelation {
  id: string;
  text: string;
  period: RoutinePeriod;
  delta: number;
  fillFraction: number; // clamp(delta/1.2, 0.08, 1)
}

const MAX_DELTA = 1.2;
const MIN_FILL = 0.08;

export const ROLLING_WINDOW_DAYS = 21; // "past 3 weeks", matching the design reference's framing

/**
 * Per-step delta = avgMoodWhenDone - avgMoodWhenNotDone across the rolling window.
 * A day only counts toward any step's averages if it has both a mood entry and a routine
 * snapshot recorded. Steps without contrast (never done, or always done) in the window are
 * omitted — there's no signal to rank them on yet.
 */
export function computeMoodCorrelations(
  logsByDate: Record<string, DailyLog>,
  morningSteps: RoutineStepDef[],
  nightSteps: RoutineStepDef[],
  todayIso: string,
  windowDays = ROLLING_WINDOW_DAYS,
): MoodCorrelation[] {
  const windowDates = lastNDaysISO(todayIso, windowDays);
  const eligibleDays = windowDates
    .map((d) => logsByDate[d])
    .filter((log): log is DailyLog => !!log && hasRoutineSnapshot(log) && effectiveMood(log) !== undefined);

  const steps: { id: string; text: string; period: RoutinePeriod }[] = [
    ...morningSteps.map((s) => ({ id: s.id, text: s.text, period: 'morning' as const })),
    ...nightSteps.map((s) => ({ id: s.id, text: s.text, period: 'night' as const })),
  ];

  const results: MoodCorrelation[] = [];
  for (const step of steps) {
    let doneSum = 0;
    let doneN = 0;
    let notSum = 0;
    let notN = 0;
    for (const log of eligibleDays) {
      const mood = effectiveMood(log)!;
      const doneMap = step.period === 'morning' ? log.morningDone : log.nightDone;
      const stepIds = step.period === 'morning' ? log.morningStepIds : log.nightStepIds;
      if (!stepIds.includes(step.id)) continue; // step didn't exist yet on this historical day
      if (doneMap[step.id]) {
        doneSum += mood;
        doneN++;
      } else {
        notSum += mood;
        notN++;
      }
    }
    if (doneN === 0 || notN === 0) continue; // no contrast yet — not enough data to rank this step
    const delta = doneSum / doneN - notSum / notN;
    results.push({
      id: step.id,
      text: step.text,
      period: step.period,
      delta,
      fillFraction: Math.max(MIN_FILL, Math.min(1, delta / MAX_DELTA)),
    });
  }

  return results.sort((a, b) => b.delta - a.delta);
}

export type MoodTrend = 'up' | 'down' | 'steady' | 'unknown';

/** Compares average mood in the first vs second half of the last `days` days with a mood entry. */
export function computeMoodTrend(logsByDate: Record<string, DailyLog>, todayIso: string, days = 7): MoodTrend {
  const dated = lastNDaysISO(todayIso, days)
    .map((d) => ({ date: d, mood: effectiveMood(logsByDate[d]) }))
    .filter((d): d is { date: string; mood: number } => d.mood !== undefined);
  if (dated.length < 2) return 'unknown';
  const mid = Math.ceil(dated.length / 2);
  const first = dated.slice(0, mid);
  const second = dated.slice(mid);
  if (second.length === 0) return 'unknown';
  const avg = (arr: typeof dated) => arr.reduce((a, b) => a + b.mood, 0) / arr.length;
  const delta = avg(second) - avg(first);
  if (Math.abs(delta) < 0.15) return 'steady';
  return delta > 0 ? 'up' : 'down';
}

export type MoodIcon = 'water' | 'activity' | 'bed' | 'list' | 'sun' | 'battery' | 'bulb' | 'book' | 'moon';

/** Keyword-based icon inference so user-added custom steps still get a sensible ring icon. */
export function inferMoodIcon(text: string): MoodIcon {
  const t = text.toLowerCase();
  if (/water|hydrat|drink/.test(t)) return 'water';
  if (/stretch|exercise|workout|activity|move/.test(t)) return 'activity';
  if (/bed|make.*bed/.test(t)) return 'bed';
  if (/charge|battery|phone/.test(t)) return 'battery';
  if (/dim|light|lamp/.test(t)) return 'bulb';
  if (/read|book/.test(t)) return 'book';
  if (/lights out|moon|night|bedtime/.test(t)) return 'moon';
  if (/sun|walk|outside|outdoor/.test(t)) return 'sun';
  if (/write|priorit|plan|journal|list|gratitude/.test(t)) return 'list';
  return 'list';
}
