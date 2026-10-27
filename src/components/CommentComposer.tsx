'use client';
import {useEffect,useRef,useState} from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import {useSearchParams} from 'next/navigation';
export type CommentRow={id:string;author:'user'|'model';body:string;created_at:string};
export default function CommentComposer({postId,onPosted}:{postId:string;onPosted:(comment:CommentRow)=>void}){
 const [text,setText]=useState(''); const [busy,setBusy]=useState(false); const posting=useRef(false);
 const [voiceBusy,setVoiceBusy]=useState(false);const voicePending=useRef(false);
 const [error,setError]=useState(''); const ref=useRef<HTMLInputElement>(null); const params=useSearchParams();
 useEffect(()=>{if(params.get('reply')==='1')ref.current?.focus();},[params]);
 return <form className="flex flex-wrap items-center gap-2 border-t border-hairline py-sheet-top" onSubmit={async(event)=>{
  event.preventDefault(); if(posting.current||voicePending.current||!text.trim())return;
  posting.current=true;setBusy(true);setError('');
  try{const response=await fetch(`/api/posts/${postId}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.trim()})});
   const body=await response.json();if(!response.ok)throw new Error(body.error??'Comment could not be sent.');
   setText('');onPosted(body.comment);
  }catch(cause){setError(cause instanceof Error?cause.message:'Comment could not be sent.');}
  finally{posting.current=false;setBusy(false);}
 }}>
  <input id="comment-field" ref={ref} value={text} onChange={e=>setText(e.target.value)} maxLength={4000} disabled={busy} aria-label="Comment or correct" placeholder="Comment or correct…" className="min-h-tap min-w-0 flex-1 rounded-field border border-line bg-white px-field-x text-body outline-none focus:border-text" />
  <VoiceRecorder postId={postId} disabled={busy} onActiveChange={active=>{voicePending.current=active;setVoiceBusy(active);}} onTranscript={transcript=>{setText(current=>`${current}${current.trim()?" ":""}${transcript}`.slice(0,4000));ref.current?.focus();}} />
  <button type="submit" disabled={busy||voiceBusy||!text.trim()} aria-label="Send comment" className="flex min-h-tap min-w-tap items-center justify-center rounded-circle bg-text text-surface disabled:opacity-40"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20V4m-7 7 7-7 7 7"/></svg></button>
  {error?<p role="alert" className="w-full text-meta text-muted">{error}</p>:null}
 </form>;
}
