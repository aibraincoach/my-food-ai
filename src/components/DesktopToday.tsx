'use client';
import {formatTotalEnergy,hasMixedTrace} from '@/lib/nutrition/totals';
/* eslint-disable @next/next/no-img-element -- Private signed meal photos bypass public image optimization. */
import {useLocale,useTranslations} from 'next-intl';
import {formatDate,formatNutrient} from '@/i18n/format';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useDesktop} from '@/lib/ui/use-desktop';
import {useDeviceTimeZone} from '@/components/LocalTime';
import {dateInZone,validZone} from '@/lib/posts/days';
import type {TodayView} from '@/lib/posts/today-view';
import {nutritionGaps,gapSentence} from '@/lib/nutrition/totals';
export default function DesktopToday({zone:configuredZone,initial,placeholder=false}:{zone?:string;initial?:TodayView;placeholder?:boolean}){
 const tn=useTranslations('nutrition');
 const locale=useLocale(),t=useTranslations('days');
 const desktop=useDesktop();const [loaded,setLoaded]=useState<{seed:TodayView|undefined;day:TodayView}|null>(null);const day=loaded&&loaded.seed===initial?loaded.day:initial??null;const [error,setError]=useState(false);const [slow,setSlow]=useState(false);
 // With no cookie, the server and first hydrated render share an empty clock.
 const deviceZone=useDeviceTimeZone();
 const zone=configuredZone?validZone(configuredZone):deviceZone;
 useEffect(()=>{if(!desktop||!zone)return;let live=true;let controller:AbortController|undefined;
 const load=()=>{controller?.abort();const request=new AbortController();controller=request;setSlow(false);setError(false);
 void fetch(`/api/today?tz=${encodeURIComponent(zone)}`,{cache:'no-store',signal:request.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json() as TodayView;if(live&&controller===request){setLoaded({seed:initial,day:data});setError(false);setSlow(false);}}).catch(()=>{if(live&&controller===request&&!request.signal.aborted)setError(true);});};
 if(!initial)load();
 const slowTimer=setTimeout(()=>{if(live&&!initial)setSlow(true);},3000);
 for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.addEventListener(name,load);
 return()=>{live=false;controller?.abort();if(slowTimer)clearTimeout(slowTimer);for(const name of ['post-settled','post-deleted','post-restore','intake-changed'])window.removeEventListener(name,load);};},[desktop,zone,initial,placeholder]);
 const gap=gapSentence(nutritionGaps(day?.totals??{}),tn,locale);
 const dateText=day?.date??(zone?dateInZone(new Date(),zone):null);
 const date=dateText?new Date(`${dateText}T12:00:00Z`):null;
 const showPlaceholder=placeholder||(!day&&!error&&!slow);
 return <aside aria-label={t('today')} className="sticky top-8 hidden self-start desktop:flex desktop:min-w-0 desktop:max-w-[280px] desktop:flex-1 desktop:flex-col desktop:gap-6">
  <div><h2 className="mb-[6px] text-[13px] text-muted">{showPlaceholder||(!day&&!configuredZone)?t('today'):t('todayDate',{date:date?formatDate(locale,date,'UTC',{weekday:'long',month:'short',day:'numeric'}):''})}</h2><p className="flex items-baseline gap-2"><span className="text-[34px] font-semibold tracking-[-.8px] tabular-nums">{day?formatTotalEnergy(day.totals,tn,locale):'—'}</span><span className="text-[14px] text-muted">{t('kcalConsumed')}</span>{day&&hasMixedTrace(day.totals)?<span className="text-meta text-muted">{tn('includesTraceAmounts')}</span>:null}</p></div>
  <div className="grid grid-cols-3 border-y border-hairline">{(['protein','carbs','fat'] as const).map(key=><div key={key} className="py-3"><p className="text-[16px] font-semibold tabular-nums">{day?formatNutrient(locale,day.totals[`${key}_g`]):'—'} g</p><p className="text-[12px] text-muted">{t(key)}</p></div>)}</div>
  <div><h3 className="mb-3 text-[13px] font-semibold">{t('todaysMeals')}</h3><div className="space-y-3">{day?.posts.map(post=><Link key={post.id} href={`/?post=${post.id}`} className="flex items-center gap-3">{post.photoUrl?<img loading="lazy" src={post.photoUrl} alt="" className="size-11 shrink-0 rounded-thumb object-cover"/>:<span className="size-11 shrink-0 rounded-thumb bg-card"/>}<span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium">{post.caption||post.items.map(item=>item.name).join(', ')||t('mealImage')}</span><span className="text-[12px] text-muted">{zone?formatDate(locale,new Date(post.eatenAt),zone,{hour:'numeric',minute:'2-digit'}):''}</span></span><span className="text-[13px] tabular-nums">{formatTotalEnergy(post.totals,tn,locale)} kcal{hasMixedTrace(post.totals)?<span className="block text-label">{tn('includesTraceAmounts')}</span>:null}</span></Link>)}</div>{day&&!day.posts.length?<p className="text-detail text-muted">{t('noMealsToday')}</p>:null}</div>
  {gap?<p className="text-meta text-muted">{tn('knownValues')} {gap}</p>:null}
  {slow&&!day&&!error?<p role="status" className="text-detail text-muted">{t('todayTotalsFailed')}{locale==='en'?' ':''}<button type="button" className="underline" onClick={()=>void fetch(`/api/today?tz=${encodeURIComponent(zone)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error();setLoaded({seed:initial,day:await response.json()});setSlow(false);}).catch(()=>setError(true))}>{t('tryAgain')}</button></p>:null}
  {error?<p role="status" className="text-detail text-muted">{t('todayTotalsFailed')}{locale==='en'?' ':''}<button type="button" className="underline" onClick={()=>{setError(false);void fetch(`/api/today?tz=${encodeURIComponent(zone)}`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error();setLoaded({seed:initial,day:await response.json()});}).catch(()=>setError(true));}}>{t('tryAgain')}</button></p>:null}
 </aside>;
}
