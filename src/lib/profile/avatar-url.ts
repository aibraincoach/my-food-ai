const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const AVATAR_VARIANTS = [256, 96] as const;
export type AvatarVariant = (typeof AVATAR_VARIANTS)[number];

export function avatarVariantFile(variant: AvatarVariant) {
  return `${variant}.webp`;
}

export function parseAvatarVariant(file: string): AvatarVariant | null {
  if (file === '256.webp') return 256;
  if (file === '96.webp') return 96;
  return null;
}

export function avatarStoragePath(userId: string, mediaId: string, variant: AvatarVariant) {
  return `${userId}/avatar/${mediaId}/${variant}.webp`;
}

export function avatarStoragePrefix(userId: string, mediaId: string) {
  return `${userId}/avatar/${mediaId}`;
}

export function avatarMediaUrl(userId: string, mediaId: string, variant: AvatarVariant) {
  if (!UUID.test(userId) || !UUID.test(mediaId)) return null;
  return `/api/media/avatar/${userId}/${mediaId}/${avatarVariantFile(variant)}`;
}

export function avatarPathAllowed(path: string, userId: string, mediaId: string) {
  const prefix = `${userId}/avatar/${mediaId}/`;
  if (!path.startsWith(prefix) || path.includes('..')) return false;
  return parseAvatarVariant(path.slice(prefix.length)) !== null;
}

export function pickAvatarVariant(displayPx: number): AvatarVariant {
  return displayPx > 40 ? 256 : 96;
}
