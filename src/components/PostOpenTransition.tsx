'use client';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {recallPost,clearRememberedPosts} from '@/lib/posts/open-frame';
import {createClient} from '@/lib/supabase/client';
import PostPageShell from '@/components/PostPageShell';
import PostOpenFrame from '@/components/PostOpenFrame';

export default function PostOpenTransition() {
 const path=usePathname();
 const router=useRouter();
 const [opening,setOpening]=useState<{id:string;from:string;committed:boolean}|null>(null);
 const [attempt,setAttempt]=useState(0);
 const [phase,setPhase]=useState<'opening'|'slow'|'error'>('opening');
 useEffect(()=>{
  let account:string|null|undefined;
  const {data:{subscription}}=createClient().auth.onAuthStateChange((_event,session)=>{const next=session?.user.id??null;if(account!==undefined&&account!==next){clearRememberedPosts();setOpening(null);}account=next;});
  const preview=(event:Event)=>{
   const id=(event as CustomEvent<{id:string}>).detail?.id;
   if(!id||matchMedia('(min-width:1024px)').matches)return;
   setPhase('opening');
   setOpening({id,from:window.location.pathname,committed:(event as CustomEvent<{committed?:boolean}>).detail?.committed===true});
  };
  const cancel=()=>setOpening(null);
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
   if(!anchor||anchor.target||anchor.hasAttribute('download'))return;
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin)return;
   const id=url.pathname.match(/^\/posts\/([0-9a-f-]{36})$/i)?.[1];
   if(id)preview(new CustomEvent('post-open-preview',{detail:{id,committed:true}}));
  };
  window.addEventListener('post-open-preview',preview);
  window.addEventListener('post-open-cancel',cancel);
  document.addEventListener('click',click,true);
  window.addEventListener('popstate',cancel);
  return()=>{subscription.unsubscribe();window.removeEventListener('post-open-preview',preview);window.removeEventListener('post-open-cancel',cancel);document.removeEventListener('click',click,true);window.removeEventListener('popstate',cancel);};
 },[]);
 useEffect(()=>{
  if(!opening)return;
  setPhase('opening');
  const completed=()=>{if(document.querySelector(`[data-post-detail-ready="${opening.id}"]`))setOpening(null);};
  const observer=new MutationObserver(completed);observer.observe(document.body,{childList:true,subtree:true});completed();
  const slow=setTimeout(()=>setPhase(current=>current==='opening'?'slow':current),2500);
  const fail=setTimeout(()=>setPhase('error'),10000);
  return()=>{observer.disconnect();clearTimeout(slow);clearTimeout(fail);};
 },[opening,attempt]);
 if(!opening||(path!==opening.from&&path!==`/posts/${opening.id}`))return null;
 const retry=()=>{setPhase('opening');setAttempt(n=>n+1);router.push(`/posts/${opening.id}`);};
 return <div className={`fixed inset-0 z-40 overflow-hidden bg-surface desktop:hidden ${opening.committed?'pointer-events-auto':'pointer-events-none'}`} aria-hidden={opening.committed?undefined:true} aria-busy={phase!=='error'}>
  {phase==='slow'&&<p role="status" className="absolute inset-x-inset top-[52px] z-50 px-inset text-center text-detail text-muted">Still opening… (slow connection)</p>}
  {phase==='error'?<div className="flex h-full flex-col items-center justify-center gap-4 px-inset text-center"><p className="text-body">Couldn&apos;t open this meal.</p><div className="flex gap-3"><button type="button" className="min-h-tap rounded-field bg-field px-4 text-detail font-medium" onClick={retry}>Try again</button><button type="button" className="min-h-tap rounded-field bg-field px-4 text-detail font-medium" onClick={()=>{setOpening(null);router.back();}}>Back</button></div></div>:
  /* eslint-disable-next-line @next/next/no-location-assign-relative-destination -- A full load abandons the pending post navigation; a router push would queue behind it. */
  <PostPageShell onBack={event=>{event.preventDefault();setOpening(null);window.location.assign('/');}}><div inert><PostOpenFrame id={opening.id}/></div></PostPageShell>}
 </div>;
}
