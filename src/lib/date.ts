// Local-calendar-date helpers. Deliberately avoids toISOString() (UTC) so "today" matches
// the device's actual local day, not whatever day it is in UTC.
export function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return localDateISO(new Date());
}

export function addDaysISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateISO(dt);
}

/** Full weekday + full month, e.g. "Wednesday, July 29" — used for header greetings. */
export function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function monthLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

export function weekdayInitial(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'narrow' });
}

export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/** Last `count` calendar dates ending at (and including) `endIso`, oldest first. */
export function lastNDaysISO(endIso: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(addDaysISO(endIso, -i));
  return out;
}

/** Decimal hour (e.g. 22.5) -> value an <input type="time"> expects (e.g. "22:30"). */
export function hourDecimalToTimeInput(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** <input type="time"> value (e.g. "22:30") -> decimal hour (e.g. 22.5). */
export function timeInputToHourDecimal(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h + m / 60;
}

/** Decimal hour -> display label, e.g. 22.5 -> "10:30 PM". */
export function formatHourLabel(hour: number): { time: string; ampm: string } {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return { time: `${h12}:${String(m).padStart(2, '0')}`, ampm };
}
