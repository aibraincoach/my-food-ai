'use client';
import {useTranslations} from 'next-intl';


import {useId,useState,type InputHTMLAttributes} from 'react';

type Props=InputHTMLAttributes<HTMLInputElement>&{label:string;help?:string;error?:string};
export function AuthField({label,help,error,id,type='text',className='',...props}:Props){
 const t=useTranslations('auth');
 const generated=useId(),inputId=id??generated;
 const [shown,setShown]=useState(false);
 const password=type==='password';
 const describedBy=[props['aria-describedby'],help?`${inputId}-help`:null,error?`${inputId}-error`:null].filter(Boolean).join(' ')||undefined;
 return <div className={`flex flex-col gap-grid ${className}`}>
  <label htmlFor={inputId} className="text-detail font-semibold text-text">{label}</label>
  <div className={`flex h-field-h items-center gap-grid rounded-field border bg-white px-field-x text-text ${error?'border-accent-deep':'border-line'}`}>
   <input {...props} id={inputId} type={password&&shown?'text':type} aria-describedby={describedBy} aria-invalid={error?true:props['aria-invalid']} className="h-full min-w-0 w-full bg-transparent text-body outline-none placeholder:text-muted disabled:opacity-50"/>
   {password?<button type="button" aria-label={shown?t('hidePassword'):t('showPassword')} aria-pressed={shown} onClick={()=>setShown(value=>!value)} className="min-h-tap shrink-0 px-grid text-comment font-semibold">{shown?t('hide'):t('show')}</button>:null}
  </div>
  {help?<p id={`${inputId}-help`} className="text-meta text-muted">{help}</p>:null}
  {error?<p id={`${inputId}-error`} role="alert" className="text-detail text-accent-deep">{error}</p>:null}
 </div>;
}
