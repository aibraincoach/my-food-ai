export const MAX_WORKER_CONCURRENCY = 4;

// An unset, blank, fractional, negative or oversized value must never fan out
// into an uncontrolled number of claim loops: fall back to one lane.
export function workerConcurrency(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 1;
  const configured = Number(raw);
  return Number.isSafeInteger(configured) && configured >= 1 && configured <= MAX_WORKER_CONCURRENCY ? configured : 1;
}
