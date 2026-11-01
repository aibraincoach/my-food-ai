'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Icon} from '@/components/ui/Icon';
type Props={open:boolean;onClose:()=>void;children:ReactNode;label:string};
let locks=0;
let originalOverflow='';
const mountedSheets:HTMLDivElement[]=[];
/** A portal below the navigation pill, with focus retained in the sheet or pill. */
export function Sheet({open,onClose,children,label}:Props) {
  const panel=useRef<HTMLDivElement>(null);const close=useRef(onClose);const swipe=useRef<number|null>(null);const [mounted,setMounted]=useState(false);
  close.current=onClose;
  useEffect(()=>{setMounted(true);},[]);
  useEffect(()=>{
    if(!open||!mounted||!panel.current)return;
    const element=panel.current;const previous=document.activeElement as HTMLElement|null;
    mountedSheets.push(element);
    if(locks++===0){originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    const top=()=>mountedSheets.at(-1)===element;
    const focusables=()=>[...element.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]'),...document.querySelectorAll<HTMLElement>('nav[data-pill] a,nav[data-pill] button')].filter(node=>node.getClientRects().length>0);
    const focus=()=>{(element.querySelector<HTMLElement>('[autofocus]')??focusables()[0]??element).focus();};
    const frame=requestAnimationFrame(focus);
    const key=(event:KeyboardEvent)=>{
      if(!top())return;
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();}
      if(event.key==='Tab'){
        const nodes=focusables(),first=nodes[0],last=nodes.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    const contain=(event:FocusEvent)=>{if(top()&&!element.contains(event.target as Node)&&!(event.target as HTMLElement)?.closest('nav[data-pill]'))focus();};
    const dismiss=()=>close.current();
    window.addEventListener('keydown',key,true);window.addEventListener('close-sheets',dismiss);document.addEventListener('focusin',contain);
    return()=>{cancelAnimationFrame(frame);mountedSheets.splice(mountedSheets.indexOf(element),1);if(--locks===0)document.body.style.overflow=originalOverflow;window.removeEventListener('keydown',key,true);window.removeEventListener('close-sheets',dismiss);document.removeEventListener('focusin',contain);previous?.focus();};
  },[open,mounted]);
  if(!open||!mounted)return null;
  return createPortal(<div className="pointer-events-none fixed inset-0 z-40">
    <button type="button" tabIndex={-1} aria-label={`Close ${label}`} onClick={onClose} className="pointer-events-auto absolute inset-0 size-full bg-scrim-32"/>
    <div ref={panel} role="dialog" aria-label={label} tabIndex={-1} className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100%-env(safe-area-inset-top))] max-w-phone flex-col gap-sheet-gap overflow-y-auto rounded-t-sheet bg-surface px-screen-x pt-sheet-top pb-[calc(112px+env(safe-area-inset-bottom))]">
      <div className="flex h-[24px] shrink-0 items-start justify-center" onTouchStart={event=>{swipe.current=event.touches[0].clientY;}} onTouchEnd={event=>{if(swipe.current!==null&&event.changedTouches[0].clientY-swipe.current>50)onClose();swipe.current=null;}}>
        <div aria-hidden="true" className="h-handle-h w-handle-w rounded-circle bg-ring"/>
        <button type="button" aria-label={`Close ${label}`} className="absolute right-2 top-1 flex size-tap items-center justify-center text-muted" onClick={onClose}><Icon name="close" size={22}/></button>
      </div>
      {children}
    </div>
  </div>,document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')??document.body);
}
