"use client";
import {useTranslations} from 'next-intl';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import Avatar from "@/components/Avatar";
import { useProfileIdentity } from "@/components/PostHandle";
import { Tooltip } from "@/components/ui/Tooltip";
export function dismissSheets() { window.dispatchEvent(new Event('close-sheets')); }
export default function BottomBar({ onPlus, menuOpen = false }: { onPlus: () => void; menuOpen?: boolean }) {
 const t=useTranslations('navigation');
 const SLOTS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: t('home'), icon: "home" }, { href: "/search", label: t('search'), icon: "search" },
  { href: "/days", label: t('days'), icon: "days" }, { href: "/profile", label: t('profile'), icon: "profile" },
];

  const pathname = usePathname();
  const [feedEmpty,setFeedEmpty]=useState(false);
  const identity=useProfileIdentity();
  useEffect(()=>{
    const state=(event:Event)=>{const empty=(event as CustomEvent).detail?.empty;if(typeof empty==='boolean')setFeedEmpty(empty);};
    window.addEventListener('feed-state',state);window.dispatchEvent(new Event('feed-state-request'));
    return()=>window.removeEventListener('feed-state',state);
  },[]);
  const link=(slot:typeof SLOTS[number])=>{
    const active=slot.href==='/'?pathname==='/':pathname.startsWith(slot.href);
    return <Link key={slot.href} href={slot.href} onClick={()=>{dismissSheets();if(slot.href==='/'&&pathname==='/'){window.dispatchEvent(new Event('home-reset'));window.scrollTo({top:0,behavior:'smooth'});}}} aria-label={slot.label} aria-current={active?'page':undefined} className={`flex h-[46px] min-w-0 items-center justify-center rounded-[23px] text-text active:opacity-50 ${active?'bg-hairline':''}`}>
      {slot.href==='/profile'?identity.handle?<Avatar handle={identity.handle} userId={identity.userId} mediaId={identity.avatarMediaId} sizePx={26} textClassName="text-avatar-sm"/>:<Icon name="profile" size={18}/>:<Icon name={slot.icon} active={active} size={24}/>}
    </Link>;
  };
  return <nav aria-label={t('primary')} aria-hidden={menuOpen||undefined} inert={menuOpen} data-pill className="fixed left-1/2 z-50 [[data-mfa-sheet-open]_&]:z-[70] grid h-[58px] w-[calc(100%-48px)] max-w-[342px] -translate-x-1/2 grid-cols-5 items-center rounded-[29px] bg-surface-94 px-[6px]" style={{opacity:menuOpen?0:1,pointerEvents:menuOpen?'none':undefined,transition:'opacity 160ms',bottom:'calc(24px + env(safe-area-inset-bottom))'}}>
    {link(SLOTS[0])}{link(SLOTS[1])}
    <div className="relative flex h-[46px] items-center justify-center">
      {pathname==='/'&&feedEmpty&&<div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap pb-4"><Tooltip>{t('photoHint')}</Tooltip></div>}
      <button type="button" id="post-menu-toggle" aria-label={menuOpen?t('closeMenu'):t('postMeal')} aria-expanded={menuOpen} aria-controls="post-menu" onClick={()=>{if(!menuOpen)dismissSheets();onPlus();}} className="flex size-11 items-center justify-center text-text active:opacity-50"><span className="flex size-[34px] items-center justify-center rounded-circle border-[1.5px] border-text"><Icon name="plus" size={20} style={{transform:`rotate(${menuOpen?45:0}deg)`,transition:'transform 160ms'}} /></span></button>
    </div>
    {link(SLOTS[2])}{link(SLOTS[3])}
  </nav>;
}
