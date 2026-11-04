// Keep a failed vote across navigation to its reply, bound to the immutable
// analysis revision so an older failure never marks a newer analysis.
const failed = new Set<string>();
const listeners = new Set<() => void>();
export function subscribeFeedbackErrors(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function rememberFeedbackError(revision: string): void { failed.add(revision); for (const notify of listeners) notify(); }
export function hasFeedbackError(revision: string): boolean { return failed.has(revision); }
export function clearFeedbackError(revision: string): void { failed.delete(revision); for (const notify of listeners) notify(); }
