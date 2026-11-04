// Why a food has no nutrition, kept on the item's source_ref as
// "unavailable:<code>:<detail>" so every copy and reader carries it, and
// turned into plain words for the meal page and its first comment.
export type UnavailableCode = 'not_food' | 'no_match' | 'no_estimate';
export interface UnavailableReason { code: UnavailableCode; detail: string }
export const UNAVAILABLE_PREFIX = 'unavailable:';
export function unavailableRef(reason: UnavailableReason): string {
  return `${UNAVAILABLE_PREFIX}${reason.code}:${reason.detail.replace(/\s+/g, ' ').trim().slice(0, 200)}`;
}
export function parseUnavailable(sourceRef: unknown): UnavailableReason | null {
  if (typeof sourceRef !== 'string' || !sourceRef.startsWith(UNAVAILABLE_PREFIX)) return null;
  const rest = sourceRef.slice(UNAVAILABLE_PREFIX.length);
  const colon = rest.indexOf(':');
  const code = (colon < 0 ? rest : rest.slice(0, colon)) as UnavailableCode;
  if (!['not_food', 'no_match', 'no_estimate'].includes(code)) return null;
  return { code, detail: colon < 0 ? '' : rest.slice(colon + 1) };
}
// The sentence a reader sees. The model's own words follow in quotes when asked for.
export function unavailableSentence(name: string, sourceRef: unknown, withDetail = true): string | null {
  const reason = parseUnavailable(sourceRef);
  if (!reason) return null;
  const lead = reason.code === 'not_food' ? `The model did not treat “${name}” as a food, so no nutrition was estimated.`
    : reason.code === 'no_estimate' ? `No USDA record matched “${name}” and the model gave no usable estimate.`
    : `No USDA record matched “${name}”.`;
  return withDetail && reason.detail ? `${lead} The matcher said: “${reason.detail}”` : lead;
}
