'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
import {sendFeedback} from '@/lib/posts/feedback';
import {createTapController} from '@/lib/posts/tap';
import {Icon} from '@/components/ui/Icon';
// A double tap votes up; a single tap opens the meal (href) once it is clear no second tap follows.
export default function DoubleTap({postId,modelCommentId,fingerprint,href,children}:{postId:string;modelCommentId:string|null;fingerprint:string|null;href?:string;children:ReactNode}){
 const router=useRouter();const pending=useRef(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [shown,setShown]=useState(false);const [error,setError]=useState('');
 const vote=()=>{
  if(!modelCommentId||!fingerprint||pending.current)return;
  pending.current=true;setError('');
  void sendFeedback(postId,'up',modelCommentId,fingerprint).then(()=>{setShown(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setShown(false),600);}).catch(()=>setError('Feedback could not be saved.')).finally(()=>{pending.current=false;});
 };
 const latest=useRef({vote,open:(target:string)=>router.push(target)});
 const controller=useRef<ReturnType<typeof createTapController>|null>(null);
 useEffect(()=>{latest.current={vote,open:(target:string)=>router.push(target)};});
 useEffect(()=>{
  const created=createTapController({now:()=>performance.now(),open:(target)=>latest.current.open(target),vote:()=>latest.current.vote()});
  controller.current=created;
  return()=>{created.dispose();controller.current=null;if(timer.current)clearTimeout(timer.current);};
 },[]);
 return <div className="relative h-full w-full" onPointerDown={e=>{if(e.isPrimary&&e.button===0)controller.current?.down(e.clientX,e.clientY);}}
  onPointerCancel={()=>controller.current?.cancel()}
  onPointerUp={e=>controller.current?.up(e.clientX,e.clientY,{canVote:Boolean(modelCommentId&&fingerprint),href})}>
  {children}
  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 ${shown?'opacity-100':'opacity-0'}`}><Icon name="thumb" size={48}/></span>
  {error?<p role="alert" className="absolute inset-x-0 bottom-0 bg-overlay px-screen-x text-meta text-white">{error}</p>:null}
 </div>;
}
