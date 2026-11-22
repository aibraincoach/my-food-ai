export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function resolveLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const preferences = (acceptLanguage ?? '').split(',').map((part, index) => {
    const [tag, ...parameters] = part.trim().toLowerCase().split(';');
    const quality = parameters.find(value => value.trim().startsWith('q='));
    const weight = quality ? Number(quality.trim().slice(2)) : 1;
    return {locale: tag.split('-')[0], weight, index};
  }).filter(value => Number.isFinite(value.weight) && value.weight > 0 && value.weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const preference of preferences) if (isLocale(preference.locale)) return preference.locale;
  return 'en'; // Default locale, never a per-message fallback.
}
