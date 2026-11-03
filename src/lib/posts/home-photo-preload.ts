import type { SupabaseClient } from '@supabase/supabase-js';
import { smallFeedPhotoUrl } from './feed-photo-url';

const PRELOAD_DEADLINE_MS = 350;
type FirstPost = {
  id: string;
  user_id: string;
  post_media: { id: string; kind: string; position: number }[] | null;
};

// Edge-safe: share only the immutable URL formatter with the feed renderer.
// Keep visibility and ordering in sync with getFirstFeedPhoto in feed.ts.
export async function homePhotoPreload(db: SupabaseClient, pathname: string, userId: string | undefined): Promise<string | null> {
  if (pathname !== '/' || !userId || !smallFeedPhotoUrl(userId, userId, userId)) return null;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>(resolve => {
    timer = setTimeout(() => { controller.abort(); resolve(null); }, PRELOAD_DEADLINE_MS);
  });
  try {
    const read = async () => {
      const { data, error } = await db.from('posts').select('id,user_id,post_media(id,kind,position)')
        .eq('user_id', userId).neq('status', 'needs_input').or('needs_input.is.null,status.eq.failed')
        .order('eaten_at', { ascending: false }).order('id', { ascending: false }).limit(1)
        .abortSignal(controller.signal).maybeSingle();
      if (error || !data || controller.signal.aborted) return null;
      const post = data as FirstPost;
      if (post.user_id !== userId) return null;
      const photo = [...(post.post_media ?? [])].filter(row => row.kind === 'photo').sort((a, b) => a.position - b.position)[0];
      const url = photo ? smallFeedPhotoUrl(post.user_id, post.id, photo.id) : null;
      return url ? `<${url}>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous` : null;
    };
    return await Promise.race([read(), deadline]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
