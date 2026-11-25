/** Capture is stored data: reject missing/invalid zones, never substitute UTC.
 * Store the canonical ICU name; the existing DB trigger validates pg tzdata. */
export function captureZone(value: unknown): string | null {
 if (typeof value !== 'string' || !value || value.length > 100) return null;
 try { return new Intl.DateTimeFormat('en', {timeZone: value}).resolvedOptions().timeZone; }
 catch { return null; }
}
