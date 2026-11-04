export type DrinkGlyph = 'coffee' | 'water' | 'cocktail' | 'wine' | 'beer' | 'tumbler';
export function drinkGlyph(label: string, kind: 'water' | 'caffeine' | 'alcohol', category?: string | null): DrinkGlyph {
  const name = label.toLowerCase(), cat = (category ?? '').toLowerCase();
  if (kind === 'alcohol') return /\bwine\b|champagne|prosecco/.test(name) || cat === 'wine' ? 'wine' : /\bbeer\b|lager|ale\b|stout|pilsner|bintang/.test(name) || cat === 'beer' ? 'beer' : 'cocktail';
  if (/coffee|espresso|latte|cappuccino|americano|\btea\b|matcha/.test(name)) return 'coffee';
  if (/^water\b/.test(name)) return 'water';
  return 'tumbler';
}
export const waterCups = (ml: number) => Math.max(1, Math.round(ml / 250));
