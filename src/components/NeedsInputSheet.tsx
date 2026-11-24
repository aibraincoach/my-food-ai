/* eslint-disable @next/next/no-img-element -- Private signed images bypass paid optimization. */
"use client";
import {useTranslations} from 'next-intl';
import {useLocalTime} from '@/components/LocalTime';
import {useState} from "react";
import {Sheet} from "@/components/ui/Sheet";
import {Button} from "@/components/ui/Button";
import {Field} from "@/components/ui/Field";
import type {NeedsInput} from "@/lib/pipeline/needs-input";
// held: the meal waits for the answer (status needs_input). Otherwise the meal is posted and the question sits beside it.
export type QuestionPost={id:string;eaten_at:string;needs_input:NeedsInput;photoUrl:string|null;held:boolean};
export default function NeedsInputSheet({post,onClose,onAnswered}:{post:QuestionPost;onClose:()=>void;onAnswered:()=>void}) {
  const t=useTranslations('postMenu'),clock=useLocalTime(post.eaten_at);
  const [answer,setAnswer]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  return <Sheet open onClose={onClose} label={t('clarifyMeal')}>
    <div className="flex gap-sheet-top">
      {post.photoUrl&&<img src={post.photoUrl} alt={t('meal')} className="size-brand rounded-tile object-cover"/>}
      <div><h2 className="text-sheet-title">{post.needs_input.question}</h2><p className="text-detail text-muted">{clock}</p></div>
    </div>
    {post.needs_input.options.map(option=><button key={option} type="button" onClick={()=>setAnswer(option)} aria-pressed={answer===option} className="min-h-field-h rounded-field border border-line bg-white px-field-x text-left text-body">{option}</button>)}
    <Field value={answer} onChange={event=>setAnswer(event.target.value)} placeholder={t('somethingElse')} aria-label={t('yourAnswer')}/>
    {error&&<p role="alert" className="text-detail">{error}</p>}
    <Button disabled={busy||!answer.trim()} onClick={async()=>{setBusy(true);try{const response=await fetch(`/api/posts/${post.id}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:answer})});if(!response.ok)throw new Error();if(post.held)window.dispatchEvent(new CustomEvent("post-answer-resume",{detail:{id:post.id}}));onAnswered();}catch{setError(t('answerSaveFailed'));}finally{setBusy(false);}}}>{busy?t('saving'):t('done')}</Button>
  </Sheet>;
}
