import type { ThemeMode } from '../theme/tokens';

export type EnergyLevel = 'low' | 'medium' | 'high';
export type DayType = 'rest' | 'workout';
export type MiddayChoice = 'dip' | 'track' | 'crushing';
export type RoutinePeriod = 'morning' | 'night';
export type WidgetContent = 'streak-only' | 'streak-remaining' | 'streak-remaining-name';

export interface RoutineStepDef {
  id: string;
  text: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD, local
  /** Step ids that existed in that period's routine as of this day (frozen once the day is in the past). */
  morningStepIds: string[];
  nightStepIds: string[];
  morningDone: Record<string, boolean>;
  nightDone: Record<string, boolean>;
  mood?: number; // 1-5, morning check-in
  energy?: EnergyLevel; // morning check-in
  dayType?: DayType;
  sleepHours?: number;
  gratitude?: string;
  eveningMood?: number; // 1-5, evening check-in
  eveningEnergy?: EnergyLevel; // evening check-in
}

export interface Reflection {
  date: string; // YYYY-MM-DD
  text: string;
}

export interface Settings {
  displayName: string;
  themeMode: ThemeMode;
  widgetContent: WidgetContent;
  goToContact: string;
  gcalConnected: boolean;
  /** Decimal hour, e.g. 22.5 = 10:30 PM. User-adjustable from Profile. */
  targetBedtimeHour: number;
}

export interface EphemeralUI {
  middayChoice: MiddayChoice | null;
  middayDismissed: boolean;
  textPromptDismissed: boolean;
  showContactInput: boolean;
  archiveSearch: string;
  builderType: RoutinePeriod;
}
