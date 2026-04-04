// Date utilities — all date logic lives here so components stay clean.

// Returns today as YYYY-MM-DD in local time.
export function todayString(): string {
  const d = new Date();
  return localDateString(d);
}

// Formats a Date as YYYY-MM-DD in local time.
export function localDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Returns the YYYY-MM-DD of the Monday that starts the week containing `date`.
export function getMondayOf(date: Date = new Date()): string {
  const d   = new Date(date.getTime());
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return localDateString(d);
}

// Returns an array of YYYY-MM-DD strings for Mon–Sun of the week containing `date`.
export function getCurrentWeekDates(date: Date = new Date()): string[] {
  const monday = new Date(getMondayOf(date) + 'T12:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime());
    d.setDate(d.getDate() + i);
    return localDateString(d);
  });
}

// "2026-03-27" → "Mar 27" (safe: noon local time avoids UTC day-shift)
export function shortDateLabel(stamp: string): string {
  return new Date(stamp + 'T12:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// "2026-03-27" → "Mon"
export function weekdayShort(stamp: string): string {
  return new Date(stamp + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// Returns how many days ago `stamp` was relative to today (0 = today, 1 = yesterday, …)
export function daysAgo(stamp: string): number {
  const then  = new Date(stamp + 'T12:00').getTime();
  const today = new Date(todayString() + 'T12:00').getTime();
  return Math.round((today - then) / (24 * 60 * 60 * 1000));
}

// Returns a human label: "Today", "Yesterday", "2 days ago", etc.
export function relativeDay(stamp: string): string {
  const n = daysAgo(stamp);
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  return `${n} days ago`;
}

// Date N days before today as YYYY-MM-DD
export function daysBeforeToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateString(d);
}
