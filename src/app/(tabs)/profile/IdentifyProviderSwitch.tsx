'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function IdentifyProviderSwitch({initial}:{initial:'meta'|'open'}) {
 const router=useRouter();
 const [provider,setProvider]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function change(){if(busy)return;const previous=provider,next=provider==='meta'?'open':'meta';setProvider(next);setBusy(true);setError('');try{const response=await fetch('/api/profile/identify-provider',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:next})});if(!response.ok)throw Error();router.refresh();}catch{setProvider(previous);setError('The setting could not be saved.');}finally{setBusy(false);}}
 return <section className="border-b border-line px-screen-x py-4"><div className="flex items-center justify-between gap-3"><span className="text-body">Identify food with Muse Spark Open</span><button type="button" role="switch" aria-label="Identify food with Muse Spark Open" aria-checked={provider==='open'} disabled={busy} onClick={change} className="min-h-tap min-w-tap rounded-pill border border-line px-3 text-detail">{provider==='open'?'On':'Off'}</button></div><p className="text-[13px] text-muted">Meta&apos;s open-weight model, served by Baseten. Built with Muse Spark Open.</p>{error?<p role="alert" className="text-[13px] text-muted">{error}</p>:null}</section>;
}
