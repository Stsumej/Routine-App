import { dayOfYear } from './date';

export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: 'Education is the passport to the future.', author: 'Malcolm X' },
  { text: 'I am no longer accepting the things I cannot change. I am changing the things I cannot accept.', author: 'Angela Davis' },
  { text: 'Rarely, if ever, are any of us healed in isolation.', author: 'bell hooks' },
  { text: 'Still I rise.', author: 'Maya Angelou' },
  { text: 'Caring for myself is not self-indulgence, it is self-preservation.', author: 'Audre Lorde' },
  { text: "Faith is taking the first step even when you don't see the whole staircase.", author: 'Martin Luther King Jr.' },
  { text: 'If there is no struggle, there is no progress.', author: 'Frederick Douglass' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
  { text: 'First we make our habits, then our habits make us.', author: 'John Dryden' },
];

/** Deterministic: day-of-year modulo the quote list, so it's the same quote all day and rotates daily. */
export function quoteOfTheDay(now = new Date()): Quote {
  return QUOTES[dayOfYear(now) % QUOTES.length];
}

/** Same deterministic day-of-year rotation, generalized to any list (e.g. a rotation of contacts). Null if the list is empty. */
export function pickOfTheDay<T>(list: T[], now = new Date()): T | null {
  return list.length ? list[dayOfYear(now) % list.length] : null;
}
