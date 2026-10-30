"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FeedPost } from "@/lib/posts/feed";
import { formatConsumed, sumNutrition, toNumber } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import { ResultsCard } from "@/components/ResultsCard";
import { currentTraffic } from "@/components/QueueTicker";
import { useDrinkCard } from "@/components/useDrinkCard";
import type { DrinkCardData } from "@/lib/intake/hydration";
import Carousel from "@/components/Carousel";
import { Shimmer } from "@/components/ui/Shimmer";

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function CaptionCard({ post, drink }: { post: FeedPost; drink?: DrinkCardData | null }) {
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
    <ResultsCard drink={drink} size={width} time={timeLabel(post.eaten_at)} calories={totals.calories}
      protein={totals.protein_g} carbs={totals.carbs_g} fat={totals.fat_g}
      items={post.items.map((item) => ({ name: item.name, grams: item.portion_grams == null ? null : toNumber(item.portion_grams) }))} />
  </div>;
}

function StatusLine({ post }: { post: FeedPost }) {
  const [traffic,setTraffic]=useState(currentTraffic);
  const [retrying,setRetrying]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    const receive=(event:Event)=>setTraffic((event as CustomEvent<{traffic:string}>).detail.traffic);
    window.addEventListener("queue-traffic",receive);
    return ()=>window.removeEventListener("queue-traffic",receive);
  },[]);
  const retry=async()=>{
    setRetrying(true);setError("");
    try {
      const response=await fetch(`/api/posts/${post.id}/retry`,{method:"POST"});
      if(!response.ok) throw new Error("Could not retry. Please try again.");
      window.dispatchEvent(new CustomEvent("post-created",{detail:{id:post.id}}));
    } catch(error) {setError(error instanceof Error?error.message:"Could not retry.");}
    finally{setRetrying(false);}
  };
  if (post.status === "failed") return <div className="flex flex-col gap-0.5 text-detail">
    <p className="text-muted">This photo could not be analysed.</p>
    <button type="button" disabled={retrying} onClick={retry} className="min-h-tap self-start text-text">{retrying?"Retrying…":"Try again"}</button>
    {error&&<p role="alert">{error}</p>}
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
    <p className="text-meta text-faint">Processing, traffic {traffic}</p>
  </div>;
}

export default function PostCard({ post, analysis, showDate = false }: { post: FeedPost; analysis?: ReactNode; showDate?: boolean }) {
  const drink = useDrinkCard(post.id, post.status, post.eaten_at);
  return <article className="flex flex-col gap-2" data-post-id={post.id} data-post-status={post.status}>
    {drink ? <Link href={`/posts/${post.id}`} aria-label="Open drink details" className="block"><CaptionCard post={post} drink={drink} /></Link> : post.slides?.length ? <Carousel slides={post.slides} caption={post.caption} postId={post.id} href={`/posts/${post.id}`} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} /> : post.status === "ready" && post.items.length ? <Link href={`/posts/${post.id}`} aria-label="Open meal details" className="block"><CaptionCard post={post} /></Link> : null}
    <div className="flex flex-col gap-2 px-screen-x">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 whitespace-pre-wrap break-words text-body">{post.caption}</p>
        <time dateTime={post.eaten_at} className="shrink-0 whitespace-nowrap text-meta text-muted">{showDate ? new Date(post.eaten_at).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}) : timeLabel(post.eaten_at)}</time>
      </div>
      {drink ? <p className="text-detail text-muted">Drank: {drink.ml} ml · {drink.totalMl.toLocaleString("en-US")} ml so far today</p> : post.status === "ready" && post.items.length > 0 && analysis ? analysis : <StatusLine post={post} />}
      {/* The one control that is always visible and labelled: every card, whatever its status. */}
      <Link href={`/posts/${post.id}`} className="flex min-h-tap items-center self-start text-detail text-text">Details ›</Link>
    </div>
  </article>;
}
