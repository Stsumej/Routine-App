import { createContext, useContext, type ReactNode } from 'react';
import { useGoogleCalendar, type GoogleCalendarState } from './useGoogleCalendar';

const GoogleCalendarContext = createContext<GoogleCalendarState | null>(null);

/** One shared Google Calendar connection for the whole app (Home and Profile both read it). */
export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const state = useGoogleCalendar();
  return <GoogleCalendarContext.Provider value={state}>{children}</GoogleCalendarContext.Provider>;
}

export function useGoogleCalendarContext(): GoogleCalendarState {
  const ctx = useContext(GoogleCalendarContext);
  if (!ctx) throw new Error('useGoogleCalendarContext must be used within a GoogleCalendarProvider');
  return ctx;
}
