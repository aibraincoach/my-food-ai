'use client';
import {useEffect,useState,useSyncExternalStore,type CSSProperties} from 'react';
import DesktopHomeFrame from '@/components/DesktopHomeFrame';
import DesktopToday from '@/components/DesktopToday';
import {useDesktop} from '@/lib/ui/use-desktop';
import Feed from '@/components/Feed';
import DayRings from '@/components/DayRings';
import NeedsInputStrip from '@/components/NeedsInputStrip';
import SavedMealsButton from '@/components/SavedMealsButton';
import {useDeviceTimeZone} from '@/components/LocalTime';
import {createClient} from '@/lib/supabase/client';
import {dateInZone} from '@/lib/posts/days';

const emptyDays:[]=[];
const subscribeDay=(listener:()=>void)=>{const timer=setInterval(listener,60000);window.addEventListener('focus',listener);return()=>{clearInterval(timer);window.removeEventListener('focus',listener);};};
/** Anonymous markup, then the same cache-first, owner-authorized HTTP reader
 * used by Home. The mounted feed remains interactive during revalidation. */
export default function ShellHome(){
 const zone=useDeviceTimeZone();
 const desktop=useDesktop();
 // On desktop, leave a service-worker shell for the network Home once. The
 // underscore makes the worker bypass its navigation timeout for that request.
 useEffect(()=>{if(!desktop||!navigator.onLine)return;const url=new URL(window.location.href);if(url.searchParams.has('_'))return;url.searchParams.set('_',String(Date.now()));window.location.replace(url.toString());},[desktop]);
 const today=useSyncExternalStore(subscribeDay,()=>zone?dateInZone(new Date(),zone):'',()=> '');
 const [owner,setOwner]=useState<string|null>(null);
 useEffect(()=>{
  const db=createClient();let live=true,generation=0,verified:string|null=null;
  const verify=async()=>{const current=++generation;try{const {data:{user},error}=await db.auth.getUser();if(live&&current===generation){verified=error?null:user?.id??null;setOwner(verified);}}catch{if(live&&current===generation){verified=null;setOwner(null);}}};
  void verify();
  const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
   if(event==='INITIAL_SESSION')return;
   if(event==='SIGNED_OUT'||session?.user.id!==verified){generation++;verified=null;setOwner(null);}
   if(event!=='SIGNED_OUT')queueMicrotask(()=>{if(live)void verify();});
  });
  return()=>{live=false;generation++;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{if(zone)document.cookie=`time-zone=${encodeURIComponent(zone)}; Path=/; SameSite=Lax; Max-Age=31536000`;},[zone]);
 return <div className="desktop:flex desktop:justify-center desktop:gap-6 desktop:py-6"><div className="min-w-0 desktop:shrink-0" style={{'--workspace-width':'844px'} as CSSProperties} data-desktop-workspace><DesktopHomeFrame shell today={<DesktopToday zone={zone||undefined}/>}>
  <header className="desktop:hidden sticky top-0 z-20 flex h-top-safe items-center bg-surface px-inset"><h1 className="flex-1 text-title">My Food AI</h1><SavedMealsButton/></header>
  <NeedsInputStrip/>
  <DayRings key={owner??'unverified'} pending ownerId={owner} days={emptyDays} totals={emptyDays} today={today||'1970-01-01'} zone={zone||'UTC'} zoneKnown={Boolean(zone)}/>
  <div data-home-feed><Feed/></div>
 </DesktopHomeFrame></div></div>;
}
