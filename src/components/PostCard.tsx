"use client";

import Link from "next/link";
import {useLocalDate,useLocalTime} from "@/components/LocalTime";
import { useEffect, useState, type ReactNode } from "react";
import type { FeedPost } from "@/lib/posts/feed";
import {summaryLine,type PostPresentation} from "@/lib/posts/summary-line";
import PostActions from "@/components/PostActions";
import PostCaption from "@/components/PostCaption";
import {usePostHandle} from "@/components/PostHandle";
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
  return <LiveNutritionCard items={post.items} eatenAt={post.eaten_at} drink={drink} post={post} />;
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

export default function PostCard({ post, showDate = false }: { post: FeedPost; analysis?: ReactNode; showDate?: boolean }) {
  const record=post as PostPresentation;
  const drink = useDrinkCard(post.id, post.status, post.eaten_at, post.drink);
  const handle=usePostHandle(record.handle);
  const [slide,setSlide]=useState(0);
  const localClock=useLocalTime(post.eaten_at);const localDate=useLocalDate(post.eaten_at);
  const hasDrink=record.kind==='drink'||Boolean(drink);
  const displayRecord = drink ? { ...record, dayHydration: { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } } : record;
  return <article className="flex flex-col" data-post-id={post.id} data-post-status={post.status}>
    <div className="flex h-[52px] items-center gap-[10px] px-inset">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-circle bg-text text-avatar text-surface">{handle.slice(0,1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate text-handle">{handle}</span>
      <PostMenu postId={post.id} caption={post.caption} eatenAt={post.eaten_at} gtin={record.gtin} rows={[
        {label:'Log again',onSelect:()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId:post.id}}))},
        {label:record.saved_meal_id?'Unsave':'Save meal',onSelect:()=>window.dispatchEvent(new CustomEvent('save-meal',{detail:{postId:post.id}}))},
      ]}/>
    </div>
    {drink ? <Link href={`/posts/${post.id}`} aria-label="Open drink details" className="block"><CaptionCard post={post} drink={drink} /></Link> : post.slides?.length ? <Carousel slides={post.slides} caption={post.caption} postId={post.id} href={`/posts/${post.id}`} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} onIndexChange={setSlide} nutrition={post.status === "ready" ? <CaptionCard post={post} /> : <div className="flex aspect-square items-center justify-center bg-card text-detail text-muted">Processing…</div>} /> : post.status === "ready" && post.items.length ? <Link href={`/posts/${post.id}`} aria-label="Open meal details" className="block"><CaptionCard post={post} /></Link> : null}
    <PostActions postId={post.id} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} drink={hasDrink} saved={Boolean(record.saved_meal_id)} slides={drink?1:post.slides?.length??1} index={slide}/>
    <div className="flex flex-col gap-1 px-inset pt-[10px]">
      <PostCaption handle={handle} caption={post.caption}/>
      {post.status==='ready'&&post.items.length>0 ? <Link href={`/posts/${post.id}`} className="flex min-w-0 items-baseline gap-1 text-detail leading-[1.4] text-muted"><span className="min-w-0 flex-1 truncate">{summaryLine(displayRecord,drink)}</span><span className="shrink-0 text-text">more</span></Link> : <StatusLine post={post}/>}
      <time dateTime={post.eaten_at} className="text-meta text-muted">{showDate ? localDate : localClock}</time>
    </div>
  </article>;
}
