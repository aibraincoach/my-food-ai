"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import DoubleTap from '@/components/DoubleTap';
import {imageIdentity,retainedImageUrl} from '@/lib/media/retained-image';
import {useRemovalMenus} from '@/components/useRemovalMenus';
export type Slide={id?:string;url:string;kind?:'photo'|'card';not_eaten?:boolean};
export default function Carousel({slides,caption,postId,href,modelCommentId,fingerprint,nutrition,onIndexChange,canAddNotEaten=false,priority=false}:{priority?:boolean;slides:Slide[];caption:string;postId:string;href?:string;modelCommentId:string|null;fingerprint:string|null;nutrition:ReactNode;onIndexChange?:(index:number)=>void;canAddNotEaten?:boolean}) {
 const menus=useRef<HTMLDivElement>(null);useRemovalMenus(menus);
 const [index,setIndex]=useState(0);const [removed,setRemoved]=useState<string[]>([]),[removing,setRemoving]=useState(false),[error,setError]=useState('');const router=useRouter();
 const shown=slides.filter(slide=>!slide.id||!removed.includes(slide.id));
 useEffect(()=>{const receive=(event:Event)=>{const detail=(event as CustomEvent<{id:string;mediaId:string}>).detail;if(detail.id===postId)setRemoved(old=>[...old,detail.mediaId]);};window.addEventListener('media-removed',receive);return()=>window.removeEventListener('media-removed',receive);},[postId]);
 const remove=async(mediaId:string)=>{if(removing)return;setRemoving(true);setError('');try{const response=await fetch(`/api/posts/${postId}/media?media_id=${mediaId}`,{method:'DELETE'});if(!response.ok)throw Error('The photo could not be removed. Try again.');setRemoved(old=>[...old,mediaId]);window.dispatchEvent(new CustomEvent('media-removed',{detail:{id:postId,mediaId}}));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'The photo could not be removed.');}finally{setRemoving(false);}};
 const rail=useRef<HTMLDivElement>(null);
 const lastSlide=Math.max(0,shown.length+(canAddNotEaten?1:0)-1);
 const move=(step:number)=>{const element=rail.current;if(!element)return;const next=Math.max(0,Math.min(lastSlide,index+step));element.scrollTo({left:next*element.clientWidth,behavior:'smooth'});};
 return <div ref={menus} className="group relative">
  <div ref={rail} onKeyDown={event=>{if(!matchMedia("(min-width:1024px)").matches)return;if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();move(event.key==="ArrowRight"?1:-1);}}} className="flex snap-x snap-mandatory overflow-x-auto" onScroll={event=>{const element=event.currentTarget;const next=Math.round(element.scrollLeft/element.clientWidth);setIndex(next);onIndexChange?.(Math.min(next,shown.length-1));}} aria-label="Meal photos" tabIndex={0}>
   {shown.map((slide,i)=><div key={slide.id??`${postId}-${slide.kind??"photo"}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
    {slide.kind!=='card'?<DoubleTap postId={postId} href={href} modelCommentId={modelCommentId} fingerprint={fingerprint}>
      <MealPhoto url={slide.url} priority={priority&&i===0} alt={caption||`Meal photo ${i+1}`} />
     </DoubleTap>:href?<Link href={href} aria-label="Open meal details" className="block size-full">{nutrition}</Link>:nutrition}
    {slide.not_eaten&&slide.id&&<details data-removal-menu className="absolute right-3 top-3 z-20"><summary aria-label="Leftovers photo menu" className="flex size-7 cursor-pointer list-none items-center justify-center rounded-circle bg-overlay text-surface">···</summary><div className="absolute right-0 w-[230px] rounded-card border border-hairline bg-surface p-[6px] text-[15px] text-text" style={{boxShadow:'var(--color-shadow-pill)'}}><button type="button" disabled={removing} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');void remove(slide.id!);}} className="h-tap w-full border-b border-hairline px-[10px] text-left text-muted">Remove this photo</button><button type="button" onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');}} className="h-tap w-full px-[10px] text-left">Cancel</button></div></details>}
    {slide.not_eaten&&<span className="absolute bottom-3 left-3 rounded-field bg-text px-3 py-[6px] text-slide-label text-surface">leftovers (not eaten)</span>}
   </div>)}
   {canAddNotEaten&&<button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:true}}))} className="flex aspect-square w-full shrink-0 snap-center flex-col items-center justify-center gap-3 bg-surface text-text" aria-label="Add a photo of leftovers (not eaten)"><span className="flex size-16 items-center justify-center rounded-card border-[1.5px] border-dashed border-ring text-[28px]">+</span><span className="text-body">Add a photo</span><span className="text-detail text-muted">leftovers (not eaten)</span></button>}
  </div>
  {lastSlide>0&&<><button type="button" aria-label="Previous slide" disabled={index===0} onClick={()=>move(-1)} className="absolute left-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-surface-94 text-xl text-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">‹</button><button type="button" aria-label="Next slide" disabled={index>=lastSlide} onClick={()=>move(1)} className="absolute right-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-surface-94 text-xl text-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">›</button></>}
  {error&&<p role="alert" className="px-inset text-meta text-muted">{error}</p>}
  {shown.length>1&&index<shown.length&&<span className="absolute left-3 top-3 w-fit rounded-tile bg-overlay px-2 text-meta text-surface" aria-live="polite">{Math.min(index+1,shown.length)}/{shown.length}</span>}
 </div>;
}

function MealPhoto({url,priority,alt}:{url:string;priority:boolean;alt:string}) {
 const [read,setRead]=useState({path:imageIdentity(url),url,failed:false});
 const active=retainedImageUrl(read,url);
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={active} crossOrigin="anonymous" width={1080} height={1080} fetchPriority={priority?"high":undefined} loading={priority?"eager":"lazy"} decoding="async" alt={alt} className="h-full w-full object-cover"
  onError={()=>setRead({path:imageIdentity(active),url:active,failed:true})}
  onLoad={()=>{if(read.failed||read.url!==active||read.path!==imageIdentity(active))setRead({path:imageIdentity(active),url:active,failed:false});}}/>;
}
