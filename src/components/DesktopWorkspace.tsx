"use client";
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {useDesktop} from '@/lib/ui/use-desktop';
import {lockBodyScroll} from '@/lib/ui/scroll-lock';
import PostOpenFrame from '@/components/PostOpenFrame';
import {recallPost} from '@/lib/posts/open-frame';
import {useRouter,useSearchParams} from 'next/navigation';

export default function DesktopWorkspace({children,detail,width=500}:{children:ReactNode;detail?:ReactNode;width?:number}) {
  const desktop=useDesktop();
  const dialog=useRef<HTMLDialogElement>(null);
  const backdropStart=useRef(false);
  const router=useRouter(), params=useSearchParams();
  const root=useRef<HTMLDivElement>(null);
  const selected=params.get('post');
  const [focused,setFocused]=useState<string|null>(selected);
  // Pending selection paints before the server navigation completes.
  const [pending,setPending]=useState<{id:string|null;from:string|null;preview?:boolean}|null>(null);
  // Retire completed navigation state; history returning to its old source
  // must never reactivate an already-completed open or close.
  if(pending&&selected!==pending.from)setPending(null);
  const transitioning=pending!==null&&selected===pending.from;
  const shown=transitioning?pending.id:selected;
  const open=useCallback((id:string|null)=>{if(id===selected){setPending(null);return;}setPending({id,from:selected});if(!id)dialog.current?.close();const url=new URL(window.location.href);if(id)url.searchParams.set('post',id);else url.searchParams.delete('post');router.push(url.pathname+url.search,{scroll:false});},[router,selected]);
  useEffect(()=>{if(!shown||!desktop)return;const element=dialog.current;if(transitioning&&pending?.preview){element?.show();return()=>element?.close();}element?.showModal();const release=lockBodyScroll();return()=>{element?.close();release();};},[shown,desktop,transitioning,pending?.preview]);
  useEffect(()=>{const cancel=()=>setPending(null);window.addEventListener('popstate',cancel);return()=>window.removeEventListener('popstate',cancel);},[]);
  useEffect(()=>{const preview=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;if(desktop&&id&&recallPost(id))setPending({id,from:selected,preview:true});};const cancel=()=>setPending(current=>current?.preview?null:current);window.addEventListener('post-open-preview',preview);window.addEventListener('post-open-cancel',cancel);return()=>{window.removeEventListener('post-open-preview',preview);window.removeEventListener('post-open-cancel',cancel);};},[desktop,selected]);
  useEffect(()=>{const handler=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;if(id){setFocused(id);open(id);}};window.addEventListener('open-post',handler);return()=>window.removeEventListener('open-post',handler);},[open]);
  useEffect(()=>{if(!shown)return;const capture=()=>open(null);window.addEventListener('open-entry',capture);return()=>window.removeEventListener('open-entry',capture);},[shown,open]);
  useEffect(()=>{
    const removed=(event:Event)=>{
      const detail=(event as CustomEvent<{id?:string;reason?:string}>).detail;
      if(!selected||detail?.id!==selected||(event.type==='post-unavailable'&&detail.reason!=='deleted'))return;
      const url=new URL(window.location.href);url.searchParams.delete('post');
      // Clear the canonical URL before the delete action refreshes this page.
      // Otherwise the server would try to render the deleted selected post.
      window.history.replaceState(null,'',url.pathname+url.search+url.hash);
      setFocused(null);
    };
    window.addEventListener('post-deleted',removed);window.addEventListener('post-unavailable',removed);
    return()=>{window.removeEventListener('post-deleted',removed);window.removeEventListener('post-unavailable',removed);};
  },[selected]);
  useEffect(()=>{
    const element=root.current;if(!element)return;
    const mark=()=>{const first=element.querySelector<HTMLElement>('[data-desktop-post]');for(const card of element.querySelectorAll<HTMLElement>('[data-desktop-post]')){if(card.dataset.desktopPost===(focused??first?.dataset.desktopPost))card.dataset.focused='true';else delete card.dataset.focused;}};
    mark();const observer=new MutationObserver(mark);observer.observe(element,{childList:true,subtree:true});return()=>observer.disconnect();
  },[focused]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(!matchMedia('(min-width:1024px)').matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
      if(event.key==='Escape'&&selected){event.preventDefault();open(null);return;}
      const cards=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-desktop-post]')??[]);
      if(!cards.length)return;
      const index=cards.findIndex(card=>card.dataset.desktopPost===focused);
      const grid=Boolean(root.current?.querySelector('[data-profile-grid]'));
      const step=event.key==='j'?1:event.key==='k'?-1:grid&&event.key==='ArrowRight'?1:grid&&event.key==='ArrowLeft'?-1:grid&&event.key==='ArrowDown'?3:grid&&event.key==='ArrowUp'?-3:0;
      if(step){event.preventDefault();const next=cards[Math.max(0,Math.min(cards.length-1,(index<0?0:index)+step))];setFocused(next.dataset.desktopPost!);next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});if(selected)open(next.dataset.desktopPost!);}
      if(event.key==='Enter'&&!(event.target as HTMLElement)?.closest('button,a')){event.preventDefault();const id=focused??cards[0]?.dataset.desktopPost;if(id)open(id);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[focused,selected,open]);
  return <div onFocusCapture={event=>{if(!desktop)return;const card=(event.target as HTMLElement).closest<HTMLElement>('[data-desktop-post]');if(card?.dataset.desktopPost)setFocused(card.dataset.desktopPost);}} className="desktop:flex desktop:justify-center desktop:gap-6 desktop:py-6" onClickCapture={event=>{
    if(!matchMedia('(min-width:1024px)').matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
    const target=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/posts/"]');
    const id=target?.getAttribute('href')?.match(/^\/posts\/([0-9a-f-]{36})(?:\?|$)/i)?.[1];
    if(id&&selected===id&&target?.getAttribute('aria-label')==='Comment or correct'){event.preventDefault();event.stopPropagation();dialog.current?.querySelector<HTMLInputElement>('input[aria-label="Comment or correct"]')?.focus();return;}
    if(id){event.preventDefault();event.stopPropagation();setFocused(id);open(id);}
  }}>
    <div ref={root} className="min-w-0 desktop:shrink-0" style={{'--workspace-width':`${width}px`, '--detail-space':'0px'} as React.CSSProperties} data-desktop-workspace>
      {children}
    </div>
    {shown&&desktop&&<dialog ref={dialog} role="dialog" aria-modal="true" aria-label="Post detail" style={transitioning&&pending?.preview?{pointerEvents:'none'}:undefined} className="desktop-post-dialog fixed inset-0 m-auto overflow-visible rounded-[10px] bg-white p-0 text-text shadow-2xl backdrop:bg-scrim-32" onCancel={event=>{event.preventDefault();open(null);}} onPointerDown={event=>{const rect=event.currentTarget.getBoundingClientRect();backdropStart.current=event.target===event.currentTarget&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom);}} onPointerCancel={()=>{backdropStart.current=false;}} onClick={event=>{if(backdropStart.current&&event.target===event.currentTarget){backdropStart.current=false;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)open(null);}}} onKeyDown={event=>{
      if(event.defaultPrevented||(event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')||(event.target as HTMLElement).closest('[role="dialog"]')!==event.currentTarget)return;
      const step=event.key.toLowerCase()==='j'?1:event.key.toLowerCase()==='k'?-1:0;
      if(step){event.preventDefault();const cards=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-desktop-post]')??[]);const index=cards.findIndex(card=>card.dataset.desktopPost===shown);const next=cards[index+step];if(next){setFocused(next.dataset.desktopPost!);open(next.dataset.desktopPost!);}}
    }}>
      <button onClick={()=>open(null)} aria-label="Close post detail" className="absolute -right-10 -top-7 flex size-8 items-center justify-center text-[28px] text-white">×</button>
      {[-1,1].map(step=><button key={step} aria-label={step<0?'Previous post':'Next post'} className={`absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-circle bg-white text-[26px] ${step<0?'-left-12':'-right-12'}`} onClick={()=>{const cards=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-desktop-post]')??[]);const index=cards.findIndex(card=>card.dataset.desktopPost===shown);const next=cards[index+step];if(next){setFocused(next.dataset.desktopPost!);open(next.dataset.desktopPost!);}}}>{step<0?'‹':'›'}</button>)}
      {transitioning||!detail?<PostOpenFrame id={shown} desktopModal/>:detail}
    </dialog>}
  </div>;
}
