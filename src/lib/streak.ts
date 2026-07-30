import type { DailyLog } from '../store/types';
import { addDaysISO, lastNDaysISO, weekdayInitial } from './date';

/**
 * A day counts toward the streak/consistency grid once at least this fraction of that day's
 * combined morning+night routine steps are marked done. 70% was chosen as a reasonable
 * "mostly did your routine" bar — tune with product once real usage data exists.
 */
export const STREAK_THRESHOLD = 0.7;

export function dayCompletionRatio(log: DailyLog | undefined): number {
  if (!log) return 0;
  const totalIds = log.morningStepIds.length + log.nightStepIds.length;
  if (totalIds === 0) return 0;
  const done =
    log.morningStepIds.filter((id) => log.morningDone[id]).length + log.nightStepIds.filter((id) => log.nightDone[id]).length;
  return done / totalIds;
}

export function isDayComplete(log: DailyLog | undefined, threshold = STREAK_THRESHOLD): boolean {
  return dayCompletionRatio(log) >= threshold;
}

/**
 * Consecutive days (ending today, walking backward) meeting the completion threshold.
 * If today doesn't meet it yet, today is skipped rather than breaking the streak — the day
 * isn't over yet, so it shouldn't be judged the same way a finished day is.
 */
export function computeStreak(logsByDate: Record<string, DailyLog>, todayIso: string, threshold = STREAK_THRESHOLD): number {
  let cursor = todayIso;
  if (!isDayComplete(logsByDate[todayIso], threshold)) {
    cursor = addDaysISO(todayIso, -1);
  }
  let streak = 0;
  while (isDayComplete(logsByDate[cursor], threshold)) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export interface ConsistencyDay {
  date: string;
  label: string;
  done: boolean;
  ratio: number;
}

export function computeConsistency7(logsByDate: Record<string, DailyLog>, todayIso: string, threshold = STREAK_THRESHOLD): ConsistencyDay[] {
  return lastNDaysISO(todayIso, 7).map((date) => ({
    date,
    label: weekdayInitial(date),
    done: isDayComplete(logsByDate[date], threshold),
    ratio: dayCompletionRatio(logsByDate[date]),
  }));
}

export function computeEnergy7Dates(todayIso: string): string[] {
  return lastNDaysISO(todayIso, 7);
}
