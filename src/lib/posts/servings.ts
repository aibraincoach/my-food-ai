export const MIN_SERVINGS = 0.1;
export const MAX_SERVINGS = 50;
export const SERVINGS_STEP = 0.5;

const UNICODE_FRACTION: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
};

export const roundServings = (value: number): number => Math.round(value * 100) / 100;

export const validServings = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= MIN_SERVINGS && value <= MAX_SERVINGS;

export function stepServings(current: number, direction: 1 | -1): number {
  const next = roundServings(current + direction * SERVINGS_STEP);
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, next));
}

const fractionGlyph = (frac: number): string | null => {
  if (Math.abs(frac - 0.25) < 0.005) return "¼";
  if (Math.abs(frac - 1 / 3) < 0.005 || Math.abs(frac - 0.33) < 0.005) return "⅓";
  if (Math.abs(frac - 0.5) < 0.005) return "½";
  if (Math.abs(frac - 2 / 3) < 0.005 || Math.abs(frac - 0.67) < 0.005) return "⅔";
  if (Math.abs(frac - 0.75) < 0.005) return "¾";
  return null;
};

export const servingsLabel = (value: number): string => {
  const rounded = roundServings(value);
  const whole = Math.floor(rounded + 1e-9);
  const frac = roundServings(rounded - whole);
  const glyph = fractionGlyph(frac);
  if (glyph && whole > 0) return `${whole}${glyph}`;
  if (glyph) return glyph;
  if (frac === 0) return String(whole);
  return String(Number(rounded.toFixed(2)));
};

const parseFractionToken = (token: string): number | null => {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (trimmed in UNICODE_FRACTION) return roundServings(UNICODE_FRACTION[trimmed]);
  const slash = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (slash) {
    const num = Number(slash[1]);
    const den = Number(slash[2]);
    if (!den) return null;
    return roundServings(num / den);
  }
  const unicode = trimmed.match(/^(\d*)([½⅓⅔¼¾⅛])$/);
  if (unicode) {
    const whole = unicode[1] ? Number(unicode[1]) : 0;
    const part = UNICODE_FRACTION[unicode[2]];
    return roundServings(whole + part);
  }
  const normalized = trimmed.replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? roundServings(value) : null;
};

const inRange = (value: number): boolean => value >= MIN_SERVINGS && value <= MAX_SERVINGS;

// Typed text, vulgar fractions, unicode fractions, and multiplier shorthands (2x, x2, ×2).
export function parseServings(text: string): number | null {
  let raw = text.trim();
  if (!raw) return null;

  if (/^2\s*[x×]$/i.test(raw) || /^[x×]\s*2$/i.test(raw)) {
    return inRange(2) ? 2 : null;
  }
  const scaled = raw.match(/^(.+?)\s*[x×]\s*2\s*$/i);
  if (scaled) {
    const base = parseServings(scaled[1]);
    if (base === null) return null;
    const value = roundServings(base * 2);
    return inRange(value) ? value : null;
  }

  raw = raw.replace(/×/g, "x").replace(/,/g, ".");
  const mixed = raw.match(/^(\d+(?:\.\d+)?)\s+(\d+\s*\/\s*\d+|[½⅓⅔¼¾⅛])$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const part = parseFractionToken(mixed[2]);
    if (!Number.isFinite(whole) || part === null) return null;
    const value = roundServings(whole + part);
    return inRange(value) ? value : null;
  }

  const single = parseFractionToken(raw);
  if (single === null) return null;
  return inRange(single) ? single : null;
}
