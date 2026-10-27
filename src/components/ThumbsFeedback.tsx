'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {sendFeedback,type Verdict} from '@/lib/posts/feedback';
import {Icon} from '@/components/ui/Icon';
export default function ThumbsFeedback({postId,modelCommentId}:{postId:string;modelCommentId:string|null}){
 const router=useRouter();const [verdict,setVerdict]=useState<Verdict|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const saving=useRef(false);
 useEffect(()=>{let live=true;const client=createClient();
  const refresh=()=>{void client.from('post_feedback').select('verdict,model_comment_id').eq('post_id',postId).maybeSingle().then(({data})=>{if(live)setVerdict(data?.model_comment_id===modelCommentId?data?.verdict??null:null);});};
  const onFeedback=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.postId===postId)setVerdict(detail.modelCommentId===modelCommentId?detail.verdict:null);};
  window.addEventListener('post-feedback',onFeedback);refresh();return()=>{live=false;window.removeEventListener('post-feedback',onFeedback);};
 },[postId,modelCommentId]);
 const vote=async(value:Verdict)=>{if(saving.current||!modelCommentId)return;saving.current=true;setBusy(true);setError('');
  try{await sendFeedback(postId,value,modelCommentId);setVerdict(value);if(value==='down')router.push(`/posts/${postId}?reply=1`);}
  catch{setError('Feedback could not be saved.');}finally{saving.current=false;setBusy(false);}
 };
 return <div><div className="flex gap-2 py-2">{(['up','down']as const).map(value=><button key={value} type="button" disabled={busy||!modelCommentId} aria-label={value==='up'?'Accept analysis':'Correct analysis'} aria-pressed={verdict===value} className={`flex min-h-tap min-w-tap items-center justify-center ${verdict===value?'text-text':'text-muted'}`} onClick={()=>{void vote(value);}}><Icon name="thumb" down={value==='down'}/></button>)}</div>{error?<p role="alert" className="text-meta text-muted">{error}</p>:null}</div>;
}
