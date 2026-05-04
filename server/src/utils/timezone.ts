/**
 * Timezone-aware date boundary helpers.
 * All functions return UTC Date objects that correspond to boundaries
 * in the requested timezone.
 */

export function validateTz(tz: unknown): string {
  if (typeof tz !== 'string') return 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/**
 * Returns the UTC Date that corresponds to midnight (00:00:00) today
 * in the given IANA timezone.
 *
 * Strategy: formatToParts gives us the exact h/m/s elapsed since local
 * midnight, so subtracting that from now gives local midnight in UTC.
 */
export function startOfDayInTz(tz: string, offsetDays = 0): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  const h = get('hour') === 24 ? 0 : get('hour'); // midnight edge case
  const msSinceMidnight =
    (h * 3600 + get('minute') * 60 + get('second')) * 1000 + now.getMilliseconds();

  const midnight = new Date(now.getTime() - msSinceMidnight);
  // Shift by full days if needed (each day = 86_400_000 ms)
  return new Date(midnight.getTime() - offsetDays * 86_400_000);
}

/**
 * Returns the UTC Date for the most recent Sunday midnight in the given timezone.
 */
export function startOfWeekInTz(tz: string): Date {
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(now);
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName);
  return startOfDayInTz(tz, dayIndex);
}
