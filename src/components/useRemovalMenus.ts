'use client';
import {useEffect,type RefObject} from 'react';

/** Keep the small Remove/Cancel menus dismissible without adding another sheet. */
export function useRemovalMenus(root:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const opened=()=>root.current?.querySelectorAll<HTMLDetailsElement>('details[data-removal-menu][open]')??[];
  const outside=(event:PointerEvent)=>{for(const menu of opened())if(!menu.contains(event.target as Node))menu.open=false;};
  const escape=(event:KeyboardEvent)=>{
   if(event.key!=='Escape')return;
   for(const menu of opened()){
    const focused=menu.contains(document.activeElement);
    menu.open=false;
    if(focused){event.preventDefault();event.stopImmediatePropagation();menu.querySelector('summary')?.focus();}
   }
  };
  window.addEventListener('pointerdown',outside);window.addEventListener('keydown',escape,true);
  return()=>{window.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape,true);};
 },[root]);
}
