import Link from "next/link";
import { formatNutrition } from "@/lib/nutrition/totals";
import type { GridPost } from "@/lib/posts/grid";

export function ProfileGrid({ posts }: { posts: GridPost[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} aria-label={post.caption || "Open post"}
          className="flex aspect-square min-w-0 items-center justify-center overflow-hidden bg-card text-tile-kcal tabular-nums">
          {post.photoUrl ? (
            // Signed private media must bypass the public image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photoUrl} alt={post.caption || "Meal"} className="h-full w-full object-cover" />
          ) : post.status !== "ready" ? (
            <span className="text-meta text-muted">{post.status === "failed" ? "Could not analyse" : post.status === "needs_input" ? "Needs input" : "Processing"}</span>
          ) : (
            <span>{formatNutrition(post.calories)} kcal</span>
          )}
        </Link>
      ))}
    </div>
  );
}
