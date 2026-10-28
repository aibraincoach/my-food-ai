// Applied changes are already in the current item snapshot, so a correction
// only needs recent context. The complete thread stays in the database and UI;
// pending (unapplied) messages are never dropped.
export const HISTORY_BUDGET_CHARS = 20_000;

export function boundedHistory<T>(history: T[], budget = HISTORY_BUDGET_CHARS): T[] {
  const kept: T[] = [];
  let used = 0;
  for (let index = history.length - 1; index >= 0; index--) {
    const size = JSON.stringify(history[index]).length;
    if (kept.length && used + size > budget) break;
    used += size;
    kept.unshift(history[index]);
  }
  return kept;
}
