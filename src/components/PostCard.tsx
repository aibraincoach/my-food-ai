"use client";

import { failureMessage } from "@/lib/worker/failure-message";
import Link from "next/link";
import type {UploadState} from "@/lib/posts/upload-manager";
import {UploadMedia,UploadMenu} from "./UploadingPost";
import {useLocalDate,useLocalTime} from "@/components/LocalTime";
import { useEffect, useState, type ReactNode } from "react";
import {hasUnavailableFields, type FeedPost} from "@/lib/posts/feed";
import {summaryLine,type PostPresentation} from "@/lib/posts/summary-line";
import PostActions from "@/components/PostActions";
import PostCaption from "@/components/PostCaption";
import {usePostHandle,AgentAttribution} from "@/components/PostHandle";
import { formatConsumed, sumNutrition } from "@/lib/nutrition/totals";
import { tokens } from "@/lib/theme/tokens";
import LiveNutritionCard from "@/components/LiveNutritionCard";
import { currentTraffic } from "@/components/QueueTicker";
import { useDrinkCard } from "@/components/useDrinkCard";
import type { DrinkCardData } from "@/lib/intake/hydration";
import Carousel from "@/components/Carousel";
import PostMenu from "@/components/PostMenu";
import {readPendingItems} from '@/lib/pipeline/pending-items';
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
      window.dispatchEvent(new CustomEvent("post-created",{detail:{id:post.id,post}}));
    } catch(error) {setError(error instanceof Error?error.message:"Could not retry.");}
    finally{setRetrying(false);}
  };
  if (post.itemsUnavailable && !post.items.length) return <p className="text-detail text-muted" role="status">Meal details could not be loaded. Retrying…</p>;
  if (post.status === "failed") return <div className="flex flex-col gap-0.5 text-detail">
    <p className="text-muted">{failureMessage((post as FeedPost & { fail_reason?: string | null }).fail_reason)}</p>
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
  const pending=readPendingItems((post as FeedPost&{pendingItems?:unknown}).pendingItems);
  return <div className="flex flex-col gap-2" role="status" aria-label="Processing">
{pending.length?pending.map((item,index)=><div key={`${post.id}-${item.name}-${index}`} className="flex items-center justify-between gap-3"><span className="text-[15px]">{item.name}</span>{item.kcal===null?<Shimmer width={44}/>:<span className="text-[13px] text-muted">{item.kcal>0&&item.kcal<1?'<1':Math.round(item.kcal)} kcal</span>}</div>):<><Shimmer width={tokens.spacing.tap * 5} /><Shimmer width={tokens.spacing['table-row'] * 10} /></>}
    {(post as FeedPost & { fail_reason?: string | null }).fail_reason==='fdc: rate limited'&&<p className="text-detail text-muted">The food database was busy. Retrying automatically.</p>}
    <p className="text-meta text-faint">Processing, traffic {traffic}</p>
  </div>;
}

export default function PostCard({ post, showDate = false, upload, priority = false }: { priority?: boolean; upload?:UploadState;post: FeedPost; analysis?: ReactNode; showDate?: boolean }) {
  const record=post as PostPresentation;
  const drink = useDrinkCard(post.id, post.status, post.eaten_at, post.drink);
  const handle=usePostHandle(record.handle);
  const [slide,setSlide]=useState(0);
  const localClock=useLocalTime(post.eaten_at);const localDate=useLocalDate(post.eaten_at);
  const hasDrink=(record.kind==='drink'||Boolean(drink)) && (record.drinkSource ?? drink?.source ?? 'sheet') === 'sheet';
  const displayRecord = drink ? { ...record, dayHydration: { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } } : record;
  return <article className="flex flex-col" data-post-id={post.id} data-post-status={post.status} data-upload-id={upload?.operationId}>
    <div className="flex h-[52px] items-center gap-[10px] px-inset">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-circle bg-text text-avatar text-surface">{handle.slice(0,1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate text-handle">{handle}<AgentAttribution name={post.agentName}/></span>
      {upload&&!upload.postId?(upload.state==='failed'?<UploadMenu upload={upload}/>:<span aria-hidden="true" className="flex size-tap items-center justify-center text-xl">···</span>):<PostMenu postId={post.id} caption={post.caption} eatenAt={post.eaten_at} gtin={record.gtin} rows={[
        ...(post.status==='ready'&&!hasDrink?[{label:'Add photo',onSelect:()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:post.id,notEaten:false}}))}]:[]),
        {label:'Log again',onSelect:()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId:post.id,post,savedMealId:record.saved_meal_id??null}}))},
        {label:record.saved_meal_id?'Unsave':'Save meal',onSelect:()=>window.dispatchEvent(new CustomEvent('save-meal',{detail:{postId:post.id,post,savedMealId:record.saved_meal_id??null}}))},
        {label:'Delete',muted:true,onSelect:()=>window.dispatchEvent(new CustomEvent('delete-post',{detail:{id:post.id,post}}))},
      ]}/>}
    </div>
    {upload?.previewUrl?<UploadMedia upload={upload} post={post} onIndexChange={setSlide} nutrition={<CaptionCard post={post} drink={drink}/>}/>:drink && hasDrink ? <Link href={`/posts/${post.id}`} aria-label="Open drink details" className="block"><CaptionCard post={post} drink={drink} /></Link> : post.slides?.length ? <Carousel priority={priority} canAddNotEaten={post.status==='ready'&&post.slides.some(s=>s.kind==='photo')} slides={post.slides} caption={post.caption} postId={post.id} href={`/posts/${post.id}`} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} onIndexChange={setSlide} nutrition={post.status === "ready" ? <CaptionCard post={post} drink={drink} /> : <div className="flex aspect-square items-center justify-center bg-card text-detail text-muted">Processing…</div>} /> : post.status === "ready" && post.items.length ? <Link href={`/posts/${post.id}`} aria-label="Open meal details" className="block"><CaptionCard post={post} drink={drink} /></Link> : null}
    {!(upload&&!upload.postId&&upload.state==='failed')&&<div inert={Boolean(upload&&!upload.postId)} className={upload&&!upload.postId?"pointer-events-none opacity-50":undefined}><PostActions post={post} postId={post.id} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} drink={hasDrink} saved={Boolean(record.saved_meal_id)} slides={hasDrink?1:post.slides?.length??1} index={slide}/></div>}
    <div className={`flex flex-col gap-1 px-inset ${upload&&!upload.postId&&upload.state==='failed'?'pt-3':'pt-[10px]'}`}>
      <PostCaption postId={post.id} handle={handle} caption={upload&&!upload.postId?upload.caption:post.caption}/>
      {post.status==='ready'&&(post.itemDrinks?.length??0)>=2&&<div className="my-2 flex flex-col divide-y divide-line rounded-[14px] bg-card px-4 py-1" aria-label="Drinks">{post.itemDrinks!.map((row,index)=><Link key={row.post_item_id??index} href={`/posts/${post.id}`} className="flex min-h-tap items-center justify-between gap-3 text-[15px]"><span>{row.label} · {Math.round(row.ml).toLocaleString('en-US')} ml</span><span className="shrink-0 tabular-nums text-muted">{row.caffeineMg>0?`${Math.round(row.caffeineMg).toLocaleString('en-US')} mg`:'—'}</span></Link>)}</div>}
      {post.status==='ready'&&post.itemDrinks?.some(row=>row.caffeineMg>0&&row.caffeineMg===Math.min(1000,Math.round(32*row.ml/330))&&post.items.some(item=>item.id===row.post_item_id&&/\b(coca[- ]?cola|coke|cola|pepsi)\b/i.test(item.name)&&!item.micronutrients?.some(n=>n.nutrientId===1057&&n.basis==='portion')))&&<p className="text-meta text-muted">Cola caffeine estimated at 32 mg per 330 ml.</p>}
      {upload&&!upload.postId?<p className="text-detail text-muted">{upload.state==='failed'?'Not posted yet. The photo is kept on this phone.':'Uploading photo…'}</p>:post.status==='ready'&&post.items.length>0 ? <Link href={`/posts/${post.id}`} className="text-detail leading-[1.4] text-muted">{summaryLine(displayRecord,drink)} <span className="text-text">more</span></Link> : <StatusLine post={post}/>}
      {hasUnavailableFields(post) && post.items.length > 0 ? <p className="text-meta text-muted" role="status">Some meal details could not be refreshed. Retrying…</p> : null}
      <time dateTime={post.eaten_at} className="text-meta text-muted">{upload&&!upload.postId?"Just now":showDate ? localDate : localClock}</time>
    </div>
  </article>;
}
