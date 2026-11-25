/** Only this stored, recognised upstream code may leave an error field.
 * Free text can contain a caption or model output and never reaches the panel. */
export function adminErrorCode(value: string | null): string | null {
  return value?.match(/^(?:fdc|meta):[0-9]{3}(?![0-9])/)?.[0] ?? null;
}
