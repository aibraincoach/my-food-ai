"use client";

import Link from "next/link";
import {useLocalDate,useLocalTime} from "@/components/LocalTime";
import { useEffect, useState, type ReactNode } from "react";
import type { FeedPost } from "@/lib/posts/feed";
import { formatConsumed, sumNutrition } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import LiveNutritionCard from "@/components/LiveNutritionCard";
import { currentTraffic } from "@/components/QueueTicker";
import { useDrinkCard } from "@/components/useDrinkCard";
import type { DrinkCardData } from "@/lib/intake/hydration";
import Carousel from "@/components/Carousel";
import PostMenu from "@/components/PostMenu";
import { Shimmer } from "@/components/ui/Shimmer";


function CaptionCard({ post, drink }: { post: FeedPost; drink?: DrinkCardData | null }) {
  return <LiveNutritionCard items={post.items} eatenAt={post.eaten_at} drink={drink} />;
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
  const localClock=useLocalTime(post.eaten_at);const localDate=useLocalDate(post.eaten_at);
  return <article className="flex flex-col gap-2" data-post-id={post.id} data-post-status={post.status}>
    {drink ? <Link href={`/posts/${post.id}`} aria-label="Open drink details" className="block"><CaptionCard post={post} drink={drink} /></Link> : post.slides?.length ? <Carousel slides={post.slides} caption={post.caption} postId={post.id} href={`/posts/${post.id}`} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} nutrition={post.status === "ready" ? <CaptionCard post={post} /> : <div className="flex aspect-square items-center justify-center bg-card text-detail text-muted">Processing…</div>} /> : post.status === "ready" && post.items.length ? <Link href={`/posts/${post.id}`} aria-label="Open meal details" className="block"><CaptionCard post={post} /></Link> : null}
    <div className="flex flex-col gap-2 px-screen-x">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 whitespace-pre-wrap break-words text-body">{post.caption}</p>
        <PostMenu postId={post.id} caption={post.caption} />
        <time dateTime={post.eaten_at} className="shrink-0 whitespace-nowrap text-meta text-muted">{showDate ? localDate : localClock}</time>
      </div>
      {drink ? <p className="text-detail text-muted">Drank: {drink.ml} ml · {drink.totalMl.toLocaleString("en-US")} ml so far today</p> : post.status === "ready" && post.items.length > 0 && analysis ? analysis : <StatusLine post={post} />}
      {/* The one control that is always visible and labelled: every card, whatever its status. */}
      <Link href={`/posts/${post.id}`} className="flex min-h-tap items-center self-start text-detail text-text">Details ›</Link>
    </div>
  </article>;
}
