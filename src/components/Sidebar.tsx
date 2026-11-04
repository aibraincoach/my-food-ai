'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import SavedMealsButton from '@/components/SavedMealsButton';
import ShortcutsDialog from '@/components/ShortcutsDialog';
import {useDesktop} from '@/lib/ui/use-desktop';
import {useProfileIdentity} from '@/components/PostHandle';
import Avatar from '@/components/Avatar';
import {Icon,type IconName} from '@/components/ui/Icon';
export default function Sidebar(){
 const path=usePathname(),router=useRouter(),desktop=useDesktop();
 const [shortcuts,setShortcuts]=useState(false);
 const newPost=()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',desktop:true}}));
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(!matchMedia('(min-width:1024px)').matches||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||(event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],dialog')||document.querySelector('dialog[open],[role="dialog"]:not(dialog)'))return;
   if(event.key.toLowerCase()==='n'){event.preventDefault();newPost();}
   if(event.key.toLowerCase()==='d'){event.preventDefault();router.push('/days');}
   if(event.key==='?'){event.preventDefault();setShortcuts(true);}
   if(event.key==='/'){event.preventDefault();const input=document.querySelector<HTMLInputElement>('input[aria-label="Search meals"]');if(input)input.focus();else router.push('/search?focus=1');}
  };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[router]);
 const entries:{label:string;href:string;icon:IconName;key?:string}[]=[{label:'Home',href:'/',icon:'home'},{label:'Search',href:'/search',icon:'search',key:'/'},{label:'Days',href:'/days',icon:'days',key:'D'}];
 return <aside className="hidden desktop:fixed desktop:inset-y-0 desktop:left-0 desktop:z-30 desktop:flex desktop:w-[240px] desktop:flex-col desktop:gap-6 desktop:border-r desktop:border-hairline desktop:bg-surface desktop:px-4 desktop:pt-7 desktop:pb-5">
  <div className="relative flex h-7 items-center justify-between pl-3"><Link href="/" className="text-[20px] font-semibold tracking-[-.3px]">My Food AI</Link><span className="absolute -right-2 -top-2"><SavedMealsButton/></span></div>
  <button onClick={newPost} className="flex h-11 items-center gap-[10px] rounded-field bg-text px-3 text-[15px] font-semibold text-surface"><Icon name="plus" size={20}/><span className="flex-1 text-left">New post</span><kbd className="rounded-chip bg-white/15 px-[6px] text-[11px] leading-[22px]">N</kbd></button>
  <nav aria-label="Main navigation" className="flex flex-col gap-[2px]">{entries.map(entry=>{const active=entry.href==='/'?path==='/':path.startsWith(entry.href);return <Link key={entry.href} href={entry.href} aria-current={active?'page':undefined} className={`flex h-11 items-center gap-[14px] rounded-field px-3 text-[15px] ${active?'bg-hairline font-semibold':''}`}><Icon name={entry.icon} active={active}/><span className="flex-1">{entry.label}</span><span className="text-[12px] text-faint">{entry.key}</span></Link>;})}</nav>
  <div id="desktop-upload-slot"/>
  <div className="mt-auto flex flex-col gap-3">{desktop&&<SidebarProfile path={path}/>}<button onClick={()=>setShortcuts(true)} className="flex items-center gap-[10px] px-3 text-[12px] text-muted"><kbd className="rounded-chip border border-line bg-white px-[6px] text-[11px] leading-[22px] text-text">?</kbd>Keyboard shortcuts</button></div>
  <ShortcutsDialog open={shortcuts} onClose={()=>setShortcuts(false)}/>
 </aside>;
}

function SidebarProfile({path}:{path:string}){const {handle,userId,avatarMediaId}=useProfileIdentity();return <Link href="/profile" aria-current={path.startsWith('/profile')?'page':undefined} className={`flex h-[52px] items-center gap-3 rounded-field px-3 ${path.startsWith('/profile')?'bg-hairline':''}`}><Avatar handle={handle} userId={userId} mediaId={avatarMediaId} sizePx={32} textClassName="text-[13px] font-semibold"/><span><span className="block text-[14px] font-semibold">{handle}</span><span className="block text-[12px] text-muted">Profile</span></span></Link>;}
