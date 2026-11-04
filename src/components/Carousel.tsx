"use client";
import {feedPhotoSrcSet} from '@/lib/posts/feed-photo-url';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import DoubleTap from '@/components/DoubleTap';
import {imageIdentity,retainedImageUrl} from '@/lib/media/retained-image';
import {observeNearViewport} from '@/lib/media/near-viewport';
import {useRemovalMenus} from '@/components/useRemovalMenus';
import UndoToast from '@/components/UndoToast';
import type {FeedItem} from '@/lib/posts/feed';
import {formatCalories,toNumber} from '@/lib/nutrition/totals';
import {delayAction} from '@/lib/posts/delayed-action';
export type Slide={id?:string;url:string;kind?:'photo'|'card';not_eaten?:boolean;width?:number;height?:number};
export default function Carousel({slides,caption,postId,href,modelCommentId,fingerprint,nutrition,items=[],onIndexChange,canAddNotEaten=false,priority=false}:{priority?:boolean;items?:FeedItem[];slides:Slide[];caption:string;postId:string;href?:string;modelCommentId:string|null;fingerprint:string|null;nutrition:ReactNode;onIndexChange?:(index:number)=>void;canAddNotEaten?:boolean}) {
 const menus=useRef<HTMLDivElement>(null);useRemovalMenus(menus);
 const [index,setIndex]=useState(0);const [removed,setRemoved]=useState<string[]>([]),[removing,setRemoving]=useState(false),[error,setError]=useState('');const router=useRouter();
 const [toast,setToast]=useState<{key:number;undo:()=>void}|null>(null);
 const [unmarked,setUnmarked]=useState<string[]>([]),[unmarkToast,setUnmarkToast]=useState(0),[unmarking,setUnmarking]=useState(false);
 const pendingUnmark=useRef<{id:string;undo:()=>boolean}|null>(null);
 const replacement=useRef<{id:string;attached:boolean;busy:boolean;attempts:number}|null>(null);
 const wholeKnown=items.length>0&&items.every(item=>item.calories!=null&&(!(item.not_eaten_grams??0)||item.not_eaten_calories!=null));
 const whole=wholeKnown?`${formatCalories(items.reduce((sum,item)=>sum+toNumber(item.calories)+toNumber(item.not_eaten_calories),0))} kcal`:'nutrition unavailable';
 const unmark=(mediaId:string)=>{
  if(pendingUnmark.current||removing)return;
  setError('');setUnmarking(true);setUnmarked(old=>[...old,mediaId]);setUnmarkToast(value=>value+1);
  let settled=false;
  const flush=(keepalive=false)=>{
   if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener('pagehide',leave);pendingUnmark.current=null;
   void fetch(`/api/posts/${postId}/media?media_id=${mediaId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({not_eaten:false}),keepalive})
    .then(async response=>{if(!response.ok)throw Error('The photo could not be unmarked. Try again.');window.dispatchEvent(new CustomEvent('post-created',{detail:{id:postId}}));router.refresh();})
    .catch(cause=>{setUnmarked(old=>old.filter(id=>id!==mediaId));setError(cause instanceof Error?cause.message:'The photo could not be unmarked.');}).finally(()=>setUnmarking(false));
  };
  const leave=()=>flush(true);
  const timer=setTimeout(()=>flush(),6000);window.addEventListener('pagehide',leave);
  pendingUnmark.current={id:mediaId,undo:()=>{if(settled)return false;settled=true;clearTimeout(timer);window.removeEventListener('pagehide',leave);return true;}};
 };
 const undoUnmark=()=>{const pending=pendingUnmark.current;if(pending?.undo()){setUnmarked(old=>old.filter(id=>id!==pending.id));pendingUnmark.current=null;setUnmarking(false);setUnmarkToast(0);}};
 const replace=(mediaId:string)=>{if(removing||pendingUnmark.current)return;setError('');replacement.current={id:mediaId,attached:false,busy:false,attempts:0};window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:true}}));};
 useEffect(()=>{
  let retry:ReturnType<typeof setTimeout>|undefined,live=true;
  const finish=async()=>{
   const pending=replacement.current;if(!pending?.attached||pending.busy)return;pending.busy=true;clearTimeout(retry);
   try{
    // Attaching a photo first sets processing; removal becomes legal at ready.
    const response=await fetch(`/api/posts/${postId}/media?media_id=${pending.id}`,{method:'DELETE'});
    if(response.status===404&&pending.attempts++<120){retry=setTimeout(()=>{void finish();},2000);return;}
    if(!response.ok)throw Error('The new photo was added, but the previous photo could not be removed. Try removing it again.');
    replacement.current=null;if(live)setRemoved(old=>[...old,pending.id]);window.dispatchEvent(new CustomEvent('media-removed',{detail:{id:postId,mediaId:pending.id}}));router.refresh();
   }catch(cause){replacement.current=null;if(live)setError(cause instanceof Error?cause.message:'The previous photo could not be removed.');}
   finally{pending.busy=false;if(!live&&!replacement.current)detach();}
  };
  const created=(event:Event)=>{if((event as CustomEvent).detail?.id===postId&&replacement.current){replacement.current.attached=true;void finish();}};
  const ready=(event:Event)=>{if((event as CustomEvent).detail?.id===postId)void finish();};
  const closed=()=>{if(replacement.current&&!replacement.current.attached)replacement.current=null;};
  const detach=()=>{clearTimeout(retry);window.removeEventListener('post-created',created);window.removeEventListener('post-ready',ready);window.removeEventListener('entry-closed',closed);};
  window.addEventListener('post-created',created);window.addEventListener('post-ready',ready);window.addEventListener('entry-closed',closed);
  // Closing capture can navigate Search back to Feed. Complete an already
  // attached replacement across that client navigation, then release listeners.
  return()=>{live=false;if(!replacement.current?.attached)detach();};
 },[postId,router]);
 const shown=slides.filter(slide=>!slide.id||!removed.includes(slide.id));
 useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{id:string;mediaId:string}>).detail;if(detail.id===postId)setRemoved(old=>[...old,detail.mediaId]);};window.addEventListener('media-removed',receive);return()=>window.removeEventListener('media-removed',receive);},[postId]);
 const remove=(mediaId:string)=>{
  if(removing||unmarking)return;
  setRemoving(true);setError('');setRemoved(old=>[...old,mediaId]);
  const action=delayAction(6000,async keepalive=>{
   try{
    const response=await fetch(`/api/posts/${postId}/media?media_id=${mediaId}`,{method:'DELETE',keepalive});
    if(!response.ok)throw Error('The photo could not be removed. Try again.');
    window.dispatchEvent(new CustomEvent('media-removed',{detail:{id:postId,mediaId}}));router.refresh();
   }catch(cause){setRemoved(old=>old.filter(id=>id!==mediaId));setError(cause instanceof Error?cause.message:'The photo could not be removed.');}
   finally{setRemoving(false);}
  });
  setToast(previous=>({key:(previous?.key??0)+1,undo:()=>{action.undo();setRemoved(old=>old.filter(id=>id!==mediaId));setRemoving(false);setToast(null);}}));
 };
 const rail=useRef<HTMLDivElement>(null);
 const lastSlide=Math.max(0,shown.length+(canAddNotEaten?1:0)-1);
 const move=(step:number)=>{const element=rail.current;if(!element)return;const next=Math.max(0,Math.min(lastSlide,index+step));element.scrollTo({left:next*element.clientWidth,behavior:'smooth'});};
 return <div ref={menus} className="group relative">
  <div ref={rail} onKeyDown={event=>{if(!matchMedia("(min-width:1024px)").matches)return;if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();move(event.key==="ArrowRight"?1:-1);}}} className="flex snap-x snap-mandatory overflow-x-auto" onScroll={event=>{const element=event.currentTarget;const next=Math.round(element.scrollLeft/element.clientWidth);setIndex(next);onIndexChange?.(Math.min(next,shown.length-1));}} aria-label="Meal photos" tabIndex={0}>
   {shown.map((slide,i)=><div key={slide.id??`${postId}-${slide.kind??"photo"}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
    {slide.kind!=='card'?<DoubleTap postId={postId} href={href} modelCommentId={modelCommentId} fingerprint={fingerprint}>
      <MealPhoto url={slide.url} priority={priority&&i===0} alt={caption||`Meal photo ${i+1}`} />
     </DoubleTap>:href?<Link href={href} aria-label="Open meal details" className="block size-full">{nutrition}</Link>:nutrition}
    {slide.not_eaten&&!unmarked.includes(slide.id??'')&&slide.id&&<details data-removal-menu className="absolute right-3 top-3 z-20"><summary aria-label="Leftovers photo menu" className="flex size-7 cursor-pointer list-none items-center justify-center rounded-circle bg-overlay text-surface">···</summary><div className="absolute right-0 w-[230px] rounded-card border border-hairline bg-surface p-[6px] text-[15px] text-text" style={{boxShadow:'var(--color-shadow-pill)'}}><button type="button" disabled={removing||unmarking} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');void remove(slide.id!);}} className="h-tap w-full border-b border-hairline px-[10px] text-left" style={{color:'oklch(0.52 0.17 25)'}}>Remove this photo</button><button type="button" disabled={removing||unmarking} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');unmark(slide.id!);}} className="h-tap w-full border-b border-hairline px-[10px] text-left">Unmark leftovers</button><button type="button" disabled={removing||unmarking} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');replace(slide.id!);}} className="h-tap w-full border-b border-hairline px-[10px] text-left">Replace photo</button><p className="px-[10px] py-2 text-meta text-muted">Removing it re-analyses the post with the other photos. The record becomes the whole meal as photographed: {whole}.</p><button type="button" onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');}} className="h-tap w-full px-[10px] text-left">Cancel</button></div></details>}
    {slide.not_eaten&&!unmarked.includes(slide.id??'')&&<span className="absolute bottom-3 left-3 rounded-field bg-text px-3 py-[6px] text-slide-label text-surface">Leftovers</span>}
   </div>)}
   {canAddNotEaten&&<button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:true}}))} className="flex aspect-square w-full shrink-0 snap-center flex-col items-center justify-center gap-3 bg-surface text-text" aria-label="Add a photo of the leftovers"><span className="flex size-16 items-center justify-center rounded-card border-[1.5px] border-dashed border-ring text-[28px]">+</span><span className="text-body">Add a photo</span><span className="text-detail text-muted">Leftovers</span></button>}
  </div>
  {lastSlide>0&&<><button type="button" aria-label="Previous slide" disabled={index===0} onClick={()=>move(-1)} className="absolute left-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-surface-94 text-xl text-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">‹</button><button type="button" aria-label="Next slide" disabled={index>=lastSlide} onClick={()=>move(1)} className="absolute right-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-surface-94 text-xl text-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">›</button></>}
  {toast&&<UndoToast key={toast.key} text="Leftovers photo removed" onUndo={toast.undo} ms={6000}/>}
  {unmarkToast>0&&<UndoToast key={`unmark-${unmarkToast}`} text="Leftovers unmarked" ms={6000} onUndo={undoUnmark}/>}
  {error&&<p role="alert" className="px-inset text-meta text-muted">{error}</p>}
  {shown.length>1&&index<shown.length&&<span className="absolute left-3 top-3 w-fit rounded-tile bg-overlay px-2 text-meta text-surface" aria-live="polite">{Math.min(index+1,shown.length)}/{shown.length}</span>}
 </div>;
}

function MealPhoto({url,priority,alt}:{url:string;priority:boolean;alt:string}) {
 const [read,setRead]=useState({path:imageIdentity(url),url,failed:false});
 const image=useRef<HTMLImageElement>(null);
 const [nearViewport,setNearViewport]=useState(false);
 const [failedSharp,setFailedSharp]=useState<string|null>(null);
 useEffect(()=>{
  if(priority||nearViewport||!image.current)return;
  return observeNearViewport(image.current,()=>setNearViewport(true));
 },[priority,nearViewport]);
 const active=retainedImageUrl(read,url);
 const sharp=failedSharp!==imageIdentity(active);
 // eslint-disable-next-line @next/next/no-img-element
 return <img ref={image} src={priority||nearViewport?active:undefined} srcSet={(priority||nearViewport)&&sharp?feedPhotoSrcSet(active):undefined} crossOrigin="anonymous" width={1080} height={1080} fetchPriority={priority?"high":undefined} loading={priority?"eager":"lazy"} decoding="async" alt={alt} className="h-full w-full object-cover"
  onError={()=>{if(sharp&&feedPhotoSrcSet(active)){setFailedSharp(imageIdentity(active));return;}setRead({path:imageIdentity(active),url:active,failed:true});}}
  onLoad={()=>{if(read.failed||read.url!==active||read.path!==imageIdentity(active))setRead({path:imageIdentity(active),url:active,failed:false});}}/>;
}
