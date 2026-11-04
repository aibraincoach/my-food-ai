import {createClient} from '@/lib/supabase/server';
import {feedPhotoPath, readFeedSource, reserveFeedPhoto, resizeSharpPhoto, MAX_ORIGINAL_SOURCE_BYTES, SHARP_FEED_BOXES, type SharpVariant} from '@/lib/posts/feed-photo';

// Sharper feed copies (2x, 3x) made from the original and cached a year under
// their own identity; the v1 route stays for 1x screens and old caches.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers});

export async function GET(request: Request, context: {params: Promise<{owner: string; post: string; media: string; variant: string}>}) {
  try { return await readPhoto(request, context); }
  catch { return fail(503); }
}

async function readPhoto(request: Request, context: {params: Promise<{owner: string; post: string; media: string; variant: string}>}) {
  const {owner, post, media, variant} = await context.params;
  if (![owner, post, media].every(value => UUID.test(value)) || new URL(request.url).search) return fail(404);
  const box = Object.hasOwn(SHARP_FEED_BOXES, variant) ? SHARP_FEED_BOXES[variant as SharpVariant] : null;
  if (!box) return fail(404);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(6000)]);
  const db = await createClient(signal);
  // Identity from the cookie avoids a network Auth call per photo. The next
  // lookup and original object fetch still enforce real session RLS.
  const {data: {session}} = await db.auth.getSession();
  if (!session?.user) return fail(401);
  if (owner !== session.user.id) return fail(404);
  const {data, error} = await db.from('post_media').select('storage_path,kind').eq('id', media).eq('post_id', post).maybeSingle();
  if (error || !data || data.kind !== 'photo') return fail(404);
  if (!feedPhotoPath(data.storage_path, owner, post)) return fail(404);
  const cacheHeaders = {...headers, 'Cache-Control': 'private, max-age=31536000, immutable', ETag: `"${media}-${variant}"`};
  if (request.headers.get('if-none-match') === cacheHeaders.ETag) {
    return new Response(null, {status: 304, headers: cacheHeaders});
  }
  // Only called after the owning user's RLS lookup, including on overload/failure.
  const original = async () => {
    try {
      // The transform deadline may have expired; signing gets its own bounded client.
      const signing = await createClient(AbortSignal.timeout(2000));
      const result = await signing.storage.from('media').createSignedUrl(data.storage_path, 60);
      if (result.error || !result.data?.signedUrl) return fail(502);
      const target = new URL(result.data.signedUrl);
      if (target.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return fail(502);
      return new Response(null, {status: 302, headers: {...cacheHeaders, Location: target.href}});
    } catch { return fail(502); }
  };
  const release = reserveFeedPhoto();
  if (!release) return original();
  try {
    if (!session.access_token) return fail(401);
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const sourceUrl = new URL(`/storage/v1/object/authenticated/media/${data.storage_path.split('/').map(encodeURIComponent).join('/')}`, base.origin);
    const response = await fetch(sourceUrl, {headers: {Authorization: `Bearer ${session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}, signal, cache: 'no-store', redirect: 'error'});
    const source = await readFeedSource(response, MAX_ORIGINAL_SOURCE_BYTES);
    try {
      const output = await resizeSharpPhoto(source, box);
      if (signal.aborted) return original();
      return new Response(new Uint8Array(output), {headers: {...cacheHeaders, 'Content-Type': 'image/webp'}});
    } catch {
      // A failed or slow resize must still show a photo: a browser does not fall
      // back from a failed srcset candidate to src, so the answer is a redirect
      // to the signed original, the same fallback the v1 route uses on overload.
      return original();
    }
  } catch { return original(); }
  finally { release(); }
}
