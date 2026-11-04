export const MIN_SERVINGS = 0.25;
export const MAX_SERVINGS = 50;
export const SERVINGS_STEP = 0.5;

export const validServings = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= MIN_SERVINGS && value <= MAX_SERVINGS;

// One step up or down, kept on the quarter grid the database stores (two decimals).
export function stepServings(current: number, direction: 1 | -1): number {
  const next = Math.round((current + direction * SERVINGS_STEP) * 4) / 4;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, next));
}

export const servingsLabel = (value: number): string => String(Number(value.toFixed(2)));


// Accept decimal text within the stored range, then keep it on the quarter grid.
export function parseServings(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < MIN_SERVINGS || value > MAX_SERVINGS) return null;
  return Math.round(value * 4) / 4;
}
