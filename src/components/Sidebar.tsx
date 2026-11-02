"use client";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useEffect} from "react";
import {Icon, type IconName} from "@/components/ui/Icon";

export default function Sidebar() {
  const path=usePathname(), router=useRouter();
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(!matchMedia('(min-width: 1024px)').matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
      if(event.key.toLowerCase()==='n'){event.preventDefault();window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',desktop:true}}));}
      if(event.key==='/'){
        event.preventDefault();
        const input=document.querySelector<HTMLInputElement>('input[aria-label="Search meals"]');
        if(input)input.focus();else router.push('/search?focus=1');
      }
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[router]);
  const entries:{label:string;href:string;icon:IconName}[]=[{label:'Home',href:'/',icon:'home'},{label:'Search',href:'/search',icon:'search'},{label:'New post',href:'#new',icon:'plus'},{label:'Days',href:'/days',icon:'days'},{label:'Profile',href:'/profile',icon:'profile'}];
  return <aside className="hidden desktop:fixed desktop:inset-y-0 desktop:left-0 desktop:z-30 desktop:flex desktop:w-[232px] desktop:flex-col desktop:border-r desktop:border-hairline desktop:bg-surface desktop:p-5">
    <Link href="/" className="mb-8 text-[22px] font-semibold">My Food AI</Link>
    <nav aria-label="Main navigation" className="flex flex-col gap-1">{entries.map(entry=>entry.href==='#new'?<button key={entry.label} className="flex h-11 items-center gap-3 rounded-field px-3 text-body" onClick={()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',desktop:true}}))}><Icon name={entry.icon}/>{entry.label}</button>:<Link key={entry.label} href={entry.href} aria-current={(entry.href==='/'?path==='/':path.startsWith(entry.href))?'page':undefined} className={`flex h-11 items-center gap-3 rounded-field px-3 text-body ${(entry.href==='/'?path==='/':path.startsWith(entry.href))?'bg-hairline':''}`}><Icon name={entry.icon}/>{entry.label}</Link>)}</nav>
    <p className="mb-3 mt-9 text-[11px] tracking-widest text-muted">KEYS</p>
    <dl className="space-y-3">{[['J / K','next and previous post'],['Enter','open'],['Esc','close'],['N','new post'],['/','search'],['← →','slides']].map(([key,label])=><div key={key} className="flex items-start gap-2 text-[13px] text-muted"><dt className="rounded bg-field px-1 font-mono text-[12px] leading-5">{key}</dt><dd className="min-w-0 flex-1">{label}</dd></div>)}</dl>
    <div id="desktop-upload-slot" className="mt-auto"/>
  </aside>;
}
