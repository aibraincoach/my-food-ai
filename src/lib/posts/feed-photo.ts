import sharp from 'sharp';

export const MAX_FEED_SOURCE_BYTES = 4 * 1024 * 1024;
// Chosen limit for original downloads; larger files use the signed-original fallback.
export const MAX_ORIGINAL_SOURCE_BYTES = 8 * 1024 * 1024;
export const SHARP_FEED_BOXES = {'v2-1040.webp': 1040, 'v2-1560.webp': 1560} as const;
export type SharpVariant = keyof typeof SHARP_FEED_BOXES;
let active = 0;
// Bound both downloads and native transforms; overload keeps the authorized original usable.
export function reserveFeedPhoto(): (() => void) | null {
  if (active >= 4) return null;
  active++;
  let released = false;
  return () => { if (!released) { released = true; active--; } };
}
export function feedPhotoPath(path: unknown, owner: string, post: string): string | null {
  if (typeof path !== 'string' || !path.startsWith(`${owner}/${post}/`)) return null;
  const name = path.slice(`${owner}/${post}/`.length);
  if (!/^[a-zA-Z0-9_-]+\.jpg$/.test(name)) return null;
  return path.replace(/\.jpg$/, '.feed.jpg');
}
export async function readFeedSource(response: Response, limit = MAX_FEED_SOURCE_BYTES): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error('Source unavailable');
  const length = Number(response.headers.get('content-length'));
  if (length > limit) { await response.body.cancel(); throw new Error('Source too large'); }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) throw new Error('Source too large');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  const source = Buffer.concat(chunks);
  if (source.length < 3 || source[0] !== 0xff || source[1] !== 0xd8 || source[2] !== 0xff) throw new Error('Expected JPEG');
  return source;
}
// v1 remains byte-policy compatible with its year-long immutable URLs. v2
// retains enough pixels for a 3x phone; its source JPEG is capped at 1920 px.
export async function resizeFeedPhoto(source: Buffer, version: 1 | 2 = 1): Promise<Buffer> {
  if (version === 2) {
    const transform = (quality: number) => sharp(source,{limitInputPixels:4_000_000,failOn:'error'})
      .timeout({seconds:1}).rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true})
      .webp({quality,effort:3}).toBuffer();
    const output=await transform(76);
    return output.length<=220_000?output:transform(64);
  }
  const output = await sharp(source, {limitInputPixels: 2_000_000, failOn: 'error'})
    .timeout({seconds: 1}).rotate().resize({width: 512, height: 512, fit: 'inside', withoutEnlargement: true})
    .webp({quality: 62, effort: 3}).toBuffer();
  if (output.length <= 50_000) return output;
  const smaller = await sharp(source, {limitInputPixels: 2_000_000, failOn: 'error'})
    .timeout({seconds: 1}).rotate().resize({width: 384, height: 384, fit: 'inside', withoutEnlargement: true})
    .webp({quality: 50, effort: 3}).toBuffer();
  if (smaller.length > 50_000) throw new Error('Preview too large');
  return smaller;
}

// Density-specific copies read the original, independently of the legacy feed JPEG.
export async function resizeSharpPhoto(source: Buffer, box: number): Promise<Buffer> {
  const output = await sharp(source, {limitInputPixels: 16_777_216, failOn: 'error'})
    .timeout({seconds: 3}).rotate().resize({width: box, height: box, fit: 'inside', withoutEnlargement: true})
    .webp({quality: 68, effort: 3}).toBuffer();
  if (output.length > 600_000) throw new Error('Sharp copy too large');
  return output;
}
