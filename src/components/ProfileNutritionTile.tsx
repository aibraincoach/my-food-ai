"use client";
import {useTranslations} from "next-intl";
import LiveNutritionCard from "@/components/LiveNutritionCard";
import { useDrinkCard } from "@/components/useDrinkCard";
import type { GridPost } from "@/lib/posts/grid";

export default function ProfileNutritionTile({ post }: { post: GridPost }) {
  const t=useTranslations("profile");
  // The existing hook batches all mounting drinks and resolves the timeline in
  // the browser's zone. Food tiles issue no extra hydration request.
  const drink = useDrinkCard(post.id, post.isDrink ? post.status : "pending", post.eaten_at);
  if (post.isDrink && !drink) return <span className="text-meta text-muted">{t("drank")}</span>;
  return <LiveNutritionCard items={post.items} eatenAt={post.eaten_at} drink={drink} />;
}
