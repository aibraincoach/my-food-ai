import Link from "next/link";
import ProfileNutritionTile from "@/components/ProfileNutritionTile";
import type { GridPost } from "@/lib/posts/grid";

export function ProfileGrid({ posts }: { posts: GridPost[] }) {
  return (
    <div data-profile-grid className="mt-3 grid grid-cols-3 gap-0.5 desktop:mt-5 desktop:gap-1">
      {posts.map((post) => (
        <Link data-desktop-post={post.id} key={post.id} href={`/posts/${post.id}`} aria-label={post.caption || "Open post"}
          className="desktop:rounded-[4px] flex aspect-square min-w-0 items-center justify-center overflow-hidden bg-card text-tile-kcal tabular-nums">
          {post.photoUrl ? (
            // Signed private media must bypass the public image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photoUrl} alt={post.caption || "Meal"} className="h-full w-full object-cover" />
          ) : post.status !== "ready" ? (
            <span className="text-meta text-muted">{post.status === "failed" ? "Could not analyse" : post.status === "needs_input" ? "Needs input" : "Processing"}</span>
          ) : (
            <ProfileNutritionTile post={post} />
          )}
        </Link>
      ))}
    </div>
  );
}
