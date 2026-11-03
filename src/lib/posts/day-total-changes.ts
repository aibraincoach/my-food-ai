import type { FeedPost } from './feed';
import { dateInZone, dayPostReceipt, type DayPostReceipt } from './days';

/** Card/photo hydration is not a nutrition mutation. Only a stable, verified
 * analysis revision can prove a ready meal's consumed totals are unchanged. */
export function dayTotalRefreshDates(previous: FeedPost | undefined, fresh: FeedPost, zone: string, knownDays: ReadonlySet<string>, force = false, receipts: ReadonlyMap<string, DayPostReceipt> = new Map()): string[] {
  const receipt=receipts.get(fresh.id);
  const dates = [...new Set([fresh.eaten_at, ...(previous ? [previous.eaten_at] : receipt ? [receipt.eatenAt] : [])].map(value => dateInZone(value, zone)))];
  const same = previous?.id === fresh.id && previous.eaten_at === fresh.eaten_at && previous.status === fresh.status
    && (fresh.status !== 'ready' || Boolean(fresh.analysisFingerprint && fresh.analysisFingerprint === previous.analysisFingerprint));
  const contribution=fresh.status==='ready'&&!fresh.itemsUnavailable?dayPostReceipt(fresh.id,fresh.eaten_at,fresh.items):null;
  const included=Boolean(receipt&&contribution&&new Date(receipt.eatenAt).getTime()===new Date(fresh.eaten_at).getTime()
    &&receipt.known===contribution.known&&Math.abs(receipt.kcal-contribution.kcal)<1e-9
    &&JSON.stringify(receipt.missing)===JSON.stringify(contribution.missing));
  return !force && (included || (!receipt && same)) ? dates.filter(day => !knownDays.has(day)) : dates;
}
