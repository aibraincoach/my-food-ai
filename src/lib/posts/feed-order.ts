type DatedPost = { id: string; created_at: string };

// PostgREST timestamps use one UTC representation, retaining microseconds.
// Refreshing an older card must not promote it above a newer meal.
export function mergeFeedPosts<T extends DatedPost>(existing: T[], refreshed: T[]): T[] {
  const byId = new Map(existing.map(post => [post.id, post]));
  for (const post of refreshed) byId.set(post.id, post);
  return [...byId.values()].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id === b.id ? 0 : a.id < b.id ? 1 : -1;
  });
}
