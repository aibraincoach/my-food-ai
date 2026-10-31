import { traceContext } from "@/lib/trace/context";

// Production permits 300s; leave 30s for failure/persistence, lease release and handoff.
export const WORKER_PROCESSING_MS = 270_000;
export const NUTRITION_MAX_MS = 180_000;
export const NUTRITION_PERSIST_MS = 15_000;
export const HANDOFF_REQUEST_MS = 10_000;

export function nutritionBudgetMs(deadlineAt = traceContext.getStore()?.deadlineAt, now = Date.now()): number {
  return deadlineAt === undefined ? NUTRITION_MAX_MS
    : Math.max(0, Math.min(NUTRITION_MAX_MS, deadlineAt - now - NUTRITION_PERSIST_MS));
}

export function workerDeadlineSignal(signal?: AbortSignal): AbortSignal | undefined {
  const deadlineAt = traceContext.getStore()?.deadlineAt;
  if (deadlineAt === undefined) return signal;
  const remaining = Math.ceil(deadlineAt - Date.now());
  const deadline = remaining > 0 ? AbortSignal.timeout(remaining)
    : AbortSignal.abort(new DOMException("Worker execution budget was exhausted.", "TimeoutError"));
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

export function workerHandoffDelay(nextAt: number, startedAt: number, now = Date.now()): number | null {
  const wait = Math.min(Math.max(nextAt - now, 1000), 60_000);
  // A durable scheduled wake handles future work when this invocation cannot wait safely.
  return now + wait + HANDOFF_REQUEST_MS <= startedAt + WORKER_PROCESSING_MS ? wait : null;
}
