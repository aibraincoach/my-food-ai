export type MonthStart = { month: string; top: number };

/** Month whose start row is nearest the sticky header line while scrolling Days. */
export function visibleMonth(starts: MonthStart[], line: number, fallback: string): string {
  if (!starts.length) return fallback;
  const past = starts.filter(entry => entry.top <= line).at(-1);
  if (past) return past.month;
  return starts.reduce((best, entry) =>
    Math.abs(entry.top - line) < Math.abs(best.top - line) ? entry : best,
  ).month;
}
