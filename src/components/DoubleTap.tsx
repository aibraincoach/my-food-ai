'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {sendFeedback} from '@/lib/posts/feedback';
import {createTapController} from '@/lib/posts/tap';
import {Icon} from '@/components/ui/Icon';
import {openPost} from '@/lib/posts/open-post';
const openTarget=(router:ReturnType<typeof useRouter>,target:string)=>{const id=target.match(/^\/posts\/([0-9a-f-]{36})/i)?.[1];if(id){openPost(id,target,router);return;}router.push(target);};
// A double tap votes up; a single tap opens the meal (href) once it is clear no second tap follows.
export default function DoubleTap({postId,modelCommentId,fingerprint,href,children}:{postId:string;modelCommentId:string|null;fingerprint:string|null;href?:string;children:ReactNode}){
 const router=useRouter();const pending=useRef(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [shown,setShown]=useState(false);
 const vote=()=>{
  if(!modelCommentId||!fingerprint||pending.current)return;
  pending.current=true;
  void sendFeedback(postId,'up',modelCommentId,fingerprint).then(()=>{setShown(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setShown(false),600);}).catch(()=>window.dispatchEvent(new CustomEvent('feedback-error',{detail:{postId}}))).finally(()=>{pending.current=false;});
 };
 const latest=useRef({vote,open:(target:string)=>openTarget(router,target)});
 const controller=useRef<ReturnType<typeof createTapController>|null>(null);
 useEffect(()=>{latest.current={vote,open:(target:string)=>openTarget(router,target)};});
 useEffect(()=>{
  const created=createTapController({preview:target=>{const id=target.match(/^\/posts\/([0-9a-f-]{36})/i)?.[1];if(id)window.dispatchEvent(new CustomEvent('post-open-preview',{detail:{id}}));},cancelPreview:()=>window.dispatchEvent(new Event('post-open-cancel')),now:()=>performance.now(),open:(target)=>latest.current.open(target),vote:()=>latest.current.vote()});
  controller.current=created;
  return()=>{created.dispose();controller.current=null;if(timer.current)clearTimeout(timer.current);};
 },[]);
 return <div data-tap-control={href || modelCommentId && fingerprint ? "" : undefined} className="relative h-full w-full" onPointerDown={e=>{if(e.isPrimary&&e.button===0)controller.current?.down(e.clientX,e.clientY);}}
  onPointerCancel={()=>controller.current?.cancel()}
  onPointerUp={e=>controller.current?.up(e.clientX,e.clientY,{canVote:Boolean(modelCommentId&&fingerprint),href})}>
  {children}
  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 ${shown?'opacity-100':'opacity-0'}`}><Icon name="thumb" size={48}/></span>
 </div>;
}
