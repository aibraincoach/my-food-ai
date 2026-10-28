type DatedPost = { id: string; eaten_at: string };

// Meals are ordered by when they were eaten (id breaks ties). PostgREST timestamps use one UTC
// representation, retaining microseconds. Refreshing an older card must not promote it above a newer meal.
export function mergeFeedPosts<T extends DatedPost>(existing: T[], refreshed: T[]): T[] {
  const byId = new Map(existing.map(post => [post.id, post]));
  for (const post of refreshed) byId.set(post.id, post);
  return [...byId.values()].sort((a, b) => {
    if (a.eaten_at !== b.eaten_at) return a.eaten_at < b.eaten_at ? 1 : -1;
    return a.id === b.id ? 0 : a.id < b.id ? 1 : -1;
  });
}

// IDs from realtime are not a pagination baseline: they may themselves sit
// above an unseen gap. Only overlap with an actual fetched page proves continuity.
export function discoveryLostOverlap(baseline: { id: string }[], discovered: { id: string }[], pageSize: number): boolean {
  return discovered.length >= pageSize && !discovered.some(row => baseline.some(post => post.id === row.id));
}
