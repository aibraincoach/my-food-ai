"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedItem, FeedPost } from "@/lib/posts/feed";
import { formatConsumed, formatGrams, sumNutrition, formatNutrition } from "@/lib/nutrition/totals";
import { Icon } from "@/components/ui/Icon";
import ThumbsFeedback from "@/components/ThumbsFeedback";

function itemPortion(item: FeedItem): string | null {
  return item.portion_grams == null ? item.portion_text : formatGrams(item.portion_grams);
}

export default function AnalysisBlock({ post }: { post: FeedPost }) {
  const [open, setOpen] = useState(false);
  const totals = sumNutrition(post.items);
  const macroLine = `${formatNutrition(totals.protein_g)} g protein · ${formatNutrition(totals.carbs_g)} g carbs · ${formatNutrition(totals.fat_g)} g fat`;
  return <div className="flex flex-col gap-px text-detail">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
      aria-controls={`analysis-${post.id}`}
      className={`flex min-h-tap items-center gap-2 self-start text-left ${open ? "text-text" : "text-muted"}`}>
      {formatConsumed(totals)}
      <Icon name="chevron-down" className={`text-faint ${open ? "rotate-180" : ""}`} />
    </button>
    {open ? <div id={`analysis-${post.id}`} className="flex flex-col gap-px text-muted">
      <Link href={`/posts/${post.id}`} aria-label="View meal details" className="flex flex-col gap-px">
        <ul className="flex flex-col gap-px">
          {post.items.map((item) => {
            const portion = itemPortion(item);
            return <li key={item.id}>{item.name}{portion ? ` · ${portion}` : ""}{` · ${formatNutrition(item.calories)} kcal`}</li>;
          })}
        </ul>
        <p className="tabular-nums">{macroLine}</p>
      </Link>
      <ThumbsFeedback postId={post.id} />
    </div> : null}
  </div>;
}
