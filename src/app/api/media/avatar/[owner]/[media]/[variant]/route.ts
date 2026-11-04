import {createClient} from '@/lib/supabase/server';
import {avatarPathAllowed, avatarStoragePath, parseAvatarVariant} from '@/lib/profile/avatar-url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers});

export async function GET(
  request: Request,
  context: {params: Promise<{owner: string; media: string; variant: string}>},
) {
  try {
    const {owner, media, variant: variantFile} = await context.params;
    const variant = parseAvatarVariant(variantFile);
    if (!variant || ![owner, media].every(value => UUID.test(value)) || new URL(request.url).search) {
      return fail(404);
    }

    const db = await createClient();
    const {data: {session}} = await db.auth.getSession();
    if (!session?.user) return fail(401);

    const {data: profile, error} = await db.from('profiles').select('avatar_media_id').eq('id', owner).maybeSingle();
    if (error || profile?.avatar_media_id !== media) return fail(404);

    const path = avatarStoragePath(owner, media, variant);
    if (!avatarPathAllowed(path, owner, media)) return fail(404);

    const cacheHeaders = {
      ...headers,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: `"${media}-${variant}"`,
      'Content-Type': 'image/webp',
    };
    if (request.headers.get('if-none-match') === cacheHeaders.ETag) {
      return new Response(null, {status: 304, headers: cacheHeaders});
    }

    const {data: {session: live}} = await db.auth.getSession();
    if (!live?.access_token) return fail(401);

    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const objectUrl = new URL(
      `/storage/v1/object/authenticated/media/${path.split('/').map(encodeURIComponent).join('/')}`,
      base.origin,
    );
    const response = await fetch(objectUrl, {
      headers: {
        Authorization: `Bearer ${live.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return fail(404);
    const body = await response.arrayBuffer();
    return new Response(body, {headers: cacheHeaders});
  } catch {
    return fail(503);
  }
}
