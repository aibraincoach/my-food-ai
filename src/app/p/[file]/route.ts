import {createAdminClient} from '@/lib/supabase/admin';
import {MAX_ORIGINAL_SOURCE_BYTES, readFeedSource, reserveFeedPhoto, resizeSharpPhoto} from '@/lib/posts/feed-photo';

// A photo's permanent public address: /p/{photo id}_{secret}_{width}.webp, width 640, 1080, 1200 or 1600.
// The secret on the photo's row is the only check, so the answer can be kept by the CDN.
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_(640|1080|1200|1600)\.webp$/;
const closed = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
const fail = (status: number) => new Response(null, {status, headers: closed});

export async function GET(request: Request, context: {params: Promise<{file: string}>}) {
  try {
    const {file} = await context.params;
    const match = FILE.exec(file.toLowerCase());
    if (!match || new URL(request.url).search) return fail(404);
    const [, media, secret, width] = match;
    const signal=AbortSignal.any([request.signal,AbortSignal.timeout(6000)]);
    const admin = createAdminClient(signal);
    const {data: photo, error} = await admin.from('post_media').select('post_id,storage_path,kind,photo_secret').eq('id', media).maybeSingle();
    if (error) return fail(503);
    if (!photo || photo.kind !== 'photo' || photo.photo_secret !== secret) return fail(404);
    const {data: post, error: postError} = await admin.from('posts').select('deleted_at').eq('id', photo.post_id).maybeSingle();
    if (postError) return fail(503);
    if (!post || post.deleted_at) return fail(404);
    const release = reserveFeedPhoto();
    if (!release) return fail(503);
    try {
      // Read the original as a bounded, cancellable stream, never as a whole Blob.
      const base=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
      const sourceUrl=new URL(`/storage/v1/object/authenticated/media/${photo.storage_path.split('/').map(encodeURIComponent).join('/')}`,base.origin);
      let output: Buffer;
      try {
        const response=await fetch(sourceUrl,{headers:{Authorization:`Bearer ${process.env.SUPABASE_SECRET_KEY!}`,apikey:process.env.SUPABASE_SECRET_KEY!},signal,cache:'no-store',redirect:'error'});
        if(response.status===404)return fail(404);
        const source=await readFeedSource(response,MAX_ORIGINAL_SOURCE_BYTES);
        output=await resizeSharpPhoto(source,Number(width));
        if(signal.aborted)return fail(503);
      } catch { return fail(503); }
      return new Response(new Uint8Array(output), {headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      }});
    } finally { release(); }
  } catch { return fail(503); }
}
