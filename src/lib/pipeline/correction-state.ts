type Comment = { id: string; author: string; body: string; created_at: string };
type Progress = { correction_sequence?: unknown; correction_pending_ids?: unknown; correction_through?: unknown };

// Exact applied IDs avoid replaying a relative instruction even when timestamps
// tie or a later insert sorts before the previous high-water comment.
export function correctionWindow(thread: Comment[], completed: { payload: Progress }[]) {
  const applied = new Set<string>();
  let sequence = 0;
  for (const { payload } of completed) {
    if (typeof payload.correction_sequence === 'number' && Number.isSafeInteger(payload.correction_sequence)) sequence = Math.max(sequence, payload.correction_sequence);
    if (Array.isArray(payload.correction_pending_ids)) {
      for (const id of payload.correction_pending_ids) if (typeof id === 'string') applied.add(id);
    } else if (typeof payload.correction_through === 'string') {
      const through = thread.findIndex(comment => comment.id === payload.correction_through);
      if (through < 0) throw new Error('Correction history changed while loading.');
      for (const comment of thread.slice(0, through + 1)) if (comment.author === 'user') applied.add(comment.id);
    } else throw new Error('Applied correction has no message cursor.');
  }
  const pending = thread.filter(comment => comment.author === 'user' && !applied.has(comment.id));
  const ids = new Set(pending.map(comment => comment.id));
  return { sequence, pending, history: thread.filter(comment => !ids.has(comment.id)) };
}
