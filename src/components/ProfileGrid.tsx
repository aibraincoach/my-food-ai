import {getTranslations} from "next-intl/server";
import Link from "next/link";
import ProfileNutritionTile from "@/components/ProfileNutritionTile";
import type { GridPost } from "@/lib/posts/grid";

export async function ProfileGrid({ posts }: { posts: GridPost[] }) {
  const t=await getTranslations("profile");
  return (
    <div data-profile-grid data-lists-all className="mt-3 grid grid-cols-3 gap-0.5 desktop:mt-7 desktop:gap-1 desktop:border-t desktop:border-hairline desktop:pt-1">
      {posts.map((post) => (
        <Link data-desktop-post={post.id} data-post-id={post.id} data-post-status={post.status} data-post-created={post.created_at} key={post.id} href={`/posts/${post.id}`} aria-label={post.caption || t("openPost")}
          className="desktop:rounded-[4px] flex aspect-square min-w-0 items-center justify-center overflow-hidden bg-card text-tile-kcal tabular-nums">
          {post.photoUrl ? (
            // Signed private media must bypass the public image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.photoUrl} alt={post.caption || t("meal")} loading="lazy" decoding="async" width={640} height={640} className="h-full w-full object-cover" />
          ) : post.status !== "ready" ? (
            <span className="text-meta text-muted">{post.status === "failed" ? t("analyseFailed") : post.status === "needs_input" ? t("needsInput") : t("processing")}</span>
          ) : (
            <ProfileNutritionTile post={post} />
          )}
        </Link>
      ))}
    </div>
  );
}
