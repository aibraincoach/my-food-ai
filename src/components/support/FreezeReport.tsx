'use client';
import {useState} from 'react';
import {useTranslations,useFormatter} from 'next-intl';
import {Sheet} from '@/components/ui/Sheet';
import {Button} from '@/components/ui/Button';
import {previewReport} from '@/lib/diagnostics/recorder';
import type {FreezeReport as Payload} from '@/lib/diagnostics/schema';
import {eventLabel,permissionKey} from '@/lib/diagnostics/labels';
export default function FreezeReport(){
 const t=useTranslations('support');const format=useFormatter();
 const [open,setOpen]=useState(false),[report,setReport]=useState<Payload|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'unavailable'|'sending'|'sent'|'failed'|'limited'>('loading');
 const busy=state==='loading'||state==='sending';
 async function show(){setOpen(true);setReport(null);setState('loading');try{setReport(await previewReport());setState('ready');}catch{setState('unavailable');}}
 async function send(){if(!report||state==='sending'||state==='sent')return;setState('sending');try{
  const response=await fetch('/api/freeze-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  setState(response.ok?'sent':response.status===429?'limited':'failed');
 }catch{setState('failed');}}
 return <section className="border-y border-hairline px-screen-x py-sheet-top desktop:px-0" data-freeze-report-section>
  <h2 className="text-meta text-muted">{t('sectionHeading')}</h2>
  <button type="button" className="flex min-h-tap w-full items-center text-left text-detail" onClick={()=>void show()}>{t('row')}</button>
  <Sheet open={open} onClose={()=>{if(state!=='sending')setOpen(false);}} label={t('title')} closeLabel={t('cancel')} confirmation>
   <h2 className="text-sheet-title">{t('title')}</h2><p className="text-detail">{t('explanation')}</p>
   {state==='loading'&&<p role="status">{t('loading')}</p>}
   {state==='unavailable'&&<p role="alert">{t('historyUnavailable')}</p>}
   {report&&<div data-report-preview className="space-y-sheet-top break-words text-detail">
    <dl><dt className="text-muted">{t('userAgentLabel')}</dt><dd>{report.user_agent}</dd><dt className="text-muted">{t('buildLabel')}</dt><dd>{report.build}</dd><dt className="text-muted">{t('cameraPermissionLabel')}</dt><dd>{t(permissionKey[report.camera_permission])}</dd></dl>
    <h3>{t('eventsLabel')}</h3>{report.events.length?<ol>{report.events.map((event,index)=><li key={index} data-event-time={event.t}><time dateTime={new Date(event.t).toISOString()}>{format.dateTime(event.t,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})}</time><span className="ml-2">{eventLabel(event,t)}</span></li>)}</ol>:<p>{t('emptyEvents')}</p>}
   </div>}
   {state==='sent'&&<p role="status">{t('sent')}</p>}{state==='failed'&&<p role="alert">{t('failed')}</p>}{state==='limited'&&<p role="alert">{t('rateLimited')}</p>}
   <div className="flex gap-sheet-gap"><Button variant="secondary" disabled={state==='sending'} onClick={()=>setOpen(false)}>{t('cancel')}</Button>{report&&state!=='sent'&&<Button disabled={busy} onClick={()=>void send()}>{t('send')}</Button>}</div>
  </Sheet>
 </section>;
}
