import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {adminRequestAllowed} from '@/lib/auth/admin-access';
import {avatarPathAllowed, avatarStoragePath, parseAvatarVariant} from '@/lib/profile/avatar-url';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const privateHeaders = {
  'Cache-Control': 'private, max-age=31536000, immutable',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};
const fail = (status: number) => new Response(null, {status, headers: privateHeaders});

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
    const viewerId = session?.user?.id;
    if (!viewerId) return fail(401);

    const adminAllowed = await adminRequestAllowed(viewerId, async () => {
      const {data, error} = await db.from('profiles').select('role').eq('id', viewerId).maybeSingle();
      return {data, error};
    });
    if (viewerId !== owner && !adminAllowed) return fail(404);

    const profileClient = viewerId === owner ? db : createAdminClient();
    const {data: profile, error} = await profileClient.from('profiles').select('avatar_media_id').eq('id', owner).maybeSingle();
    if (error || profile?.avatar_media_id !== media) return fail(404);

    const path = avatarStoragePath(owner, media, variant);
    if (!avatarPathAllowed(path, owner, media)) return fail(404);

    const cacheHeaders = {
      ...privateHeaders,
      ETag: `"${media}-${variant}"`,
      'Content-Type': 'image/webp',
    };
    if (request.headers.get('if-none-match') === cacheHeaders.ETag) {
      return new Response(null, {status: 304, headers: cacheHeaders});
    }

    const admin = createAdminClient();
    const {data, error: downloadError} = await admin.storage.from('media').download(path);
    if (downloadError || !data) return fail(404);
    const body = await data.arrayBuffer();
    return new Response(body, {headers: cacheHeaders});
  } catch {
    return fail(503);
  }
}
