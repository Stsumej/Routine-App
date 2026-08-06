import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyLog, EphemeralUI, MiddayChoice, Reflection, RoutinePeriod, RoutineStepDef, Settings } from './types';
import { todayISO } from '../lib/date';

const DEFAULT_MORNING: RoutineStepDef[] = [
  { id: 'm-water', text: 'Drink a glass of water' },
  { id: 'm-stretch', text: 'Stretch for 5 minutes' },
  { id: 'm-bed', text: 'Make the bed' },
  { id: 'm-priorities', text: 'Write 3 priorities for today' },
  { id: 'm-sunlight', text: '10 minutes of sunlight' },
];

const DEFAULT_NIGHT: RoutineStepDef[] = [
  { id: 'n-charger', text: 'Put phone on the charger' },
  { id: 'n-dim', text: 'Dim the lights' },
  { id: 'n-read', text: 'Read for 10 minutes' },
  { id: 'n-lightsout', text: 'Lights out by 10:30' },
];

function newStepId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `step-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyLog(date: string, morningStepIds: string[], nightStepIds: string[]): DailyLog {
  return { date, morningStepIds, nightStepIds, morningDone: {}, nightDone: {} };
}

interface AppState {
  morningRoutine: RoutineStepDef[];
  nightRoutine: RoutineStepDef[];
  dailyLogs: Record<string, DailyLog>;
  reflections: Reflection[];
  settings: Settings;
  ui: EphemeralUI;

  // Routine builder / shared checklist source of truth
  toggleRoutineStep: (period: RoutinePeriod, stepId: string) => void;
  addStep: (period: RoutinePeriod, text: string) => void;
  removeStep: (period: RoutinePeriod, id: string) => void;
  moveStep: (period: RoutinePeriod, id: string, dir: -1 | 1) => void;
  reorderSteps: (period: RoutinePeriod, fromIndex: number, toIndex: number) => void;

  // Daily check-in fields, tied to a calendar date
  setDailyField: <K extends keyof DailyLog>(date: string, field: K, value: DailyLog[K]) => void;

  // Reflections journal — full history, never trimmed
  upsertReflection: (date: string, text: string) => void;

  // Settings
  setThemeMode: (mode: Settings['themeMode']) => void;
  setWidgetContent: (content: Settings['widgetContent']) => void;
  addContact: (contact: string) => void;
  removeContact: (index: number) => void;
  setTargetBedtime: (hour: number) => void;

  // Ephemeral session UI state
  selectMidday: (choice: MiddayChoice) => void;
  dismissTextPrompt: () => void;
  toggleContactInput: () => void;
  setArchiveSearch: (q: string) => void;
  setBuilderType: (period: RoutinePeriod) => void;
}

/** Ensures a DailyLog exists for `date`. If `date` is today, merges in any routine steps added
 * since the log was created so the checklist reflects live edits; past days stay frozen. */
function ensureLog(state: Pick<AppState, 'dailyLogs' | 'morningRoutine' | 'nightRoutine'>, date: string): Record<string, DailyLog> {
  const existing = state.dailyLogs[date];
  const isToday = date === todayISO();
  if (!existing) {
    return {
      ...state.dailyLogs,
      [date]: emptyLog(
        date,
        state.morningRoutine.map((s) => s.id),
        state.nightRoutine.map((s) => s.id),
      ),
    };
  }
  if (!isToday) return state.dailyLogs;
  const morningIds = new Set(existing.morningStepIds);
  const nightIds = new Set(existing.nightStepIds);
  let changed = false;
  for (const s of state.morningRoutine) if (!morningIds.has(s.id)) { morningIds.add(s.id); changed = true; }
  for (const s of state.nightRoutine) if (!nightIds.has(s.id)) { nightIds.add(s.id); changed = true; }
  if (!changed) return state.dailyLogs;
  return {
    ...state.dailyLogs,
    [date]: { ...existing, morningStepIds: [...morningIds], nightStepIds: [...nightIds] },
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      morningRoutine: DEFAULT_MORNING,
      nightRoutine: DEFAULT_NIGHT,
      dailyLogs: {},
      reflections: [],
      settings: {
        displayName: 'Jé',
        themeMode: 'automatic',
        widgetContent: 'streak-remaining',
        contacts: [],
        targetBedtimeHour: 22.5,
      },
      ui: {
        middayChoice: null,
        middayDismissed: false,
        textPromptDismissed: false,
        showContactInput: false,
        archiveSearch: '',
        builderType: 'morning',
      },

      toggleRoutineStep: (period, stepId) =>
        set((state) => {
          const date = todayISO();
          const dailyLogs = ensureLog(state, date);
          const log = dailyLogs[date];
          const key = period === 'morning' ? 'morningDone' : 'nightDone';
          const idsKey = period === 'morning' ? 'morningStepIds' : 'nightStepIds';
          const ids = log[idsKey].includes(stepId) ? log[idsKey] : [...log[idsKey], stepId];
          const nextLog: DailyLog = { ...log, [idsKey]: ids, [key]: { ...log[key], [stepId]: !log[key][stepId] } };
          return { dailyLogs: { ...dailyLogs, [date]: nextLog } };
        }),

      addStep: (period, text) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed) return {};
          const key = period === 'morning' ? 'morningRoutine' : 'nightRoutine';
          return { [key]: [...state[key], { id: newStepId(), text: trimmed }] } as Partial<AppState>;
        }),

      removeStep: (period, id) =>
        set((state) => {
          const key = period === 'morning' ? 'morningRoutine' : 'nightRoutine';
          return { [key]: state[key].filter((s) => s.id !== id) } as Partial<AppState>;
        }),

      moveStep: (period, id, dir) =>
        set((state) => {
          const key = period === 'morning' ? 'morningRoutine' : 'nightRoutine';
          const list = [...state[key]];
          const idx = list.findIndex((s) => s.id === id);
          const swapIdx = idx + dir;
          if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return {};
          [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
          return { [key]: list } as Partial<AppState>;
        }),

      reorderSteps: (period, fromIndex, toIndex) =>
        set((state) => {
          const key = period === 'morning' ? 'morningRoutine' : 'nightRoutine';
          const list = [...state[key]];
          if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return {};
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { [key]: list } as Partial<AppState>;
        }),

      setDailyField: (date, field, value) =>
        set((state) => {
          const dailyLogs = ensureLog(state, date);
          return { dailyLogs: { ...dailyLogs, [date]: { ...dailyLogs[date], [field]: value } } };
        }),

      upsertReflection: (date, text) =>
        set((state) => {
          const trimmed = text;
          const idx = state.reflections.findIndex((r) => r.date === date);
          if (idx === -1) {
            if (!trimmed.trim()) return {};
            return { reflections: [...state.reflections, { date, text: trimmed }] };
          }
          const next = [...state.reflections];
          if (!trimmed.trim()) {
            next.splice(idx, 1);
          } else {
            next[idx] = { date, text: trimmed };
          }
          return { reflections: next };
        }),

      setThemeMode: (mode) => set((state) => ({ settings: { ...state.settings, themeMode: mode } })),
      setWidgetContent: (content) => set((state) => ({ settings: { ...state.settings, widgetContent: content } })),
      addContact: (contact) =>
        set((state) => {
          const trimmed = contact.trim();
          if (!trimmed) return {};
          return { settings: { ...state.settings, contacts: [...state.settings.contacts, trimmed] } };
        }),
      removeContact: (index) =>
        set((state) => ({
          settings: { ...state.settings, contacts: state.settings.contacts.filter((_, i) => i !== index) },
        })),
      setTargetBedtime: (hour) => set((state) => ({ settings: { ...state.settings, targetBedtimeHour: hour } })),

      selectMidday: (choice) => set((state) => ({ ui: { ...state.ui, middayChoice: choice, middayDismissed: true } })),
      dismissTextPrompt: () => set((state) => ({ ui: { ...state.ui, textPromptDismissed: true } })),
      toggleContactInput: () => set((state) => ({ ui: { ...state.ui, showContactInput: !state.ui.showContactInput } })),
      setArchiveSearch: (q) => set((state) => ({ ui: { ...state.ui, archiveSearch: q } })),
      setBuilderType: (period) => set((state) => ({ ui: { ...state.ui, builderType: period } })),
    }),
    {
      name: 'ritual-store',
      // Ephemeral UI state is intentionally excluded — it resets on reload by design (see README).
      partialize: (state) => ({
        morningRoutine: state.morningRoutine,
        nightRoutine: state.nightRoutine,
        dailyLogs: state.dailyLogs,
        reflections: state.reflections,
        settings: state.settings,
      }),
    },
  ),
);
