const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

let gisLoadPromise: Promise<void> | null = null;

/** Loads the Google Identity Services script once, however many times this is called. */
export function loadGoogleIdentityServices(): Promise<void> {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  allDay: boolean;
}

interface TokenResponse {
  access_token: string;
  expires_in: number; // seconds
  error?: string;
}

export interface AccessTokenResult {
  accessToken: string;
  expiresInSec: number;
}

/**
 * Requests an OAuth access token via Google Identity Services' token client (implicit flow,
 * no backend). `interactive: false` attempts a token refresh without a visible prompt — this
 * only succeeds if the browser still has an active Google session from a prior interactive
 * consent; otherwise it silently fails and the caller should fall back to an interactive request.
 */
export function requestGoogleAccessToken(clientId: string, interactive: boolean): Promise<AccessTokenResult> {
  return loadGoogleIdentityServices().then(
    () =>
      new Promise<AccessTokenResult>((resolve, reject) => {
        const google = (window as unknown as { google?: any }).google;
        if (!google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services unavailable'));
          return;
        }
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: CALENDAR_SCOPE,
          prompt: interactive ? 'consent' : '',
          callback: (resp: TokenResponse) => {
            if (resp.error || !resp.access_token) {
              reject(new Error(resp.error ?? 'No access token returned'));
              return;
            }
            resolve({ accessToken: resp.access_token, expiresInSec: resp.expires_in ?? 3600 });
          },
        });
        client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
      }),
  );
}

/** Fetches the next `maxResults` upcoming events on the primary calendar, nearest first. */
export async function fetchUpcomingEvents(accessToken: string, maxResults = 5): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('unauthorized');
    throw new Error(`Calendar API error: ${res.status}`);
  }
  const data = await res.json();
  return (data.items ?? []).map((item: { id: string; summary?: string; start?: { dateTime?: string; date?: string } }) => {
    const startRaw = item.start?.dateTime ?? item.start?.date ?? new Date().toISOString();
    return {
      id: item.id,
      title: item.summary ?? '(No title)',
      start: new Date(startRaw),
      allDay: !item.start?.dateTime,
    };
  });
}

export function formatEventTime(ev: CalendarEvent): string {
  if (ev.allDay) return 'All day';
  return ev.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
