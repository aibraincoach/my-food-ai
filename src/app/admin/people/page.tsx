import {Suspense} from 'react';
import Link from 'next/link';
import {connection} from 'next/server';
import {getLocale,getTimeZone,getTranslations} from 'next-intl/server';
import {requireOwner} from '@/lib/admin/owner';
import {readPeopleAccounts,readPeopleStats,peoplePage} from '@/lib/admin/people';
import {formatDate,formatNumber} from '@/i18n/format';
import {PersonName,PersonFacts,Pages} from './presentation';
type Params=Promise<{page?:string;groupPage?:string}>;
export default function People({searchParams}:{searchParams:Params}){return <Suspense fallback={null}><PeopleContent searchParams={searchParams}/></Suspense>;}
async function PeopleContent({searchParams}:{searchParams:Params}){
 await connection();await requireOwner();
 const params=await searchParams,page=peoplePage(params.page),groupPage=peoplePage(params.groupPage);
 const [t,locale,zone,accounts]=await Promise.all([getTranslations('admin'),getLocale(),getTimeZone(),readPeopleAccounts(page)]);
 const result=await readPeopleStats(zone,accounts.ok?accounts.accounts.map(p=>p.id):[],groupPage);
 const number=(n:number)=>formatNumber(locale,n);
 return <main className="mx-auto w-full max-w-5xl space-y-card-gap bg-surface px-screen-x py-card-gap text-detail text-text">
  <Link href="/admin" className="inline-flex min-h-tap items-center underline">{t('backToQueue')}</Link>
  <h1 className="text-title">{t('peopleTitle')}</h1><p>{t('peopleTimezone',{zone})}</p><p className="text-muted">{t('activityScope')}</p>
  {!result.ok?<p role="alert">{t('peopleLoadFailed')}</p>:<>
   <div className="grid gap-card-gap md:grid-cols-2">{(['signup','today','week','error'] as const).map(kind=>{
    const label={signup:'signedUpToday',today:'activeToday',week:'activeLastSeven',error:'errorsLastSeven'} as const,group=result.stats.groups.filter(p=>p.kind===kind),total=result.stats.counts[kind];
    return <section key={kind} className="min-w-0 border-b border-hairline pb-card-gap"><h2 className="text-sheet-title">{t(label[kind])}<strong className="ml-2">{number(total)}</strong></h2>
     {group.length?<ul>{group.map(p=><li key={p.id}><PersonName id={p.id} handle={p.handle} t={t}/></li>)}</ul>:<p>{t('peopleEmpty')}</p>}
     <Pages page={groupPage} total={total} href={n=>`/admin/people?page=${page}&groupPage=${n}`} t={t}/>
    </section>;
   })}</div>
   <section><h2 className="text-sheet-title">{t('activityLastThirty')}</h2><div className="overflow-x-auto"><table className="w-full tabular-nums"><thead><tr>{(['peopleDate','signupCount','mealsPosted','activePeople','peopleAgentReads','peopleAgentLists','peopleAgentWrites'] as const).map(key=><th key={key} className="p-2 text-left" scope="col">{t(key)}</th>)}</tr></thead>
    <tbody>{result.stats.daily.map(d=><tr key={d.day} className="border-b border-hairline"><th className="p-2 text-left font-normal" scope="row"><time dateTime={d.day}>{formatDate(locale,new Date(d.day+'T12:00:00Z'),'UTC',{dateStyle:'medium'})}</time></th>{[d.signups,d.meals,d.active,d.agent_reads,d.agent_lists,d.agent_writes].map((v,i)=><td key={i} className="p-2">{number(v)}</td>)}</tr>)}</tbody></table></div></section>
  </>}
  <section className="space-y-card-gap"><h2 className="text-sheet-title">{t('accounts')}</h2><p>{t('accountsNewestFirst')}</p>
   {!accounts.ok?<p role="alert">{t('peopleLoadFailed')}</p>:<>
    {!accounts.accounts.length&&<p>{t('peopleEmpty')}</p>}
    <ol className="grid gap-card-gap md:grid-cols-2">{accounts.accounts.map(p=>{
     const metadata=result.ok?result.stats.metadata.find(m=>m.id===p.id)??null:null;
     return <li key={p.id} className="min-w-0 space-y-sheet-top border-b border-hairline pb-card-gap"><PersonName id={p.id} handle={result.ok?metadata?.handle??null:t('peopleUnavailable')} t={t}/><PersonFacts person={p} metadata={metadata} t={t} locale={locale} zone={zone}/></li>;
    })}</ol><Pages page={page} total={accounts.total} href={n=>`/admin/people?page=${n}&groupPage=${groupPage}`} t={t}/>
   </>}
  </section>
 </main>;
}
