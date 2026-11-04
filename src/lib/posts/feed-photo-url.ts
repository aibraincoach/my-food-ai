const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Immutable media identity keeps the private worker cache correct when a
// photo is removed or replaced. This module is also safe in browser bundles.
export function smallFeedPhotoUrl(owner: string, post: string, media: string): string | null {
  return [owner, post, media].every(value => UUID.test(value))
    ? `/api/media/feed/${owner}/${post}/${media}/v2.webp` : null;
}
