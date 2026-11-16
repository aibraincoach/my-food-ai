'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
// The ref closes the same-event gap before React commits the disabled button.
export function useVoiceActivity(){
 const [active,setActive]=useState(false),activeRef=useRef(false);
 const onActiveChange=useCallback((next:boolean)=>{activeRef.current=next;setActive(next);},[]);
 return {active,activeRef,onActiveChange};
}
// The mic for a typing field that has no post yet: spoken words are added to the field's text.
export default function VoiceButton({value,onChange,max,onActiveChange,onError,disabled=false,className="flex shrink-0 flex-wrap items-center justify-end"}:{value:string;onChange:(next:string)=>void;max:number;onActiveChange?:(active:boolean)=>void;onError?:(message:string)=>void;disabled?:boolean;className?:string}){
 const latest=useRef(value);
 useEffect(()=>{latest.current=value;},[value]);
 return <span className={className}><VoiceRecorder label="Speak" disabled={disabled} onError={onError} onActiveChange={onActiveChange??(()=>{})} onTranscript={text=>onChange(`${latest.current}${latest.current.trim()?' ':''}${text}`.slice(0,max))}/></span>;
}
