'use client';
import {onTabReturn} from '@/lib/client/tab-return';
import {useTranslations} from 'next-intl';
import FirstRunHint from "@/components/FirstRunHint";
import {useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import {useRouter} from 'next/navigation';
import {requestFeedback} from '@/lib/client/feedback-batch';
import {sendFeedback,StaleFeedbackError,type Verdict} from '@/lib/posts/feedback';
import {saveFeedbackOptimistically} from '@/lib/posts/feedback-optimistic';
import {hasFeedbackError,feedbackSavePending,saveFeedbackRevision,subscribeFeedbackErrors} from '@/lib/posts/feedback-errors';
import {Icon} from '@/components/ui/Icon';
export default function ThumbsFeedback({postId,modelCommentId,fingerprint,compact=false}:{postId:string;modelCommentId:string|null;fingerprint:string|null;compact?:boolean}){
 const t=useTranslations('postMenu');
 const router=useRouter();const [selection,setSelection]=useState<{revision:string;value:Verdict|null}|null>(null);const [pressed,setPressed]=useState<Verdict|null>(null);const [error,setError]=useState<{revision:string|null;message?:string}|null>(null);const saving=useRef<symbol|null>(null);const revision=JSON.stringify([postId,modelCommentId,fingerprint]);const revisionRef=useRef(revision);const busy=useSyncExternalStore(subscribeFeedbackErrors,()=>feedbackSavePending(revision),()=>false);
 const verdict=selection?.revision===revision?selection.value:null;
 const currentRevision=useRef({revision,modelCommentId,fingerprint});
 const storedError=useSyncExternalStore(subscribeFeedbackErrors,()=>hasFeedbackError(revision),()=>false);
 useLayoutEffect(()=>{saving.current=null;revisionRef.current=revision;currentRevision.current={revision,modelCommentId,fingerprint};return()=>{saving.current=null;revisionRef.current='';};},[revision,modelCommentId,fingerprint]);
 useEffect(()=>{let live=true;
  const refresh=()=>{const displayed=currentRevision.current;void requestFeedback(postId).catch(()=>null).then(data=>{if(live&&revisionRef.current===displayed.revision&&!saving.current)setSelection({revision:displayed.revision,value:data?.model_comment_id===displayed.modelCommentId&&data?.item_fingerprint===displayed.fingerprint?data?.verdict??null:null});});};
  const onFeedback=(event:Event)=>{const detail=(event as CustomEvent).detail,current=currentRevision.current;if(detail?.postId===postId&&revisionRef.current===current.revision&&!saving.current&&detail.modelCommentId===current.modelCommentId&&detail.fingerprint===current.fingerprint)setSelection({revision:current.revision,value:detail.verdict});};
  const onError=(event:Event)=>{const detail=(event as CustomEvent).detail,current=currentRevision.current;if(detail?.postId===postId&&(!detail.revision||detail.revision===current.revision)&&revisionRef.current===current.revision)setError({revision:detail.stale?null:current.revision});};
  const stopReturn=onTabReturn(refresh);
  window.addEventListener('post-feedback',onFeedback);window.addEventListener('feedback-error',onError);refresh();return()=>{live=false;stopReturn();window.removeEventListener('post-feedback',onFeedback);window.removeEventListener('feedback-error',onError);};
 },[postId]);
 const vote=async(value:Verdict)=>{if(!modelCommentId||!fingerprint)return;const token=Symbol();const displayedRevision=revision;
  const isCurrent=()=>saving.current===token&&revisionRef.current===displayedRevision;
  try{await saveFeedbackRevision(displayedRevision,async()=>{
   saving.current=token;setError(null);
   await saveFeedbackOptimistically({previous:verdict,next:value,save:()=>sendFeedback(postId,value,modelCommentId,fingerprint),isCurrent,select:value=>setSelection({revision:displayedRevision,value})});
  });}
  catch(error){const stale=error instanceof StaleFeedbackError;const message=stale?t('feedbackSaveFailed'):undefined;if(isCurrent()||stale)setError({revision:stale?null:displayedRevision,message});window.dispatchEvent(new CustomEvent('feedback-error',{detail:{postId,revision:displayedRevision,message,stale}}));if(stale)router.refresh();}
  finally{if(isCurrent())saving.current=null;}
 };
 const thumbClass=(value:Verdict)=>{
  if(!modelCommentId||!fingerprint)return 'text-faint';
  if(verdict===value||pressed===value)return 'text-text';
  return 'text-text';
 };

 return <div><div className={compact?"flex items-center gap-[18px]":"flex items-center gap-2 py-2"}>{(['up','down']as const).map(value=><button key={value} type="button" disabled={!modelCommentId||!fingerprint} aria-busy={busy} aria-label={value==='up'?t('acceptAnalysis'):t('correctAnalysis')} aria-pressed={verdict===value} className={`flex items-center justify-center ${compact?"-m-[10px] size-11":"h-tap"} ${thumbClass(value)}`} onPointerDown={()=>{if(modelCommentId&&fingerprint)setPressed(value);}} onPointerUp={()=>setPressed(null)} onPointerLeave={()=>setPressed(null)} onClick={()=>{if(value==='down')window.dispatchEvent(new CustomEvent('post-open-preview',{detail:{id:postId,committed:true}}));if(value==='down')router.push(`/posts/${postId}?reply=1`);void vote(value);}}><Icon name="thumb" down={value==='down'} size={24} fill={verdict===value||pressed===value?'currentColor':'none'}/></button>)}<FirstRunHint hint="thumbs" /></div>{error&&(error.revision===null||error.revision===revision)||storedError?<p role="alert" className="text-meta text-muted">{error&&(error.revision===null||error.revision===revision)?(error.message??t('feedbackSaveFailed')):t('feedbackSaveFailed')}</p>:null}</div>;


}
