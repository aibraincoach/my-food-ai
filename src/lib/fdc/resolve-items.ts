export const NUTRITION_RESOLUTION_CONCURRENCY = 2;

// Resolve a meal under one deadline, retaining input order. On a failure, stop
// queued work and cancel peers, then wait for every started task to settle before
// returning the error. Callers may publish only the fully resolved result.
export async function resolveNutritionItems<T, R>(
  items: readonly T[],
  budget: AbortSignal,
  resolve: (item: T, index: number, signal: AbortSignal) => Promise<R>,
): Promise<R[]> {
  const cancellation = new AbortController();
  const signal = AbortSignal.any([budget, cancellation.signal]);
  const results = new Array<R>(items.length);
  let cursor = 0;
  let failed = false;
  let failure: unknown;
  const fail = (error: unknown) => {
    if (failed) return;
    failed = true;
    failure = error;
    cancellation.abort(error);
  };
  const lane = async () => {
    while (!failed) {
      if (signal.aborted) { fail(signal.reason); return; }
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = await resolve(items[index], index, signal); }
      catch (error) { fail(error); }
    }
  };
  await Promise.allSettled(Array.from({length: Math.min(NUTRITION_RESOLUTION_CONCURRENCY, items.length)}, lane));
  if (failed) throw failure;
  budget.throwIfAborted();
  return results;
}
