export const MAX_WORKER_CONCURRENCY = 1;

// Run 4 fixes worker concurrency at one. An old larger deployment setting must not fan out
// into an uncontrolled number of claim loops: fall back to one lane.
export function workerConcurrency(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 1;
  const configured = Number(raw);
  return Number.isSafeInteger(configured) && configured >= 1 && configured <= MAX_WORKER_CONCURRENCY ? configured : 1;
}
