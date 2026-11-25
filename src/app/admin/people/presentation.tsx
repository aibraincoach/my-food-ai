import Link from 'next/link';
import {formatDate,formatNumber} from '@/i18n/format';
import type {Locale} from '@/i18n/locales';
import type {getTranslations} from 'next-intl/server';
import type {Account,PersonMetadata} from '@/lib/admin/people';
export type AdminT=Awaited<ReturnType<typeof getTranslations<'admin'>>>;
export function PersonName({id,handle,t}:{id:string;handle:string|null;t:AdminT}){
 return <Link href={`/admin/people/${id}`} className="inline-flex min-h-tap items-center break-all underline">{handle??t('noHandleYet')}<span className="ml-2 text-meta text-muted">{id.slice(0,8)}</span></Link>;
}
export function Stamp({value,zone,locale,empty}:{value:string|null;zone:string;locale:Locale;empty:string}){
 return value?<time dateTime={value}>{formatDate(locale,new Date(value),zone,{dateStyle:'medium',timeStyle:'short'})}</time>:<>{empty}</>;
}
export function PersonFacts({person,metadata,t,locale,zone,detail=false}:{person:Account&{email?:string|null};metadata:PersonMetadata|null;t:AdminT;locale:Locale;zone:string;detail?:boolean}){
 const num=(n:number|undefined)=>n===undefined?t('peopleUnavailable'):formatNumber(locale,n);
 const rows:[string,React.ReactNode][]=[
  [t('signedUpAt'),<Stamp key="signup" value={person.createdAt} zone={zone} locale={locale} empty={t('peopleNotRecorded')}/>],
  [t('emailStatus'),t(person.confirmed?'emailConfirmed':'emailNotConfirmed')],
  [t('signInMethod'),person.providers.join(', ')||t('peopleNotRecorded')],
  [t('lastSignIn'),<Stamp key="signin" value={person.lastSignIn} zone={zone} locale={locale} empty={t('noSignInRecorded')}/>],
  [t('lastActivity'),metadata?<Stamp key="activity" value={metadata.last_activity} zone={zone} locale={locale} empty={t('noActivityRecorded')}/>:t('peopleUnavailable')],
  [t('mealsPosted'),num(metadata?.meals)],[t('peopleErrorEventsSeven'),num(metadata?.errors)]
 ];
 if(detail)rows.push([t('peopleEmail'),person.email??t('peopleNotRecorded')],[t('peopleLanguage'),t('peopleNotRecorded')],[t('peopleComments'),num(metadata?.comments)],[t('peopleCorrections'),num(metadata?.corrections)],[t('peopleLiveTokens'),num(metadata?.live_tokens)],[t('peopleAgentLastUse'),metadata?<Stamp key="agent" value={metadata.agent_last_used} zone={zone} locale={locale} empty={t('peopleNotRecorded')}/>:t('peopleUnavailable')]);
 return <dl className="grid grid-cols-2 gap-x-grid gap-y-sheet-top break-words">{rows.map(([label,value])=><div key={label} className="contents"><dt className="text-muted">{label}</dt><dd className="min-w-0">{value}</dd></div>)}</dl>;
}
export function Pages({page,total,href,t}:{page:number;total:number;href:(page:number)=>string;t:AdminT}){
 return <nav className="flex flex-wrap items-center justify-between gap-grid" aria-label={t('accountsPage',{page})}>
 {page>1&&<Link className="inline-flex min-h-tap items-center underline" href={href(page-1)}>{t('peoplePrevious')}</Link>}
 <span>{t('accountsPage',{page})}</span>
 {page*50<total&&<Link className="inline-flex min-h-tap items-center underline" href={href(page+1)}>{t('peopleNext')}</Link>}
 </nav>;
}
