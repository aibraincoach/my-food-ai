/* eslint-disable @next/next/no-img-element -- Private signed images bypass paid optimization. */
"use client";
import {useState} from "react";
import {Sheet} from "@/components/ui/Sheet";
import {Button} from "@/components/ui/Button";
import {Field} from "@/components/ui/Field";
import type {NeedsInput} from "@/lib/pipeline/needs-input";
export type QuestionPost={id:string;eaten_at:string;needs_input:NeedsInput;photoUrl:string|null};
export default function NeedsInputSheet({post,onClose,onAnswered}:{post:QuestionPost;onClose:()=>void;onAnswered:()=>void}) {
  const [answer,setAnswer]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  return <Sheet open onClose={onClose} label="Clarify meal">
    <div className="flex gap-sheet-top">
      {post.photoUrl&&<img src={post.photoUrl} alt="Meal" className="size-brand rounded-tile object-cover"/>}
      <div><h2 className="text-sheet-title">{post.needs_input.question}</h2><p className="text-detail text-muted">{new Date(post.eaten_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</p></div>
    </div>
    {post.needs_input.options.map(option=><button key={option} type="button" onClick={()=>setAnswer(option)} aria-pressed={answer===option} className="min-h-field-h rounded-field border border-line bg-white px-field-x text-left text-body">{option}</button>)}
    <Field value={answer} onChange={event=>setAnswer(event.target.value)} placeholder="Something else…" aria-label="Your answer"/>
    {error&&<p role="alert" className="text-detail">{error}</p>}
    <Button disabled={busy||!answer.trim()} onClick={async()=>{setBusy(true);try{const response=await fetch(`/api/posts/${post.id}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:answer})});if(!response.ok)throw new Error();window.dispatchEvent(new CustomEvent("post-updated",{detail:{id:post.id}}));onAnswered();}catch{setError("Answer could not be saved.");}finally{setBusy(false);}}}>{busy?"Saving…":"Done"}</Button>
  </Sheet>;
}
