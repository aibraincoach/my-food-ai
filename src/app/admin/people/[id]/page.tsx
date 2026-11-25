import {Suspense} from 'react';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {getLocale,getTimeZone,getTranslations} from 'next-intl/server';
import {requireOwner} from '@/lib/admin/owner';
import {readPersonAccount,readPeopleStats,peoplePage} from '@/lib/admin/people';
import {isUuid} from '@/lib/posts/items';
import {formatNumber,formatDate} from '@/i18n/format';
import {PersonFacts,Pages,Stamp} from '../presentation';
type Props={params:Promise<{id:string}>;searchParams:Promise<{page?:string}>};
export default function Person(props:Props){return <Suspense fallback={null}><PersonContent {...props}/></Suspense>;}
async function PersonContent({params,searchParams}:Props){
 await connection();await requireOwner();
 const {id}=await params;if(!isUuid(id))notFound();
 const page=peoplePage((await searchParams).page);
 const [t,locale,zone,account]=await Promise.all([getTranslations('admin'),getLocale(),getTimeZone(),readPersonAccount(id)]);
 if(account.ok&&!account.person)notFound();
 const result=await readPeopleStats(zone,[id],page,id),metadata=result.ok?result.stats.metadata.find(p=>p.id===id)??null:null;
 const number=(n:number)=>formatNumber(locale,n);
 return <main className="mx-auto w-full max-w-3xl space-y-card-gap bg-surface px-screen-x py-card-gap text-detail text-text">
  <Link href="/admin/people" className="inline-flex min-h-tap items-center underline">{t('peopleBack')}</Link>
  <h1 className="break-words text-title">{result.ok?metadata?.handle??t('noHandleYet'):t('peopleUnavailable')}</h1><p className="break-all text-meta">{id}</p><p>{t('peopleTimezone',{zone})}</p><p className="text-muted">{t('activityScope')}</p>
  {!account.ok?<p role="alert">{t('peopleLoadFailed')}</p>:account.person&&<PersonFacts detail person={account.person} metadata={metadata} t={t} locale={locale} zone={zone}/>}
  {!result.ok?<p role="alert">{t('peopleLoadFailed')}</p>:<>
   <section className="space-y-sheet-top"><h2 className="text-sheet-title">{t('peopleErrorsThirty')}{' '}{number(result.stats.person_error_count)}</h2><p className="text-muted">{t('failedTimeScope')}</p>
    {!result.stats.person_errors.length?<p>{t('noErrors')}</p>:<ol className="space-y-card-gap">{result.stats.person_errors.map(e=><li key={e.kind+e.id} className="space-y-sheet-top border-b border-hairline pb-sheet-top"><h3>{t(e.kind)}</h3><p>{t('peopleErrorTime')}{' '}<Stamp value={e.at} zone={zone} locale={locale} empty={t('peopleNotRecorded')}/></p><p>{t('peopleErrorCode')}{' '}{e.code??t('peopleNotRecorded')}</p>{e.post_id&&<Link href={`/admin/posts/${e.post_id}`} className="inline-flex min-h-tap items-center break-all underline">{e.post_id}</Link>}</li>)}</ol>}
    <Pages page={page} total={result.stats.person_error_count} href={n=>`/admin/people/${id}?page=${n}`} t={t}/>
   </section>
   <section><h2 className="text-sheet-title">{t('peopleAgentUse')}</h2><div className="overflow-x-auto"><table className="w-full tabular-nums"><thead><tr>{(['peopleDate','peopleAgentReads','peopleAgentLists','peopleAgentWrites'] as const).map(key=><th key={key} className="p-2 text-left" scope="col">{t(key)}</th>)}</tr></thead><tbody>{result.stats.person_agent.map(d=><tr key={d.day} className="border-b border-hairline"><th scope="row" className="p-2 text-left font-normal"><time dateTime={d.day}>{formatDate(locale,new Date(d.day+'T12:00:00Z'),'UTC',{dateStyle:'medium'})}</time></th>{[d.reads,d.lists,d.writes].map((n,i)=><td key={i} className="p-2">{number(n)}</td>)}</tr>)}</tbody></table></div></section>
  </>}
 </main>;
}
