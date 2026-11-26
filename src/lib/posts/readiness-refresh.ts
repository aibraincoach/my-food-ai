// Home owns a fresh feed read and contribution reconciliation immediately
// after SSR. Other tabs still need the readiness observer's initial refresh.
export function refreshAfterReadinessSeed(path: string, hasHomeFeed: boolean): boolean {
  return path !== '/' || !hasHomeFeed;
}
export function refreshAfterReady(announce: boolean, wasPending: boolean, previousStatus: string | undefined): boolean {
  return announce || wasPending || previousStatus !== 'ready';
}

export interface RenderedReadinessPost { status: string; createdAt: string }
export interface ReadinessPost { id: string; status: string; created_at: string }
export interface ReadinessRead {
  latest: readonly ReadinessPost[] | null;
  // Null means the pending seed failed or has not completed, not an empty set.
  pending: ReadonlySet<string> | null;
}

// Only a page that renders every post/status can infer additions and deletions.
// The latest read uses the same created_at/id ordering as the window cutoff.
export function staleView(rendered: ReadonlyMap<string, RenderedReadinessPost>, read: ReadinessRead, listsAll: boolean): boolean {
  if (!listsAll) return false;
  const latest = read.latest;
  const byId = new Map(latest?.map(post => [post.id, post]));
  for (const [id, post] of rendered) {
    const current = byId.get(id);
    if (current && current.status !== post.status) return true;
    if (read.pending && ["queued", "processing"].includes(post.status) && !read.pending.has(id)) return true;
  }
  if (!latest) return false;
  if (latest.some(post => !rendered.has(post.id))) return true;
  const oldest = latest.at(-1);
  for (const [id, post] of rendered) {
    const inWindow = latest.length < 20 || (oldest &&
      (post.createdAt > oldest.created_at || (post.createdAt === oldest.created_at && id >= oldest.id)));
    if (inWindow && !byId.has(id)) return true;
  }
  return false;
}
