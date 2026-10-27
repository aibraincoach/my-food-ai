"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FeedPost } from "@/lib/posts/feed";
import { formatConsumed, sumNutrition, toNumber } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import { ResultsCard } from "@/components/ResultsCard";
import { Shimmer } from "@/components/ui/Shimmer";

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function CaptionCard({ post }: { post: FeedPost }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(tokens.spacing.phone);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const totals = sumNutrition(post.items);
  return <div ref={ref} className="aspect-square w-full overflow-hidden bg-card" aria-label="Meal nutrition summary">
    <ResultsCard size={width} time={timeLabel(post.eaten_at)} calories={totals.calories}
      protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g}
      items={post.items.map((item) => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) }))} />
  </div>;
}

function StatusLine({ post }: { post: FeedPost }) {
  if (post.status === "failed") return <div className="flex flex-col gap-0.5 text-detail">
    <p className="text-muted">This photo could not be analysed.</p>
    <span className="text-text">Try again</span>
  </div>;
  if (post.status === "ready") {
    if (!post.items.length) return <div className="flex flex-col gap-0.5 text-detail">
      <p className="text-muted">No food found in this photo.</p>
      <span className="text-text">Add a caption to log it</span>
    </div>;
    return <p className="text-detail text-muted">{formatConsumed(sumNutrition(post.items))}</p>;
  }
  return <div className="flex flex-col gap-2" role="status" aria-label="Processing">
    <Shimmer width={tokens.spacing.tap * 5} />
    <Shimmer width={tokens.spacing['table-row'] * 10} />
    <p className="text-meta text-faint">Processing, traffic low</p>
  </div>;
}

export default function PostCard({ post, analysis }: { post: FeedPost; analysis?: ReactNode }) {
  return <article className="flex flex-col gap-2" data-post-id={post.id} data-post-status={post.status}>
    {post.photoUrl ? (
      // Signed, already-sized feed copy; do not send private images to an optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.photoUrl} alt={post.caption || "Meal photo"} className="aspect-square w-full object-cover" />
    ) : post.status === "ready" && post.items.length ? <CaptionCard post={post} /> : null}
    <div className="flex flex-col gap-2 px-screen-x">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 whitespace-pre-wrap break-words text-body">{post.caption}</p>
        <time dateTime={post.eaten_at} className="shrink-0 whitespace-nowrap text-meta text-muted">{timeLabel(post.eaten_at)}</time>
      </div>
      {post.status === "ready" && post.items.length > 0 && analysis ? analysis : <StatusLine post={post} />}
    </div>
  </article>;
}
