'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {tokens} from '@/lib/theme/tokens';
import ThumbsFeedback from '@/components/ThumbsFeedback';
import {beginBookmark,finishBookmark} from '@/lib/posts/save-optimistic';
import type {FeedPost} from '@/lib/posts/feed';
import { Icon } from '@/components/ui/Icon';
export function postAction(name:string,postId:string) { window.dispatchEvent(new CustomEvent(name,{detail:{postId}})); }
export default function PostActions({postId,modelCommentId,fingerprint,drink=false,saved=false,slides=1,index=0,detail=false,post,status}:{post?:FeedPost;status?:string;postId:string;modelCommentId:string|null;fingerprint:string|null;drink?:boolean;saved?:boolean;slides?:number;index?:number;detail?:boolean}) {
  const ref=useRef<HTMLDivElement>(null),[width,setWidth]=useState<number>(tokens.spacing.phone);
  useEffect(()=>{const element=ref.current;if(!element)return;const measure=()=>setWidth(element.getBoundingClientRect().width);measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[]);
  const [bookmark,setBookmark]=useState({id:post?.saved_meal_id??(saved?'unknown':null) as string|null,pending:false});
  const bookmarkRef=useRef(bookmark);useEffect(()=>{bookmarkRef.current=bookmark;},[bookmark]);
  useEffect(()=>{const receive=(event:Event)=>{const d=(event as CustomEvent<{postId:string;savedMealId?:string|null;failed?:boolean}>).detail;if(d?.postId!==postId)return;const next=finishBookmark({id:d.savedMealId??null,pending:false},d.savedMealId??null,Boolean(d.failed));bookmarkRef.current=next;setBookmark(next);};const starting=(event:Event)=>{const d=(event as CustomEvent<{postId:string}>).detail;if(d?.postId!==postId||bookmarkRef.current.pending)return;const next=beginBookmark(bookmarkRef.current);bookmarkRef.current=next;setBookmark(next);};window.addEventListener('save-meal-result',receive);window.addEventListener('save-meal',starting);return()=>{window.removeEventListener('save-meal-result',receive);window.removeEventListener('save-meal',starting);};},[postId]);
  const visibleSaved=bookmark.pending?Boolean(bookmark.id):bookmark.id==='unknown'?saved:Boolean(bookmark.id);
  // The database accepts a saved meal only once its analysis is ready.
  const ready=visibleSaved||(post?.status??status)==='ready';
  const save=()=>{if(!ready||bookmarkRef.current.pending)return;const previous=bookmarkRef.current;const next=beginBookmark({...previous,id:visibleSaved?previous.id:null});bookmarkRef.current=next;setBookmark(next);window.dispatchEvent(new CustomEvent('save-meal',{detail:{postId,savedMealId:previous.id,previousSaved:visibleSaved}}));};
  const controlsRight=16+(drink?66:150)+(detail?0:78);
  const dotWidth=Math.min(11*slides-5,Math.max(0,width-controlsRight-56));
  const dotCenter=Math.max(controlsRight+8+dotWidth/2,Math.min(width/2,width-48-dotWidth/2));
  return <div ref={ref} className={`relative flex items-center gap-[18px] px-inset pt-[10px] ${detail?"pb-[6px]":"pb-1"}`}>
    {!drink && <ThumbsFeedback postId={postId} modelCommentId={modelCommentId} fingerprint={fingerprint} compact />}
    <Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct" className="-m-[10px] flex size-11 items-center justify-center"><Icon name="comment" /></Link>
    <button type="button" aria-label="Log again" className="-m-[10px] flex size-11 items-center justify-center" onClick={()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId,post}}))}><Icon name="log-again" /></button>
    {!detail&&<Link href={`/posts/${postId}`} className="-my-[10px] flex h-11 items-center text-detail text-muted">Details ›</Link>}
    {slides>1&&<div className="pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[5px] overflow-hidden" style={{left:dotCenter,width:dotWidth}} aria-hidden="true">{Array.from({length:slides},(_,i)=><span key={i} className={`size-[6px] shrink-0 rounded-circle ${i===index?'bg-text':'bg-ring'}`} />)}</div>}
    <button type="button" aria-label={visibleSaved?'Unsave meal':'Save meal'} aria-pressed={visibleSaved} disabled={!ready} className={`-my-[10px] -mr-[10px] ml-auto flex size-11 items-center justify-center ${ready?'text-text':'text-faint'}`} onClick={save}><Icon name="bookmark" active={visibleSaved} /></button>
  </div>;
}
