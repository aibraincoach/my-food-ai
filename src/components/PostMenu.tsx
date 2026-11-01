'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Sheet} from '@/components/ui/Sheet';
import EatenAtEditor from '@/components/EatenAtEditor';
import {MAX_CAPTION_LENGTH} from '@/lib/posts/caption';
import {updateCaption} from '@/lib/posts/caption-client';
import {useLocalTime} from '@/components/LocalTime';
export type PostMenuRow={label:string;detail?:string;onSelect?:()=>void;onClick?:()=>void};
export default function PostMenu({postId,caption,eatenAt,rows=[],gtin}:{postId:string;caption:string;eatenAt?:string;rows?:PostMenuRow[];gtin?:string|null}) {
 const router=useRouter();const menu=useRef<HTMLDetailsElement>(null);const savingRef=useRef(false);
 const [open,setOpen]=useState(false),[timeOpen,setTimeOpen]=useState(false),[value,setValue]=useState(caption),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const clock=useLocalTime(eatenAt??'');
 const dismiss=()=>{if(menu.current)menu.current.open=false;};
 const edit=()=>{dismiss();setValue(caption);setError('');setOpen(true);};
 const save=async()=>{if(savingRef.current)return;savingRef.current=true;setSaving(true);setError('');try{await updateCaption(postId,value);router.refresh();setOpen(false);}catch(e){setError(e instanceof Error?e.message:'The caption could not be saved.');}finally{savingRef.current=false;setSaving(false);}};
 const options:PostMenuRow[]=[...rows,{label:'Edit caption',onSelect:edit},...(eatenAt?[{label:'Edit time',detail:clock,onSelect:()=>setTimeOpen(true)}]:[]),...(gtin?[{label:'Correct product',onSelect:()=>window.dispatchEvent(new CustomEvent('correct-product',{detail:{postId,gtin}}))}]:[])];
 return <>
  <details ref={menu} className="relative shrink-0">
   <summary aria-label="Meal menu" className="flex min-h-tap min-w-tap cursor-pointer list-none items-center justify-center text-[18px] tracking-[1px]">···</summary>
   <div className="absolute right-0 z-30 w-[220px] rounded-field border border-hairline bg-surface p-[6px]" style={{boxShadow:'var(--color-shadow-pill)'}}>
    {options.map((row,index)=><button key={`${row.label}-${index}`} type="button" onClick={()=>{dismiss();(row.onSelect??row.onClick)?.();}} className="flex h-tap w-full items-center justify-between gap-2 border-b border-hairline px-[10px] text-left text-comment last:border-b-0 active:bg-field"><span>{row.label}</span>{row.detail&&<span className="text-meta text-muted">{row.detail}</span>}</button>)}
   </div>
  </details>
  <Sheet open={open} onClose={()=>{if(!savingRef.current)setOpen(false);}} label="Edit caption">
   <h2 className="text-sheet-head">Edit caption</h2>
   <label htmlFor={`caption-${postId}`} className="text-meta text-muted">Caption</label>
   <textarea id={`caption-${postId}`} autoFocus maxLength={MAX_CAPTION_LENGTH} disabled={saving} value={value} onChange={event=>setValue(event.target.value)} className="min-h-24 rounded-field bg-field p-tooltip-x text-body"/>
   {error&&<p role="alert" className="text-meta text-muted">{error}</p>}
   <button type="button" disabled={saving||value===caption} onClick={()=>{void save();}} className="min-h-field-h rounded-field bg-text px-screen-x text-body text-surface disabled:opacity-50">{saving?'Saving…':'Save'}</button>
  </Sheet>
  {eatenAt&&<Sheet open={timeOpen} onClose={()=>setTimeOpen(false)} label="Edit time"><h2 className="text-sheet-head">Edit time</h2><EatenAtEditor key={`${postId}:${eatenAt}`} postId={postId} eatenAt={eatenAt}/></Sheet>}
 </>;
}
