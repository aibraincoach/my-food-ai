// When a meal was eaten. The reader may log it later than it happened, never in the future, and not
// absurdly long ago.
export const EATEN_AT_FUTURE_SLACK_MS = 5 * 60_000;
export const EATEN_AT_MAX_AGE_MS = 2 * 365 * 24 * 60 * 60_000;

// Returns the normalized ISO instant, or null when the value is not an acceptable time.
export function validEatenAt(value: unknown, now = Date.now()): string | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  if (time > now + EATEN_AT_FUTURE_SLACK_MS || time < now - EATEN_AT_MAX_AGE_MS) return null;
  return new Date(time).toISOString();
}

const two = (n: number) => String(n).padStart(2, "0");

// The value a <input type="datetime-local"> expects: the browser's local wall-clock time.
export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

// A datetime-local value is local wall-clock time without a zone; the browser turns it into an instant.
export function fromLocalInput(value: string, now = Date.now()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) ? validEatenAt(instant.toISOString(), now) : null;
}
