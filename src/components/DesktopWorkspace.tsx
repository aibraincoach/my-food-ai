"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';

export default function DesktopWorkspace({children,detail,width=470}:{children:ReactNode;detail?:ReactNode;width?:number}) {
  const router=useRouter(), params=useSearchParams();
  const root=useRef<HTMLDivElement>(null);
  const selected=params.get('post');
  const [focused,setFocused]=useState<string|null>(selected);
  const open=(id:string|null)=>{const url=new URL(window.location.href);if(id)url.searchParams.set('post',id);else url.searchParams.delete('post');router.push(url.pathname+url.search,{scroll:false});};
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(!matchMedia('(min-width:1024px)').matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
      if(event.key==='Escape'&&selected){event.preventDefault();open(null);return;}
      const cards=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-desktop-post]')??[]);
      if(!cards.length)return;
      const index=cards.findIndex(card=>card.dataset.desktopPost===focused);
      const grid=Boolean(root.current?.querySelector('[data-profile-grid]'));
      const step=event.key==='j'?1:event.key==='k'?-1:grid&&event.key==='ArrowRight'?1:grid&&event.key==='ArrowLeft'?-1:grid&&event.key==='ArrowDown'?3:grid&&event.key==='ArrowUp'?-3:0;
      if(step){event.preventDefault();const next=cards[Math.max(0,Math.min(cards.length-1,index<0?0:index+step))];setFocused(next.dataset.desktopPost!);next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});if(selected)open(next.dataset.desktopPost!);}
      if(event.key==='Enter'&&focused&&!(event.target as HTMLElement)?.closest('button,a')){event.preventDefault();open(focused);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[focused,selected,router]);
  return <div className="desktop:flex desktop:justify-center desktop:gap-6 desktop:py-6" onClickCapture={event=>{
    if(!matchMedia('(min-width:1024px)').matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
    const target=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/posts/"]');
    const id=target?.getAttribute('href')?.match(/^\/posts\/([0-9a-f-]{36})(?:\?|$)/i)?.[1];
    if(id){event.preventDefault();event.stopPropagation();setFocused(id);open(id);}
  }}>
    <div ref={root} className="min-w-0 desktop:shrink-0" style={{'--workspace-width':`${width}px`, '--detail-space':selected?'464px':'0px'} as React.CSSProperties} data-desktop-workspace>
      <style>{`@media(min-width:1024px){[data-desktop-workspace]{width:min(var(--workspace-width),calc(100vw - 264px - var(--detail-space)))}[data-desktop-post="${focused??''}"]{outline:2px solid var(--color-text);outline-offset:2px}}`}</style>
      {children}
    </div>
    {selected&&<aside className="hidden desktop:sticky desktop:top-6 desktop:block desktop:max-h-[calc(100dvh-48px)] desktop:w-[440px] desktop:shrink-0 desktop:overflow-y-auto desktop:rounded-card desktop:border desktop:border-hairline" aria-label="Post detail"><div className="flex items-center justify-between px-inset py-3"><h2 className="text-body font-semibold">Post</h2><button onClick={()=>open(null)} className="rounded bg-field px-2 py-1 font-mono text-meta" aria-label="Close post detail">Esc</button></div>{detail??<p role="status" className="p-4 text-muted">Loading post…</p>}</aside>}
  </div>;
}
