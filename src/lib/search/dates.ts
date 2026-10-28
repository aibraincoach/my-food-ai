import * as chrono from "chrono-node";

export function searchZone(value?: string | null): string {
  try {
    if (value) {
      const zone = decodeURIComponent(value);
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return zone;
    }
  } catch {}
  return "UTC";
}

// Same IANA local-date grouping used by Days; no server-local Date setters.
export function localDate(instant: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const part = (name: string) => parts.find((entry) => entry.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function shiftDate(date: string, days: number): string {
  const instant = new Date(`${date}T12:00:00Z`);
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

export function localDateStart(date: string, zone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error("Search date was not understood.");
  }
  // Find the actual start of the local date, including 23/25-hour DST days
  // and zones whose clocks change at midnight. A skipped date has no range.
  const center = Date.parse(`${date}T00:00:00Z`);
  let low = center - 36 * 60 * 60 * 1000;
  let high = center + 36 * 60 * 60 * 1000;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (localDate(new Date(middle), zone) < date) low = middle + 1;
    else high = middle;
  }
  return new Date(low).toISOString();
}

function offsetMinutes(now: Date, zone: string): number {
  const parts = new Intl.DateTimeFormat("en", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const part = (name: string) => Number(parts.find((entry) => entry.type === name)!.value);
  const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return (wall - Math.floor(now.getTime() / 1000) * 1000) / 60000;
}

export function parseSearchDates(text: string, zone: string, now: Date) {
  const first = chrono.parse(text, { instant: now, timezone: offsetMinutes(now, zone) }, { forwardDate: false })[0];
  if (!first) return { terms: text, from: null, to: null };
  const date = (part: chrono.ParsedComponents) => `${part.get("year")}-${String(part.get("month")).padStart(2, "0")}-${String(part.get("day")).padStart(2, "0")}`;
  let from = date(first.start);
  let through = date(first.end ?? first.start);
  if (first.start.isCertain("weekday") && !first.start.isCertain("day") && from > localDate(now, zone)) {
    from = shiftDate(from, -7); through = shiftDate(through, -7);
  }
  return {
    terms: text.slice(0, first.index) + text.slice(first.index + first.text.length),
    from: localDateStart(from, zone),
    to: localDateStart(shiftDate(through, 1), zone),
  };
}
