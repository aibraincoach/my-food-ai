const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Immutable media identity keeps the private worker cache correct when a
// photo is removed or replaced. This module is also safe in browser bundles.
export function smallFeedPhotoUrl(owner: string, post: string, media: string): string | null {
  return [owner, post, media].every(value => UUID.test(value))
    ? `/api/media/feed/${owner}/${post}/${media}/v2.webp` : null;
}

// Keep existing v1/v2 identities usable; density candidates read the original.
export function feedPhotoSrcSet(url: string | null | undefined): string | undefined {
  if (!url || !/\/v[12]\.webp$/.test(url)) return undefined;
  const base = url.slice(0, -'/v1.webp'.length);
  return `${base}/v2-1040.webp 2x, ${base}/v2-1560.webp 3x`;
}
