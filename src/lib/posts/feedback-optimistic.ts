import type { Verdict } from './feedback';

// The visible choice belongs to the displayed analysis revision. A response
// from a superseded revision must neither change that choice nor roll it back.
export async function saveFeedbackOptimistically({ previous, next, save, isCurrent, select }: {
  previous: Verdict | null;
  next: Verdict;
  save: () => Promise<void>;
  isCurrent: () => boolean;
  select: (value: Verdict | null) => void;
}): Promise<boolean> {
  select(next);
  try {
    await save();
    return isCurrent();
  } catch (error) {
    if (isCurrent()) select(previous);
    throw error;
  }
}
