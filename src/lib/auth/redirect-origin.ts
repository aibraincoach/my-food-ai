// Server actions validate Origin against Host before calling the action. Require
// a complete origin here too; never guess a host for an emailed Auth link.
export function authRedirectOrigin(origin: string | null): string | null {
  try {
    const url = new URL(origin ?? '');
    if (url.origin === origin && (url.protocol === 'https:' ||
      url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) return origin;
  } catch {}
  return null;
}
