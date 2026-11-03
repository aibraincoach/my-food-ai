import {createClient} from '@/lib/supabase/server';
import {feedPhotoPath, readFeedSource, reserveFeedPhoto, resizeFeedPhoto} from '@/lib/posts/feed-photo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers});

export async function GET(request: Request, context: {params: Promise<{owner: string; post: string; media: string}>}) {
  try { return await readPhoto(request, context); }
  catch { return fail(503); }
}

async function readPhoto(request: Request, context: {params: Promise<{owner: string; post: string; media: string}>}) {
  const {owner, post, media} = await context.params;
  if (![owner, post, media].every(value => UUID.test(value)) || new URL(request.url).search) return fail(404);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(4000)]);
  const db = await createClient(signal);
  const {data: {user}, error: authError} = await db.auth.getUser();
  if (authError || !user) return fail(401);
  if (owner !== user.id) return fail(404);
  const {data, error} = await db.from('post_media').select('storage_path,kind').eq('id', media).eq('post_id', post).maybeSingle();
  if (error || !data || data.kind !== 'photo') return fail(404);
  const path = feedPhotoPath(data.storage_path, owner, post);
  if (!path) return fail(404);
  const cacheHeaders = {...headers, 'Cache-Control': 'private, max-age=31536000, immutable', ETag: `"${media}-v1"`, Vary: 'Cookie'};
  // Authenticate and verify ownership even for conditional reads. No Storage
  // request or image work is needed when the browser already has this media.
  if (request.headers.get('if-none-match') === cacheHeaders.ETag) {
    return new Response(null, {status: 304, headers: cacheHeaders});
  }
  // Only called after the owning user's RLS lookup, including on overload/failure.
  const original = async () => {
    try {
      const result = await db.storage.from('media').createSignedUrl(data.storage_path, 60);
      if (result.error || !result.data?.signedUrl) return fail(502);
      const target = new URL(result.data.signedUrl);
      if (target.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return fail(502);
      return new Response(null, {status: 302, headers: {...headers, Location: target.href}});
    } catch { return fail(502); }
  };
  const release = reserveFeedPhoto();
  if (!release) return original();
  try {
    const {data: {session}} = await db.auth.getSession();
    if (!session?.access_token) return fail(401);
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const sourceUrl = new URL(`/storage/v1/object/authenticated/media/${path.split('/').map(encodeURIComponent).join('/')}`, base.origin);
    const response = await fetch(sourceUrl, {headers: {Authorization: `Bearer ${session.access_token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!}, signal, cache: 'no-store', redirect: 'error'});
    const source = await readFeedSource(response);
    try {
      const output = await resizeFeedPhoto(source);
      if (signal.aborted) return fail(503);
      return new Response(new Uint8Array(output), {headers: {...cacheHeaders, 'Content-Type': 'image/webp'}});
    } catch {
      return new Response(new Uint8Array(source), {headers: {...cacheHeaders, 'Content-Type': 'image/jpeg'}});
    }
  } catch { return original(); }
  finally { release(); }
}
