export type TapPoint = { time: number; x: number; y: number };
export const DOUBLE_TAP_MS = 300;
export const DOUBLE_TAP_PX = 24;
export const SINGLE_TAP_WAIT_MS = 320;

export type TapDecision =
  | { action: "vote" }                      // the second tap of a double tap, on a card that can take a vote
  | { action: "ignore" }                    // a second tap with nothing to vote on, or nothing to open
  | { action: "open"; afterMs: number };    // a first tap: open the meal, after waiting out a possible second tap when a vote is possible

// A double tap votes up; a single tap opens the meal once it is clear no second tap follows.
export function decideTap(last: TapPoint | null, now: TapPoint, { canVote, hasHref }: { canVote: boolean; hasHref: boolean }): TapDecision {
  const second = Boolean(last && now.time - last.time <= DOUBLE_TAP_MS && Math.hypot(now.x - last.x, now.y - last.y) <= DOUBLE_TAP_PX);
  if (second) return canVote ? { action: "vote" } : { action: "ignore" };
  return hasHref ? { action: "open", afterMs: canVote ? SINGLE_TAP_WAIT_MS : 0 } : { action: "ignore" };
}
