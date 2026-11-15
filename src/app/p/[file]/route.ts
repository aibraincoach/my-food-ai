import {createAdminClient} from '@/lib/supabase/admin';
import {reserveFeedPhoto, resizeSharpPhoto} from '@/lib/posts/feed-photo';

// A photo's permanent public address: /p/{photo id}_{secret}_{width}.webp.
// The secret on the photo's row is the only check, so the answer can be kept by the CDN.
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_(640|1080|1600)\.webp$/;
const closed = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers: closed});

export async function GET(request: Request, context: {params: Promise<{file: string}>}) {
  try {
    const {file} = await context.params;
    const match = FILE.exec(file.toLowerCase());
    if (!match || new URL(request.url).search) return fail(404);
    const [, media, secret, width] = match;
    const admin = createAdminClient();
    const {data: photo, error} = await admin.from('post_media').select('post_id,storage_path,kind,photo_secret').eq('id', media).maybeSingle();
    if (error) return fail(503);
    if (!photo || photo.kind !== 'photo' || photo.photo_secret !== secret) return fail(404);
    const {data: post, error: postError} = await admin.from('posts').select('deleted_at').eq('id', photo.post_id).maybeSingle();
    if (postError) return fail(503);
    if (!post || post.deleted_at) return fail(404);
    // A browser does not fall back from a failed srcset candidate, so a busy or failed
    // resize answers with a short signed link to the stored original, as the signed-in route does.
    const original = async () => {
      const {data: signed, error: signError} = await admin.storage.from('media').createSignedUrl(photo.storage_path, 60);
      if (signError || !signed?.signedUrl) return fail(503);
      return new Response(null, {status: 302, headers: {...closed, Location: signed.signedUrl}});
    };
    const release = reserveFeedPhoto();
    if (!release) return original();
    try {
      const {data: blob, error: downloadError} = await admin.storage.from('media').download(photo.storage_path);
      if (downloadError || !blob) return fail(404);
      let output: Buffer;
      try { output = await resizeSharpPhoto(Buffer.from(await blob.arrayBuffer()), Number(width)); }
      catch { return original(); }
      return new Response(new Uint8Array(output), {headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      }});
    } finally { release(); }
  } catch { return fail(503); }
}
