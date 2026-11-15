'use client';
import {useEffect,useRef} from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
// The mic for a typing field that has no post yet: spoken words are added to the field's text.
export default function VoiceButton({value,onChange,max,disabled=false}:{value:string;onChange:(next:string)=>void;max:number;disabled?:boolean}){
 const latest=useRef(value);
 useEffect(()=>{latest.current=value;},[value]);
 return <span className="flex shrink-0 flex-wrap items-center justify-end"><VoiceRecorder label="Speak" disabled={disabled} onActiveChange={()=>{}} onTranscript={text=>onChange(`${latest.current}${latest.current.trim()?' ':''}${text}`.slice(0,max))}/></span>;
}
