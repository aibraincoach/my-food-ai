'use client';
import FirstRunHint from "@/components/FirstRunHint";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {sendFeedback,type Verdict} from '@/lib/posts/feedback';
import {saveFeedbackOptimistically} from '@/lib/posts/feedback-optimistic';
import {Icon} from '@/components/ui/Icon';
export default function ThumbsFeedback({postId,modelCommentId,fingerprint,compact=false}:{postId:string;modelCommentId:string|null;fingerprint:string|null;compact?:boolean}){
 const router=useRouter();const [verdict,setVerdict]=useState<Verdict|null>(null);const [error,setError]=useState<{revision:string;message:string}|null>(null);const [busyRevision,setBusyRevision]=useState<string|null>(null);const saving=useRef<symbol|null>(null);const revision=JSON.stringify([postId,modelCommentId,fingerprint]);const revisionRef=useRef(revision);const busy=busyRevision===revision;
 // Invalidate an old request during commit, before passive subscriptions or
 // promise callbacks can observe the newly displayed analysis.
 useLayoutEffect(()=>{saving.current=null;revisionRef.current=revision;return()=>{saving.current=null;revisionRef.current='';};},[revision]);
 useEffect(()=>{let live=true;const client=createClient();
  const refresh=()=>{void client.from('post_feedback').select('verdict,model_comment_id,item_fingerprint').eq('post_id',postId).maybeSingle().then(({data})=>{if(live&&revisionRef.current===revision&&!saving.current)setVerdict(data?.model_comment_id===modelCommentId&&data?.item_fingerprint===fingerprint?data?.verdict??null:null);});};
  const onFeedback=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.postId===postId&&revisionRef.current===revision&&!saving.current&&detail.modelCommentId===modelCommentId&&detail.fingerprint===fingerprint)setVerdict(detail.verdict);};
  window.addEventListener('post-feedback',onFeedback);refresh();return()=>{live=false;window.removeEventListener('post-feedback',onFeedback);};
 },[postId,modelCommentId,fingerprint,revision]);
 const vote=async(value:Verdict)=>{if(saving.current||!modelCommentId||!fingerprint)return;const token=Symbol();const displayedRevision=revision;saving.current=token;setBusyRevision(revision);setError(null);
  const isCurrent=()=>saving.current===token&&revisionRef.current===displayedRevision;
  try{const current=await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:setVerdict});if(current&&value==='down')router.push(`/posts/${postId}?reply=1`);}
  catch{if(isCurrent())setError({revision:displayedRevision,message:'Feedback could not be saved.'});}finally{if(isCurrent()){saving.current=null;setBusyRevision(null);}}
 };
 return <div><div className={compact?"flex items-center gap-[18px]":"flex items-center gap-2 py-2"}>{(['up','down']as const).map(value=><button key={value} type="button" disabled={busy||!modelCommentId||!fingerprint} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex h-tap items-center justify-center ${verdict===value?'text-text':'text-text'}`} onClick={()=>{void vote(value);}}><Icon name="thumb" down={value==='down'} size={24} fill={verdict===value?'currentColor':'none'}/></button>)}<FirstRunHint hint="thumbs" /></div>{error?.revision===revision?<p role="alert" className="text-meta text-muted">{error.message}</p>:null}</div>;


}
