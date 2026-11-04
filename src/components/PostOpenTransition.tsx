'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {recallPost,clearRememberedPosts} from '@/lib/posts/open-frame';
import {createClient} from '@/lib/supabase/client';
import PostPageShell from '@/components/PostPageShell';
import PostOpenFrame from '@/components/PostOpenFrame';

// The router's loading boundary may itself wait for a server response. Paint
// the remembered post immediately, retaining the feed underneath so a second
// photo tap can still cancel the provisional open and cast its vote.
export default function PostOpenTransition() {
 const path=usePathname();
 const [opening,setOpening]=useState<{id:string;from:string}|null>(null);
 useEffect(()=>{
  let account:string|null|undefined;
  const {data:{subscription}}=createClient().auth.onAuthStateChange((_event,session)=>{const next=session?.user.id??null;if(account!==undefined&&account!==next){clearRememberedPosts();setOpening(null);}account=next;});
  const preview=(event:Event)=>{
   const id=(event as CustomEvent<{id:string}>).detail?.id;
   if(!id||matchMedia('(min-width:1024px)').matches||!recallPost(id))return;
   setOpening({id,from:window.location.pathname});
  };
  const cancel=()=>setOpening(null);
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=(event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
   if(!anchor||anchor.target||anchor.hasAttribute('download'))return;
   const url=new URL(anchor.href,window.location.href);
   if(url.origin!==window.location.origin)return;
   const id=url.pathname.match(/^\/posts\/([0-9a-f-]{36})$/i)?.[1];
   if(id)preview(new CustomEvent('post-open-preview',{detail:{id}}));
  };
  window.addEventListener('post-open-preview',preview);
  window.addEventListener('post-open-cancel',cancel);
  document.addEventListener('click',click,true);
  window.addEventListener('popstate',cancel);
  return()=>{subscription.unsubscribe();window.removeEventListener('post-open-preview',preview);window.removeEventListener('post-open-cancel',cancel);document.removeEventListener('click',click,true);window.removeEventListener('popstate',cancel);};
 },[]);
 useEffect(()=>{
  if(!opening)return;
  const completed=()=>{if(document.querySelector(`[data-post-detail-ready="${opening.id}"]`))setOpening(null);};
  const observer=new MutationObserver(completed);observer.observe(document.body,{childList:true,subtree:true});completed();
  // A failed or redirected navigation must not leave an unresponsive cover.
  const timeout=setTimeout(()=>setOpening(null),15000);
  return()=>{observer.disconnect();clearTimeout(timeout);};
 },[opening]);
 if(!opening||(path!==opening.from&&path!==`/posts/${opening.id}`))return null;
 return <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-surface desktop:hidden" aria-hidden="true" inert><PostPageShell><PostOpenFrame id={opening.id}/></PostPageShell></div>;
}
