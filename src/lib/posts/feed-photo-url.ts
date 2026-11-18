const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Immutable media identity keeps the private worker cache correct when a
// photo is removed or replaced. This module is also safe in browser bundles.
export function publicPhotoUrl(media: string, secret: string, width: 640 | 1080 | 1200 | 1600): string {
  return `/p/${media}_${secret}_${width}.webp`;
}
// With the photo's secret the address is the permanent public one; without it, the signed-in route.
export function smallFeedPhotoUrl(owner: string, post: string, media: string, secret?: string | null): string | null {
  if (secret && /^[0-9a-f]{32}$/.test(secret) && UUID.test(media)) return publicPhotoUrl(media, secret, 1080);
  return [owner, post, media].every(value => UUID.test(value))
    ? `/api/media/feed/${owner}/${post}/${media}/v2.webp` : null;
}

// Explicit 1x keeps href-less responsive HTML preloads and img selection equal.
// Existing v1/v2 identities stay usable; denser candidates read the original.
export function feedPhotoSrcSet(url: string | null | undefined): string | undefined {
  const open = url?.match(/^(\/p\/[0-9a-f-]{36}_[0-9a-f]{32})_1080\.webp$/);
  // #372, #222: a 390-pixel card on a 3x phone needs 1170 pixels; 1200 serves it without the 1600 file's bytes.
  if (open) return `${open[1]}_640.webp 640w, ${open[1]}_1080.webp 1080w, ${open[1]}_1200.webp 1200w, ${open[1]}_1600.webp 1600w`;
  if (!url || !/\/v[12]\.webp$/.test(url)) return undefined;
  const base = url.slice(0, -'/v1.webp'.length);
  return `${url} 1x, ${base}/v2-1040.webp 2x, ${base}/v2-1560.webp 3x`;
}
