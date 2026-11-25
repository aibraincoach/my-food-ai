// Metadata is an untrusted suggestion, never permission to assign a profile.
export function pendingHandle(value: unknown): string {
  if (typeof value !== 'string') return '';
  const handle = value.trim();
  return handle.length >= 1 && handle.length <= 80 ? handle : '';
}
