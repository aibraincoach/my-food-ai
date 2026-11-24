'use client';
import {useTranslations} from 'next-intl';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function IdentifyProviderSwitch({initial}:{initial:'meta'|'open'}) {
 const t=useTranslations('profile');
 const router=useRouter();
 const [provider,setProvider]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function change(){if(busy)return;const previous=provider,next=provider==='meta'?'open':'meta';setProvider(next);setBusy(true);setError('');try{const response=await fetch('/api/profile/identify-provider',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:next})});if(!response.ok)throw Error();router.refresh();}catch{setProvider(previous);setError(t('settingSaveFailed'));}finally{setBusy(false);}}
 return <section className="border-b border-line px-screen-x py-4"><div className="flex items-center justify-between gap-3"><span className="text-body">{t('identifyTitle')}</span><button type="button" role="switch" aria-label={t('identifyTitle')} aria-checked={provider==='open'} disabled={busy} onClick={change} className="min-h-tap min-w-tap rounded-pill border border-line px-3 text-detail">{provider==='open'?t('on'):t('off')}</button></div><p className="text-[13px] text-muted">{t('identifyDescription')}</p>{error?<p role="alert" className="text-[13px] text-muted">{error}</p>:null}</section>;
}
