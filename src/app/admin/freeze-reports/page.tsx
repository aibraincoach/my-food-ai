import {Suspense} from 'react';
import Link from 'next/link';
import {connection} from 'next/server';
import {notFound} from 'next/navigation';
import {getTranslations,getFormatter} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {eventLabel,permissionKey} from '@/lib/diagnostics/labels';
import type {DiagnosticEvent} from '@/lib/diagnostics/schema';
export default function FreezeReports(){return <Suspense fallback={null}><Reports/></Suspense>;}
async function Reports(){
 await connection();const client=await createClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user)notFound();
 const {data:profile,error:profileError}=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(profileError||profile?.role!=='admin')notFound();
 const {data:reports,error:readError}=await createAdminClient().from('freeze_reports').select('id,user_id,created_at,events,user_agent,build,camera_permission').order('created_at',{ascending:false}).limit(50);
 if(readError)throw new Error('Freeze reports could not be read');
 const t=await getTranslations('support'),format=await getFormatter();
 return <main className="mx-auto w-full max-w-phone space-y-card-gap px-screen-x py-card-gap text-detail">
  <Link href="/admin" className="underline">{t('adminBack')}</Link><h1 className="text-title">{t('adminTitle')}</h1>
  {!reports?.length&&<p>{t('adminEmpty')}</p>}
  <ol className="space-y-card-gap">{reports?.map(report=><li key={report.id} className="space-y-sheet-top break-words border-b border-hairline pb-card-gap">
   <dl><dt>{t('timeLabel')}</dt><dd><time dateTime={report.created_at}>{format.dateTime(new Date(report.created_at),{dateStyle:'medium',timeStyle:'medium'})}</time></dd><dt>{t('accountLabel')}</dt><dd>{report.user_id.slice(0,8)}</dd><dt>{t('buildLabel')}</dt><dd>{report.build}</dd><dt>{t('userAgentLabel')}</dt><dd>{report.user_agent}</dd><dt>{t('cameraPermissionLabel')}</dt><dd>{t(permissionKey[report.camera_permission])}</dd></dl>
   <h2>{t('eventsLabel')}</h2><ol>{(report.events as DiagnosticEvent[]).map((event,index)=><li key={index}><time dateTime={new Date(event.t).toISOString()}>{format.dateTime(event.t,{dateStyle:'short',timeStyle:'medium'})}</time><span className="ml-2">{eventLabel(event,t)}</span></li>)}</ol>
  </li>)}</ol>
 </main>;
}
