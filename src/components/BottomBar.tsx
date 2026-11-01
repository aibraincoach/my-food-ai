"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
const SLOTS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" }, { href: "/search", label: "Search", icon: "search" },
  { href: "/days", label: "Days", icon: "days" }, { href: "/profile", label: "Profile", icon: "profile" },
];
export function dismissSheets() { window.dispatchEvent(new Event('close-sheets')); }
export default function BottomBar({ onPlus, menuOpen = false }: { onPlus: () => void; menuOpen?: boolean }) {
  const pathname = usePathname();
  const [feedEmpty,setFeedEmpty]=useState(false);
  const [initial,setInitial]=useState('');
  useEffect(()=>{
    let live=true;const client=createClient();
    void client.auth.getUser().then(async({data:{user}})=>{
      if(!user)return;const {data}=await client.from('profiles').select('handle').eq('id',user.id).maybeSingle();
      if(live)setInitial(String(data?.handle??'').slice(0,1).toUpperCase());
    });
    const state=(event:Event)=>{const empty=(event as CustomEvent).detail?.empty;if(typeof empty==='boolean')setFeedEmpty(empty);};
    window.addEventListener('feed-state',state);window.dispatchEvent(new Event('feed-state-request'));
    return()=>{live=false;window.removeEventListener('feed-state',state);};
  },[]);
  const link=(slot:typeof SLOTS[number])=>{
    const active=slot.href==='/'?pathname==='/':pathname.startsWith(slot.href);
    return <Link key={slot.href} href={slot.href} onClick={dismissSheets} aria-label={slot.label} aria-current={active?'page':undefined} className={`flex h-[46px] min-w-0 items-center justify-center rounded-[23px] text-text active:opacity-50 ${active?'bg-hairline':''}`}>
      {slot.href==='/profile'?<span className="flex size-[26px] items-center justify-center rounded-circle bg-text text-avatar-sm text-surface">{initial||<Icon name="profile" size={18}/>}</span>:<Icon name={slot.icon} active={active} size={24}/>}
    </Link>;
  };
  return <nav aria-label="Primary" data-pill className="fixed left-1/2 z-50 grid h-[58px] w-[calc(100%-48px)] max-w-[342px] -translate-x-1/2 grid-cols-5 items-center rounded-[29px] bg-surface-94 px-[6px]" style={{bottom:'calc(24px + env(safe-area-inset-bottom))',boxShadow:'var(--color-shadow-pill)',backdropFilter:'blur(var(--spacing-blur-pill))'}}>
    {link(SLOTS[0])}{link(SLOTS[1])}
    <div className="relative flex h-[46px] items-center justify-center">
      {pathname==='/'&&feedEmpty&&<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap pb-4"><Tooltip>Photograph a meal</Tooltip></div>}
      <button type="button" id="post-menu-toggle" aria-label={menuOpen?'Close post menu':'Post a meal'} aria-expanded={menuOpen} aria-controls="post-menu" onClick={()=>{if(!menuOpen)dismissSheets();onPlus();}} className="flex size-[34px] items-center justify-center rounded-circle border-[1.5px] border-text text-text active:opacity-50"><Icon name="plus" size={20} style={{transform:`rotate(${menuOpen?45:0}deg)`,transition:'transform 160ms'}} /></button>
    </div>
    {link(SLOTS[2])}{link(SLOTS[3])}
  </nav>;
}
