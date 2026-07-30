import { useMemo } from 'react';
import { useAppStore } from './useAppStore';
import type { DailyLog } from './types';
import { todayISO, formatDateLabel, monthLabel } from '../lib/date';
import { computeStreak, computeConsistency7 } from '../lib/streak';
import { computeMoodCorrelations, computeMoodTrend, energyScoreForLog } from '../lib/correlation';
import { computeEnergy7Dates } from '../lib/streak';

function virtualLog(date: string, morningIds: string[], nightIds: string[]): DailyLog {
  return { date, morningStepIds: morningIds, nightStepIds: nightIds, morningDone: {}, nightDone: {} };
}

/** Today's log, synthesized on the fly (without writing to the store) if nothing has been logged yet today. */
export function useTodayLog(): DailyLog {
  const date = todayISO();
  const stored = useAppStore((s) => s.dailyLogs[date]);
  const morningRoutine = useAppStore((s) => s.morningRoutine);
  const nightRoutine = useAppStore((s) => s.nightRoutine);
  return useMemo(() => {
    if (stored) return stored;
    return virtualLog(date, morningRoutine.map((s) => s.id), nightRoutine.map((s) => s.id));
  }, [stored, morningRoutine, nightRoutine, date]);
}

export function useStreak(): number {
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  return useMemo(() => computeStreak(dailyLogs, todayISO()), [dailyLogs]);
}

export function useConsistency7() {
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  return useMemo(() => computeConsistency7(dailyLogs, todayISO()), [dailyLogs]);
}

export function useEnergy7(): number[] {
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  return useMemo(() => computeEnergy7Dates(todayISO()).map((d) => energyScoreForLog(dailyLogs[d])), [dailyLogs]);
}

export function useMoodTrend() {
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  return useMemo(() => computeMoodTrend(dailyLogs, todayISO()), [dailyLogs]);
}

export function useMoodCorrelations() {
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  const morningRoutine = useAppStore((s) => s.morningRoutine);
  const nightRoutine = useAppStore((s) => s.nightRoutine);
  return useMemo(
    () => computeMoodCorrelations(dailyLogs, morningRoutine, nightRoutine, todayISO()),
    [dailyLogs, morningRoutine, nightRoutine],
  );
}

export function useRecentReflections(days = 7) {
  const reflections = useAppStore((s) => s.reflections);
  return useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);
    return [...reflections]
      .filter((r) => {
        const [y, m, d] = r.date.split('-').map(Number);
        return new Date(y, m - 1, d) >= cutoff;
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => ({ ...r, dateLabel: formatDateLabel(r.date) }));
  }, [reflections, days]);
}

export interface ReflectionGroup {
  label: string;
  items: { date: string; text: string; dateLabel: string }[];
}

export function useReflectionArchive(query: string): { groups: ReflectionGroup[]; filtered: { date: string; text: string; dateLabel: string }[] } {
  const reflections = useAppStore((s) => s.reflections);
  return useMemo(() => {
    const sorted = [...reflections].sort((a, b) => b.date.localeCompare(a.date));
    const q = query.trim().toLowerCase();
    if (q) {
      const filtered = sorted
        .filter((r) => r.text.toLowerCase().includes(q) || formatDateLabel(r.date).toLowerCase().includes(q))
        .map((r) => ({ ...r, dateLabel: formatDateLabel(r.date) }));
      return { groups: [], filtered };
    }
    const groups: ReflectionGroup[] = [];
    const map = new Map<string, ReflectionGroup>();
    for (const r of sorted) {
      const key = r.date.slice(0, 7);
      let group = map.get(key);
      if (!group) {
        group = { label: monthLabel(r.date), items: [] };
        map.set(key, group);
        groups.push(group);
      }
      group.items.push({ ...r, dateLabel: formatDateLabel(r.date) });
    }
    return { groups, filtered: [] };
  }, [reflections, query]);
}
