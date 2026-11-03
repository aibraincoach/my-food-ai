import type { FeedPost } from './feed';
import { dateInZone } from './days';

/** Card/photo hydration is not a nutrition mutation. Only a stable, verified
 * analysis revision can prove a ready meal's consumed totals are unchanged. */
export function dayTotalRefreshDates(previous: FeedPost | undefined, fresh: FeedPost, zone: string, knownDays: ReadonlySet<string>, force = false): string[] {
  const dates = [...new Set([fresh.eaten_at, ...(previous ? [previous.eaten_at] : [])].map(value => dateInZone(value, zone)))];
  const same = previous?.id === fresh.id && previous.eaten_at === fresh.eaten_at && previous.status === fresh.status
    && (fresh.status !== 'ready' || Boolean(fresh.analysisFingerprint && fresh.analysisFingerprint === previous.analysisFingerprint));
  return !force && same ? dates.filter(day => !knownDays.has(day)) : dates;
}
