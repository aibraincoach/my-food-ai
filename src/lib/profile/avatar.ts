import sharp from 'sharp';
import type {AvatarVariant} from '@/lib/profile/avatar-url';

export {AVATAR_VARIANTS, avatarStoragePath, avatarStoragePrefix} from '@/lib/profile/avatar-url';
export type {AvatarVariant} from '@/lib/profile/avatar-url';

export const MAX_AVATAR_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function encodeAvatarWebp(source: Buffer, variant: AvatarVariant) {
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error('invalid image');
  if (Math.max(meta.width, meta.height) > 4096) throw new Error('image too large');
  return sharp(source).rotate().resize(variant, variant, {fit: 'cover'}).webp({quality: 85}).toBuffer();
}

export async function readAvatarUpload(source: Buffer) {
  if (source.byteLength > MAX_AVATAR_UPLOAD_BYTES) throw new Error('upload too large');
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error('invalid image');
  return source;
}
