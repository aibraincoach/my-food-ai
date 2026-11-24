export type MonthStart = { month: string; top: number };
export type CalendarViewport = {
  headerBottom: number;
  viewportHeight: number;
  scrollTop: number;
  scrollHeight: number;
};

/** The month in the middle of Days, with explicit first/current month ends. */
export function visibleMonth(starts: MonthStart[], viewport: CalendarViewport, currentMonth: string): string {
  if (!starts.length) return currentMonth;
  const {headerBottom, viewportHeight, scrollTop, scrollHeight} = viewport;
  // A short calendar is also at the bottom, so this takes precedence over top.
  if (scrollHeight - viewportHeight - scrollTop <= 1) return currentMonth;
  if (scrollTop <= 1) return starts[0].month;
  const middle = (headerBottom + viewportHeight) / 2;
  return starts.filter(entry => entry.top <= middle).at(-1)?.month ?? starts[0].month;
}
