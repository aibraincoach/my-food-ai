'use client';
import {useLocale} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {useSyncExternalStore} from 'react';
import {formatLocalTime,formatLocalDate} from '@/lib/time/local';
const subscribe=(listener:()=>void)=>{
 window.addEventListener('focus',listener);document.addEventListener('visibilitychange',listener);
 return()=>{window.removeEventListener('focus',listener);document.removeEventListener('visibilitychange',listener);};
};
const deviceZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone;
const noServerZone=()=>'';
export const useDeviceTimeZone=()=>useSyncExternalStore(subscribe,deviceZone,noServerZone);
export function useLocalDate(value:string):string {const zone=useDeviceTimeZone(),locale=useLocale() as Locale;return zone?formatLocalDate(locale,value,zone):'';}
export function useLocalTime(value:string,weekday=false):string {
 const zone=useDeviceTimeZone(),locale=useLocale() as Locale;
 // A server cannot know the viewing device's zone. Avoid a UTC flash.
 return zone ? formatLocalTime(locale,value,zone,weekday) : '';
}
export function LocalTime({value,weekday=false}:{value:string;weekday?:boolean}){
 const text=useLocalTime(value,weekday);
 return <time dateTime={value}>{text||'—'}</time>;
}
