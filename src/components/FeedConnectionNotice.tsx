"use client";
import {useSyncExternalStore} from 'react';
import {useTranslations} from 'next-intl';
const subscribe=(changed:()=>void)=>{window.addEventListener('online',changed);window.addEventListener('offline',changed);return()=>{window.removeEventListener('online',changed);window.removeEventListener('offline',changed);};};
/** Cached Home is an explicit mode, never an indistinguishable fresh response. */
export default function FeedConnectionNotice({cached}:{cached:boolean}){
 const t=useTranslations('feed');
 const online=useSyncExternalStore(subscribe,()=>navigator.onLine,()=>true);
 return !online||cached?<p role="status" data-feed-connection={online?'cached':'offline'} className="px-screen-x py-2 text-detail text-muted">{t(online?'cachedNotice':'offlineNotice')}</p>:null;
}
