'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {sendFeedback} from '@/lib/posts/feedback';
import {Icon} from '@/components/ui/Icon';
export default function DoubleTap({postId,modelCommentId,children}:{postId:string;modelCommentId:string|null;children:ReactNode}){
 const previous=useRef<{time:number;x:number;y:number}|null>(null);const start=useRef<{x:number;y:number}|null>(null);const pending=useRef(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [shown,setShown]=useState(false);const [error,setError]=useState('');
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 return <div className="relative h-full w-full" onPointerDown={e=>{if(e.isPrimary&&e.button===0)start.current={x:e.clientX,y:e.clientY};}}
  onPointerCancel={()=>{start.current=null;previous.current=null;}}
  onPointerUp={e=>{const from=start.current;start.current=null;if(!from||Math.hypot(e.clientX-from.x,e.clientY-from.y)>8){previous.current=null;return;}
   const now=performance.now();const last=previous.current;previous.current={time:now,x:e.clientX,y:e.clientY};
   if(!modelCommentId||!last||now-last.time>300||Math.hypot(e.clientX-last.x,e.clientY-last.y)>24||pending.current)return;
   previous.current=null;pending.current=true;setError('');
   void sendFeedback(postId,'up',modelCommentId).then(()=>{setShown(true);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setShown(false),600);}).catch(()=>setError('Feedback could not be saved.')).finally(()=>{pending.current=false;});
  }}>
  {children}
  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 ${shown?'opacity-100':'opacity-0'}`}><Icon name="thumb" size={48}/></span>
  {error?<p role="alert" className="absolute inset-x-0 bottom-0 bg-overlay px-screen-x text-meta text-white">{error}</p>:null}
 </div>;
}
