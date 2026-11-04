'use client';
import FirstRunHint from "@/components/FirstRunHint";
import {useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {sendFeedback,type Verdict} from '@/lib/posts/feedback';
import {saveFeedbackOptimistically} from '@/lib/posts/feedback-optimistic';
import {hasFeedbackError,feedbackSavePending,saveFeedbackRevision,subscribeFeedbackErrors} from '@/lib/posts/feedback-errors';
import {Icon} from '@/components/ui/Icon';
export default function ThumbsFeedback({postId,modelCommentId,fingerprint,compact=false}:{postId:string;modelCommentId:string|null;fingerprint:string|null;compact?:boolean}){
 const router=useRouter();const [verdict,setVerdict]=useState<Verdict|null>(null);const [error,setError]=useState<{revision:string;message:string}|null>(null);const saving=useRef<symbol|null>(null);const revision=JSON.stringify([postId,modelCommentId,fingerprint]);const revisionRef=useRef(revision);const busy=useSyncExternalStore(subscribeFeedbackErrors,()=>feedbackSavePending(revision),()=>false);
 const storedError=useSyncExternalStore(subscribeFeedbackErrors,()=>hasFeedbackError(revision),()=>false);
 // Invalidate an old request during commit, before passive subscriptions or
 // promise callbacks can observe the newly displayed analysis.
 useLayoutEffect(()=>{saving.current=null;revisionRef.current=revision;return()=>{saving.current=null;revisionRef.current='';};},[revision]);
 useEffect(()=>{let live=true;const client=createClient();
  const refresh=()=>{void client.from('post_feedback').select('verdict,model_comment_id,item_fingerprint').eq('post_id',postId).maybeSingle().then(({data})=>{if(live&&revisionRef.current===revision&&!saving.current)setVerdict(data?.model_comment_id===modelCommentId&&data?.item_fingerprint===fingerprint?data?.verdict??null:null);});};
  const onFeedback=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.postId===postId&&revisionRef.current===revision&&!saving.current&&detail.modelCommentId===modelCommentId&&detail.fingerprint===fingerprint)setVerdict(detail.verdict);};
  const onError=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.postId===postId&&(!detail.revision||detail.revision===revision)&&revisionRef.current===revision)setError({revision,message:'Feedback could not be saved. Try again.'});};
  window.addEventListener('post-feedback',onFeedback);window.addEventListener('feedback-error',onError);refresh();return()=>{live=false;window.removeEventListener('post-feedback',onFeedback);window.removeEventListener('feedback-error',onError);};
 },[postId,modelCommentId,fingerprint,revision]);
 const vote=async(value:Verdict)=>{if(!modelCommentId||!fingerprint)return;const token=Symbol();const displayedRevision=revision;
  const isCurrent=()=>saving.current===token&&revisionRef.current===displayedRevision;
  try{await saveFeedbackRevision(displayedRevision,async()=>{
   saving.current=token;setError(null);
   // 7a: open the reply immediately while the revision-owned vote saves.
   if(value==='down')router.push(`/posts/${postId}?reply=1`);
   await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:setVerdict});
  });}
  catch{if(isCurrent())setError({revision:displayedRevision,message:'Feedback could not be saved. Try again.'});window.dispatchEvent(new CustomEvent('feedback-error',{detail:{postId,revision:displayedRevision}}));}
  finally{if(isCurrent())saving.current=null;}
 };

 return <div><div className={compact?"flex items-center gap-[18px]":"flex items-center gap-2 py-2"}>{(['up','down']as const).map(value=><button key={value} type="button" disabled={!modelCommentId||!fingerprint} aria-busy={busy} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex items-center justify-center ${compact?"-m-[10px] size-11":"h-tap"} ${modelCommentId&&fingerprint?'text-text':'text-faint'}`} onClick={()=>{void vote(value);}}><Icon name="thumb" down={value==='down'} size={24} fill={verdict===value?'currentColor':'none'}/></button>)}<FirstRunHint hint="thumbs" /></div>{error?.revision===revision||storedError?<p role="alert" className="text-meta text-muted">{error?.revision===revision?error.message:'Feedback could not be saved. Try again.'}</p>:null}</div>;


}
