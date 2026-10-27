import type { FeedPost } from "@/lib/posts/feed";
import { formatConsumed, sumNutrition } from "@/lib/nutrition/totals";

function formatEatenAt(eatenAt: string): string {
  const date = new Date(eatenAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function StatusLine({ post }: { post: FeedPost }) {
  if (post.status === "queued" || post.status === "processing") {
    return (
      <div
        className="h-4 w-2/3 animate-pulse rounded bg-neutral-200"
        role="status"
        aria-label="Processing"
      />
    );
  }
  if (post.status === "failed") {
    return <p className="text-sm text-neutral-500">Could not analyse</p>;
  }
  if (post.status === "ready") {
    if (post.items.length === 0) {
      return <p className="text-sm text-neutral-500">No food found</p>;
    }
    return (
      <p className="text-sm font-medium text-neutral-900">
        {formatConsumed(sumNutrition(post.items))}
      </p>
    );
  }
  return (
    <div
      className="h-4 w-2/3 animate-pulse rounded bg-neutral-200"
      role="status"
      aria-label="Processing"
    />
  );
}

export default function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="flex flex-col gap-2 border-b border-neutral-200 pb-4">
      {post.photoUrl ? (
        // Plain img on purpose: the feed copy is a pre-sized JPEG behind a
        // signed URL, not an optimized remote image (item 5).
        <img
          src={post.photoUrl}
          alt={post.caption || "Meal photo"}
          className="w-full rounded-lg object-cover"
        />
      ) : null}
      {post.caption ? (
        <p className="text-sm text-neutral-900">{post.caption}</p>
      ) : null}
      <time
        dateTime={post.eaten_at}
        className="text-xs text-neutral-500"
      >
        {formatEatenAt(post.eaten_at)}
      </time>
      <StatusLine post={post} />
    </article>
  );
}
