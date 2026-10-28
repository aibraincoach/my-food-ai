// The runner schedules COUNT posts INTERVAL_MS apart; a stalled event loop can
// start them late or bunched. The report states what was observed.
export function scheduleSummary(startOffsetsMs, { count, intervalMs, windowMs }) {
  const observed = startOffsetsMs.filter((value) => Number.isFinite(value));
  const configuredLast = (count - 1) * intervalMs;
  const lastStart = observed.length ? Math.max(...observed) : null;
  const drift = lastStart === null ? null : lastStart - configuredLast;
  const met = observed.length === count && lastStart <= windowMs;
  return { configuredLast, lastStart, drift, met, started: observed.length };
}
