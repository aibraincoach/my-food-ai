const namedZones = new Set(Intl.supportedValuesOf('timeZone'));
/** Capture requires a named zone, never an ICU fixed offset or a substitute.
 * Canonical ICU names are checked against local PG tzdata in the DB test. */
export function captureZone(value: unknown): string | null {
 if (typeof value !== 'string' || !value || value.length > 100) return null;
 if(!value.includes('/')&&value.toUpperCase()!=='UTC')return null;
 try { const zone=new Intl.DateTimeFormat('en', {timeZone: value}).resolvedOptions().timeZone;return zone==='UTC'||namedZones.has(zone)?zone:null; }
 catch { return null; }
}
