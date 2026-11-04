/* eslint-disable @next/next/no-img-element -- Private signed meal photos bypass public image optimization. */
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useDesktop} from '@/lib/ui/use-desktop';
import {dateInZone,validZone,type LoggedDay} from '@/lib/posts/days';
import {formatCalories,formatNutrition} from '@/lib/nutrition/totals';
export default function DesktopToday({zone:configuredZone}:{zone?:string}){
 const desktop=useDesktop();const [day,setDay]=useState<LoggedDay|null>(null);const [error,setError]=useState(false);
 const zone=validZone(configuredZone||Intl.DateTimeFormat().resolvedOptions().timeZone);
 useEffect(()=>{if(!desktop)return;let live=true;let controller:AbortController|undefined;const load=()=>{controller?.abort();const request=new AbortController();controller=request;const today=dateInZone(new Date(),zone);void fetch(`/api/days?date=${today}&tz=${encodeURIComponent(zone)}`,{cache:'no-store',signal:request.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(live&&controller===request){setDay(data.day);setError(false);}}).catch(()=>{if(live&&controller===request&&!request.signal.aborted)setError(true);});};load();for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.addEventListener(name,load);return()=>{live=false;controller?.abort();for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.removeEventListener(name,load);};},[desktop,zone]);
 if(!desktop)return null;
 const missing=[...new Set(Object.values(day?.totals.missing??{}).flat())];
 const date=new Date(`${day?.date??dateInZone(new Date(),zone)}T12:00:00Z`);
 return <aside aria-label="Today" className="sticky top-8 hidden self-start desktop:flex desktop:min-w-0 desktop:max-w-[280px] desktop:flex-1 desktop:flex-col desktop:gap-6">
  <div><h2 className="mb-[6px] text-[13px] text-muted">Today · {date.toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'})}</h2><p className="flex items-baseline gap-2"><span className="text-[34px] font-semibold tracking-[-.8px] tabular-nums">{day?formatCalories(day.totals.calories):'—'}</span><span className="text-[14px] text-muted">kcal consumed</span></p></div>
  <div className="grid grid-cols-3 border-y border-hairline">{(['protein','carbs','fat'] as const).map(key=><div key={key} className="py-3"><p className="text-[16px] font-semibold tabular-nums">{day?formatNutrition(day.totals[`${key}_g`]):'—'} g</p><p className="text-[12px] text-muted">{key}</p></div>)}</div>
  <div><h3 className="mb-3 text-[13px] font-semibold">Posted today</h3><div className="space-y-3">{day?.posts.map(post=><Link key={post.id} href={`/?post=${post.id}`} className="flex items-center gap-3">{post.photoUrl?<img src={post.photoUrl} alt="" className="size-11 shrink-0 rounded-thumb object-cover"/>:<span className="size-11 shrink-0 rounded-thumb bg-card"/>}<span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{post.caption||post.items.map(item=>item.name).join(', ')||'Meal'}</span><span className="text-[12px] text-muted">{new Date(post.eatenAt).toLocaleTimeString('en',{hour:'numeric',minute:'2-digit',timeZone:zone})}</span></span><span className="text-[13px] tabular-nums">{formatCalories(post.totals.calories)} kcal</span></Link>)}</div>{day&&!day.posts.length?<p className="text-detail text-muted">No posts today</p>:null}</div>
  {missing.length?<p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {missing.join(', ')}</p>:null}
  {error?<p role="status" className="text-detail text-muted">Today could not be loaded.</p>:null}
 </aside>;
}
