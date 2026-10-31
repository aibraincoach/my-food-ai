"use client";
import LiveNutritionCard from "@/components/LiveNutritionCard";
import { useDrinkCard } from "@/components/useDrinkCard";
import type { GridPost } from "@/lib/posts/grid";

export default function ProfileNutritionTile({ post }: { post: GridPost }) {
  // The existing hook batches all mounting drinks and resolves the timeline in
  // the browser's zone. Food tiles issue no extra hydration request.
  const drink = useDrinkCard(post.id, post.isDrink ? post.status : "pending", post.eaten_at);
  if (post.isDrink && !drink) return <span className="text-meta text-muted">Drank</span>;
  return <LiveNutritionCard items={post.items} eatenAt={post.eaten_at} drink={drink} />;
}
