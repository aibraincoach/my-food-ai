export interface FeedCursor { eaten_at: string; id: string }

// Keep PostgreSQL's microsecond precision: converting through Date.toISOString()
// would round the boundary and could skip posts within the same millisecond.
function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d, h, minute, second, zone] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
    && Number(h) < 24 && Number(minute) < 60 && Number(second) < 60
    && (zone === "Z" || (Number(zone.slice(1, 3)) <= 14 && Number(zone.slice(4)) < 60))
    && Number.isFinite(Date.parse(value));
}

export function parseFeedCursor(value: string): FeedCursor {
  try {
    if (value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error();
    const parsed: unknown = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
    if (!parsed || typeof parsed !== "object") throw new Error();
    const { eaten_at, id } = parsed as Partial<FeedCursor>;
    if (!validTimestamp(eaten_at) || typeof id !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error();
    return { eaten_at, id };
  } catch { throw new Error("Invalid cursor."); }
}

export function encodeFeedCursor(cursor: FeedCursor): string {
  return btoa(JSON.stringify({ eaten_at: cursor.eaten_at, id: cursor.id }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
