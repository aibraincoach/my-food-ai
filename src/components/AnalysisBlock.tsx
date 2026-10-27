"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedItem, FeedPost } from "@/lib/posts/feed";
import {
  formatConsumed,
  formatGrams,
  sumNutrition,
  toNumber,
  type Numeric,
} from "@/lib/nutrition/totals";

function itemPortion(item: FeedItem): string | null {
  if (item.portion_grams !== null && item.portion_grams !== undefined) {
    return formatGrams(item.portion_grams as Numeric);
  }
  return item.portion_text;
}

// The Consumed line expands in place to one line per item plus the macro
// line; tap again collapses. Small, muted, no rings, bars or percentages.
export default function AnalysisBlock({ post }: { post: FeedPost }) {
  const [open, setOpen] = useState(false);
  const totals = sumNutrition(post.items);
  const macroLine =
    `${Math.round(totals.protein_g)} g protein · ` +
    `${Math.round(totals.carbs_g)} g carbs · ` +
    `${Math.round(totals.fat_g)} g fat`;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="self-start text-sm font-medium text-neutral-900"
      >
        {formatConsumed(totals)}
      </button>
      {open ? (
        <div className="flex flex-col gap-1">
          <ul className="flex flex-col gap-0.5">
            {post.items.map((item) => {
              const portion = itemPortion(item);
              return (
                <li
                  key={item.id}
                  className="text-xs text-neutral-500"
                >
                  {item.name}
                  {portion ? ` · ${portion}` : ""}
                  {` · ${Math.round(toNumber(item.calories))} kcal`}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-neutral-500">{macroLine}</p>
          <Link
            href={`/posts/${post.id}`}
            className="text-xs text-neutral-500 underline"
          >
            View details
          </Link>
        </div>
      ) : null}
    </div>
  );
}
