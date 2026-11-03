'use client';
import {useEffect,useState} from 'react';
export default function UndoToast({text,onUndo,ms}:{text:string;onUndo?:()=>void|Promise<void>;ms:number}){
 const [visible,setVisible]=useState(true),[busy,setBusy]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setVisible(false),ms);return()=>clearTimeout(timer);},[ms]);
 if(!visible)return null;
 return <div role="status" className="fixed inset-x-inset bottom-[100px] z-[80] mx-auto flex h-[52px] max-w-phone items-center justify-between rounded-card bg-text px-4 text-comment text-surface"><span>{text}</span>{onUndo&&<button type="button" disabled={busy} className="min-h-tap px-2 font-semibold disabled:opacity-50" onClick={()=>{setBusy(true);void Promise.resolve(onUndo()).finally(()=>{setBusy(false);setVisible(false);});}}>Undo</button>}</div>;
}
