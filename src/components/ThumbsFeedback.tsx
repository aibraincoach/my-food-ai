'use client';
import FirstRunHint from "@/components/FirstRunHint";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {sendFeedback,type Verdict} from '@/lib/posts/feedback';
import {saveFeedbackOptimistically} from '@/lib/posts/feedback-optimistic';
import {Icon} from '@/components/ui/Icon';
export default function ThumbsFeedback({postId,modelCommentId,fingerprint}:{postId:string;modelCommentId:string|null;fingerprint:string|null}){
 const router=useRouter();const [verdict,setVerdict]=useState<Verdict|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const saving=useRef<symbol|null>(null);const revision=JSON.stringify([modelCommentId,fingerprint]);const revisionRef=useRef(revision);revisionRef.current=revision;
 useEffect(()=>{let live=true;saving.current=null;setBusy(false);const client=createClient();
  const refresh=()=>{void client.from('post_feedback').select('verdict,model_comment_id,item_fingerprint').eq('post_id',postId).maybeSingle().then(({data})=>{if(live&&!saving.current)setVerdict(data?.model_comment_id===modelCommentId&&data?.item_fingerprint===fingerprint?data?.verdict??null:null);});};
  const onFeedback=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.postId===postId&&!saving.current)setVerdict(detail.modelCommentId===modelCommentId&&detail.fingerprint===fingerprint?detail.verdict:null);};
  window.addEventListener('post-feedback',onFeedback);refresh();return()=>{live=false;window.removeEventListener('post-feedback',onFeedback);};
 },[postId,modelCommentId,fingerprint]);
 const vote=async(value:Verdict)=>{if(saving.current||!modelCommentId||!fingerprint)return;const token=Symbol();const displayedRevision=revision;saving.current=token;setBusy(true);setError('');
  const isCurrent=()=>saving.current===token&&revisionRef.current===displayedRevision;
  try{const current=await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:setVerdict});if(current&&value==='down')router.push(`/posts/${postId}?reply=1`);}
  catch{if(isCurrent())setError('Feedback could not be saved.');}finally{if(isCurrent()){saving.current=null;setBusy(false);}}
 };
 return <div><div className="flex items-center gap-2 py-2">{(['up','down']as const).map(value=><button key={value} type="button" disabled={busy||!modelCommentId||!fingerprint} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex min-h-tap min-w-tap items-center justify-center ${verdict===value?'text-text':'text-muted'}`} onClick={()=>{void vote(value);}}><Icon name="thumb" down={value==='down'}/></button>)}<FirstRunHint hint="thumbs" /></div>{error?<p role="alert" className="text-meta text-muted">{error}</p>:null}</div>;


}
