import sharp from 'sharp';

export const MAX_FEED_SOURCE_BYTES = 4 * 1024 * 1024;
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
export async function readFeedSource(response: Response): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error('Source unavailable');
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_FEED_SOURCE_BYTES) { await response.body.cancel(); throw new Error('Source too large'); }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_SOURCE_BYTES) throw new Error('Source too large');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  const source = Buffer.concat(chunks);
  if (source.length < 3 || source[0] !== 0xff || source[1] !== 0xd8 || source[2] !== 0xff) throw new Error('Expected JPEG');
  return source;
}
export async function resizeFeedPhoto(source: Buffer): Promise<Buffer> {
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
