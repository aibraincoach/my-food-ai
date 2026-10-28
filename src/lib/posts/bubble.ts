// The circle of one day bubble. A day with a logged meal is always marked, even when the feed itself reports
// empty (a meal waiting for a reply is hidden from the feed but still logged); only a day with nothing
// logged takes the empty-feed dashed look. Today keeps its stronger ring, filled when it has a meal.
export function bubbleClass({ empty, isToday, hasDay }: { empty: boolean; isToday: boolean; hasDay: boolean }): string {
  if (empty && !hasDay) return "border border-dashed border-ring text-faint";
  if (isToday) return hasDay ? "border-2 border-text bg-text text-surface" : "border-2 border-text text-text";
  return hasDay ? "border-2 border-ring text-text" : "text-faint";
}
export const bubbleLinkClass = (hasDay: boolean) => hasDay ? "text-text" : "text-faint";
