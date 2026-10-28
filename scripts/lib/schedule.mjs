// The runner schedules COUNT posts INTERVAL_MS apart; a stalled event loop can
// start them late or bunched. The report states what was observed, and a run
// only counts as the intended workload when every start is on pace.
export function scheduleSummary(startOffsetsMs, { count, intervalMs, windowMs, toleranceMs = 3000 }) {
  const starts = startOffsetsMs.map((value) => Number.isFinite(value) ? value : null);
  const observed = starts.filter((value) => value !== null);
  const lateness = starts.map((value, index) => value === null ? null : value - index * intervalMs).filter((value) => value !== null);
  const ordered = [...observed].sort((a, b) => a - b);
  const gaps = ordered.slice(1).map((value, index) => value - ordered[index]);
  const lastStart = observed.length ? Math.max(...observed) : null;
  const maxLateness = lateness.length ? Math.max(...lateness) : null;
  const minGap = gaps.length ? Math.min(...gaps) : null;
  const onPace = observed.length === count && maxLateness <= toleranceMs && (minGap ?? 0) >= intervalMs - toleranceMs;
  return {
    configuredLast: (count - 1) * intervalMs, lastStart, drift: lastStart === null ? null : lastStart - (count - 1) * intervalMs,
    maxLateness, minGap, started: observed.length,
    inWindow: observed.length === count && lastStart <= windowMs, onPace, met: observed.length === count && lastStart <= windowMs && onPace,
  };
}
