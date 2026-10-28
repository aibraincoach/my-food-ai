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

export const TAP_MOVE_PX = 8;

// Owns the pointer sequence and the one pending "open" timer of a tappable photo. A new press, a cancelled
// pointer, a drag or an unmount all cancel a queued navigation, so scrolling or swiping can never open the meal.
export function createTapController(deps: { now: () => number; open: (href: string) => void; vote: () => void }) {
  let start: { x: number; y: number } | null = null;
  let previous: TapPoint | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const clearTimer = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
  return {
    down(x: number, y: number) { clearTimer(); start = { x, y }; },
    cancel() { clearTimer(); start = null; previous = null; },
    dispose() { clearTimer(); },
    up(x: number, y: number, options: { canVote: boolean; href?: string }) {
      const from = start;
      start = null;
      if (!from || Math.hypot(x - from.x, y - from.y) > TAP_MOVE_PX) { clearTimer(); previous = null; return; }
      const point = { time: deps.now(), x, y };
      const decision = decideTap(previous, point, { canVote: options.canVote, hasHref: Boolean(options.href) });
      previous = point;
      if (decision.action === "open") {
        clearTimer();
        const href = options.href!;
        timer = setTimeout(() => { timer = null; deps.open(href); }, decision.afterMs);
        return;
      }
      clearTimer();
      if (decision.action === "vote") { previous = null; deps.vote(); }
    },
  };
}
