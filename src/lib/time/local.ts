import {formatDate} from '@/i18n/format';
import type {Locale} from '@/i18n/locales';
export function formatLocalTime(locale:Locale, value: string, zone?: string, weekday = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const options = { hour: 'numeric', minute: '2-digit', ...(zone ? {timeZone: zone} : {}) } as const;
  const personZone=zone??Intl.DateTimeFormat().resolvedOptions().timeZone;
  const clock = formatDate(locale,date,personZone,options);
  return weekday ? `${formatDate(locale,date,personZone,{weekday:'long'})} · ${clock}` : clock;
}

export function formatLocalDate(locale:Locale,value:string,zone?:string):string {
 const date=new Date(value);
 return Number.isFinite(date.getTime())?formatDate(locale,date,zone??Intl.DateTimeFormat().resolvedOptions().timeZone,{weekday:'short',month:'short',day:'numeric'}):'';
}
