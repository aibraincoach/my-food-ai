// Pending votes and failures survive navigation to the reply, bound to the
// immutable analysis revision. A remounted row cannot race its earlier vote.
const failed = new Set<string>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => { for (const listener of listeners) listener(); };
export function subscribeFeedbackErrors(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function hasFeedbackError(revision: string): boolean { return failed.has(revision); }
export function feedbackSavePending(revision: string): boolean { return pending.has(revision); }
export async function saveFeedbackRevision(revision: string, save: () => Promise<unknown>): Promise<boolean> {
 if (pending.has(revision)) return false;
 pending.add(revision); failed.delete(revision); notify();
 try { await save(); return true; }
 catch (error) { failed.add(revision); throw error; }
 finally { pending.delete(revision); notify(); }
}
