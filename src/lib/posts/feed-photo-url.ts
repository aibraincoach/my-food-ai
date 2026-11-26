const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Immutable media identity keeps the private worker cache correct when a
// photo is removed or replaced. This module is also safe in browser bundles.
export function publicPhotoUrl(media: string, secret: string, width: 320 | 640 | 1080 | 1200 | 1600): string {
  return `/p/${media}_${secret}_${width}.webp`;
}
// With the photo's secret the address is the permanent public one; without it, the signed-in route.
export function smallFeedPhotoUrl(owner: string, post: string, media: string, secret?: string | null): string | null {
  if (secret && /^[0-9a-f]{32}$/.test(secret) && UUID.test(media)) return publicPhotoUrl(media, secret, 1080);
  return [owner, post, media].every(value => UUID.test(value))
    ? `/api/media/feed/${owner}/${post}/${media}/v2.webp` : null;
}

// Later sharp candidates use the immutable media identity.
export function feedPhotoSrcSet(url: string | null | undefined): string | undefined {
  const open = url?.match(/^(\/p\/[0-9a-f-]{36}_[0-9a-f]{32})_1080\.webp$/);
  // #372, #222: a 390-pixel card on a 3x phone needs 1170 pixels; 1200 serves it without the 1600 file's bytes.
  if (open) return `${open[1]}_640.webp 640w, ${open[1]}_1080.webp 1080w, ${open[1]}_1200.webp 1200w, ${open[1]}_1600.webp 1600w`;
  if (!url || !/\/v2\.webp$/.test(url)) return undefined;
  const base = url.slice(0, -'/v2.webp'.length);
  return `${url} 1x, ${base}/v2-1040.webp 2x, ${base}/v2-1560.webp 3x`;
}

// The fast server copy, feed card and initial preload select one fixed file.
export const FEED_PHOTO_SIZES = '(min-width: 1024px) 520px, 100vw';
export function firstPhotoSources(url: string): {src: string; srcSet?: string; sizes?: string} {
  const src = url.replace(/^(\/p\/[0-9a-f-]{36}_[0-9a-f]{32})_1080\.webp$/, '$1_320.webp');
  return {src};
}

let priorityRegistered = false;
let settleFirstPhoto!: () => void;
export const firstPhotoSettled = new Promise<void>(resolve => { settleFirstPhoto = resolve; });
export function registerFirstPhoto(): void { priorityRegistered = true; }
// Called at load, after priority readers have registered during their render.
export function settleWithoutFirstPhoto(): void { if (!priorityRegistered) settleFirstPhoto(); }

const sharpPhotos = new Map<string, Promise<HTMLImageElement>>();
function sharpPhoto(url: string): Promise<HTMLImageElement> {
  let pending = sharpPhotos.get(url);
  if (!pending) {
    pending = new Promise<void>(resolve => {
      const idle = () => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), {timeout: 3000});
        else setTimeout(resolve, 0);
      };
      if (document.readyState === 'complete') idle();
      else window.addEventListener('load', idle, {once: true});
    }).then(async () => {
      const copy = new Image();
      copy.crossOrigin = 'anonymous'; copy.fetchPriority = 'high';
      copy.sizes = FEED_PHOTO_SIZES; copy.srcset = feedPhotoSrcSet(url) ?? ''; copy.src = url;
      await copy.decode(); return copy;
    });
    // Only the current first photo needs a decoded sharp bitmap retained.
    sharpPhotos.clear(); sharpPhotos.set(url, pending);
  }
  return pending;
}

// The temporary server seed is replaced by the real feed. Only the visible
// mounted feed image upgrades, after its small first frame has actually painted.
export async function firstPhotoUpgrade(url: string, image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  if (image.closest('[data-fast-feed-seed]')) return;
  if (signal.aborted || !image.isConnected) { settleFirstPhoto(); return; }
  const settle = () => settleFirstPhoto();
  signal.addEventListener('abort', settle, {once: true});
  try {
    const sharp = sharpPhoto(url);
    // Start the sharp fetch on the existing load/idle trigger, independently of
    // the small frame. Attach rejection handling immediately while it paints.
    const decodedSharp = sharp.then(copy => ({copy}), error => ({error}));
    const visible = () => {
      const rect = image.getBoundingClientRect();
      return image.isConnected && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && getComputedStyle(image).visibility !== 'hidden';
    };
    const waitVisible = () => new Promise<boolean>(resolve => {
      const observer = new IntersectionObserver(() => { if (visible()) finish(true); });
      const finish = (value: boolean) => { observer.disconnect(); signal.removeEventListener('abort', abort); resolve(value); };
      const abort = () => finish(false);
      signal.addEventListener('abort', abort, {once: true}); observer.observe(image);
    });
    const paintSmall = async () => {
      while (!signal.aborted && image.isConnected) {
        if (!await waitVisible()) return false;
        await image.decode();
        if (signal.aborted) return false;
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (!signal.aborted && visible()) return true;
      }
      return false;
    };
    if (!await paintSmall()) return;
    const result = await decodedSharp;
    if ('error' in result) throw result.error;
    if (signal.aborted || (!visible() && !await paintSmall())) return;
    const srcset = feedPhotoSrcSet(url) ?? '';
    // The decoded browser-selected candidate uses the same responsive selection
    // as the visible box. Do not swap an unverified or differently sized bitmap.
    const candidates = (srcset ? srcset.split(',').map(candidate => candidate.trim().split(' ')[0]) : [url])
      .map(candidate => new URL(candidate, document.baseURI).href);
    if (result.copy.sizes !== FEED_PHOTO_SIZES || result.copy.srcset !== srcset || !candidates.includes(result.copy.currentSrc)) {
      throw new Error('Sharp photo candidate does not match the visible image');
    }
    // One synchronous write, while first-frame effects remain disabled.
    image.sizes = FEED_PHOTO_SIZES;
    image.srcset = srcset;
    image.src = url;
    await image.decode();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  } finally {
    signal.removeEventListener('abort', settle);
    settleFirstPhoto();
  }
}
