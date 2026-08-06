import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUpcomingEvents, requestGoogleAccessToken, type CalendarEvent } from './googleCalendar';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const POLL_MS = 60_000; // re-fetch events every 60s while connected, for near-live updates
const REFRESH_SAFETY_MS = 5 * 60_000; // silently refresh ~5 min before the token actually expires

export interface GoogleCalendarState {
  supported: boolean; // false if VITE_GOOGLE_CLIENT_ID isn't configured at build time
  connected: boolean;
  connecting: boolean;
  error: string | null;
  events: CalendarEvent[];
  connect: () => void;
  disconnect: () => void;
}

/**
 * Client-side-only Google Calendar connection (no backend): Google Identity Services issues a
 * short-lived access token in the browser, used directly against the Calendar API. Events
 * re-fetch every 60s while connected, so the "today's plan" card stays close to live. The token
 * lives in memory only — reloading the page requires reconnecting. A silent, non-interactive
 * refresh is attempted a few minutes before each token expires; if the browser's Google session
 * has lapsed, that silently fails and `connected` drops back to false.
 */
export function useGoogleCalendar(): GoogleCalendarState {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const tokenRef = useRef<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const refreshRef = useRef<number | null>(null);

  const loadEvents = useCallback(async (token: string) => {
    try {
      const items = await fetchUpcomingEvents(token);
      setEvents(items);
      setError(null);
    } catch (e) {
      if (e instanceof Error && e.message === 'unauthorized') {
        setConnected(false);
        tokenRef.current = null;
      } else {
        setError('Could not reach Google Calendar.');
      }
    }
  }, []);

  const scheduleSilentRefresh = useCallback(
    (expiresInSec: number) => {
      if (!CLIENT_ID) return;
      if (refreshRef.current) window.clearTimeout(refreshRef.current);
      const delay = Math.max(5_000, expiresInSec * 1000 - REFRESH_SAFETY_MS);
      refreshRef.current = window.setTimeout(async () => {
        try {
          const { accessToken, expiresInSec: nextExpiry } = await requestGoogleAccessToken(CLIENT_ID, false);
          tokenRef.current = accessToken;
          await loadEvents(accessToken);
          scheduleSilentRefresh(nextExpiry);
        } catch {
          setConnected(false);
          tokenRef.current = null;
        }
      }, delay);
    },
    [loadEvents],
  );

  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      setError("Google Calendar isn't configured yet \u2014 missing VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    setConnecting(true);
    setError(null);
    requestGoogleAccessToken(CLIENT_ID, true)
      .then(async ({ accessToken, expiresInSec }) => {
        tokenRef.current = accessToken;
        setConnected(true);
        await loadEvents(accessToken);
        scheduleSilentRefresh(expiresInSec);
      })
      .catch(() => setError('Google sign-in was cancelled or failed.'))
      .finally(() => setConnecting(false));
  }, [loadEvents, scheduleSilentRefresh]);

  const disconnect = useCallback(() => {
    tokenRef.current = null;
    setConnected(false);
    setEvents([]);
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (refreshRef.current) window.clearTimeout(refreshRef.current);
  }, []);

  useEffect(() => {
    if (!connected) return;
    pollRef.current = window.setInterval(() => {
      if (tokenRef.current) loadEvents(tokenRef.current);
    }, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [connected, loadEvents]);

  useEffect(
    () => () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (refreshRef.current) window.clearTimeout(refreshRef.current);
    },
    [],
  );

  return { supported: !!CLIENT_ID, connected, connecting, error, events, connect, disconnect };
}
