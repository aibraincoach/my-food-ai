'use client';
import {useEffect,useRef,useState} from 'react';
import {Icon} from '@/components/ui/Icon';
import {encodeWav} from '@/lib/audio/wav-encoder';
type Capture={context:AudioContext;stream:MediaStream;node:AudioWorkletNode;chunks:Float32Array[];timer:ReturnType<typeof setTimeout>|null};
export default function VoiceRecorder({postId,disabled,onTranscript,onActiveChange}:{postId:string;disabled:boolean;onTranscript:(text:string)=>void;onActiveChange:(active:boolean)=>void}){
 const [state,setState]=useState<'idle'|'starting'|'recording'|'sending'>('idle');const [error,setError]=useState('');
 const capture=useRef<Capture|null>(null);const alive=useRef(true);const locked=useRef(false);const abort=useRef<AbortController|null>(null);
 const cleanup=(record:Capture)=>{if(record.timer)clearTimeout(record.timer);record.stream.getTracks().forEach(t=>t.stop());record.node.disconnect();void record.context.close();};
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;abort.current?.abort();if(capture.current){cleanup(capture.current);capture.current=null;}};},[]);
 const stop=()=>{
  const record=capture.current;if(!record||locked.current)return;locked.current=true;setState('sending');
  if(record.timer)clearTimeout(record.timer);record.stream.getTracks().forEach(t=>t.stop());
  record.node.port.onmessage=async({data})=>{
   if(data.samples)record.chunks.push(data.samples);if(!data.stopped)return;
   capture.current=null;cleanup(record);
   if(!alive.current){locked.current=false;return;}
   try{
    const wav=encodeWav(record.chunks,record.context.sampleRate);if(wav.byteLength<=44)throw new Error('No audio was recorded.');
    const form=new FormData();form.append('audio',new Blob([wav],{type:'audio/wav'}),'correction.wav');form.append('draftId',crypto.randomUUID());form.append('postId',postId);
    const controller=new AbortController();abort.current=controller;
    const response=await fetch('/api/transcribe',{method:'POST',body:form,signal:controller.signal});const body=await response.json();
    if(!response.ok)throw new Error(body.error??'Transcription could not be completed.');
    if(alive.current)onTranscript(body.transcript);
   }catch(cause){if(alive.current)setError(cause instanceof Error?cause.message:'Transcription could not be completed.');}
   finally{locked.current=false;if(alive.current){setState('idle');onActiveChange(false);}}
  };
  record.node.port.postMessage('stop');
 };
 const begin=async()=>{
  if(locked.current||disabled)return;locked.current=true;onActiveChange(true);setState('starting');setError('');let stream:MediaStream|null=null;let context:AudioContext|null=null;
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.AudioContext)throw new Error('Voice recording is unavailable in this browser.');
   stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true}});
   if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}
   context=new AudioContext();await context.audioWorklet.addModule('/audio/recorder.js');await context.resume();
   if(!alive.current){stream.getTracks().forEach(t=>t.stop());await context.close();return;}
   const node=new AudioWorkletNode(context,'meal-recorder');const record:Capture={context,stream,node,chunks:[],timer:null};
   node.port.onmessage=({data})=>{if(data.samples)record.chunks.push(data.samples);};
   const source=context.createMediaStreamSource(stream);source.connect(node);node.connect(context.destination);
   capture.current=record;record.timer=setTimeout(stop,600000);setState('recording');
  }catch(cause){stream?.getTracks().forEach(t=>t.stop());if(context)void context.close();if(alive.current){setError(cause instanceof Error?cause.message:'Microphone could not be opened.');setState('idle');onActiveChange(false);}}
  finally{locked.current=false;}
 };
 return <><button type="button" disabled={disabled||state==='starting'||state==='sending'} aria-label={state==='recording'?'Stop recording':'Record a correction'} aria-pressed={state==='recording'} onClick={()=>{if(state==='recording')stop();else void begin();}} className={`flex min-h-tap min-w-tap items-center justify-center ${state==='recording'?'rounded-circle bg-text text-surface':'text-muted'}`}><Icon name="mic"/></button>{state==='recording'||state==='sending'?<span role="status" className="w-full text-meta text-muted">{state==='recording'?'Recording… tap the microphone to stop.':'Transcribing…'}</span>:null}{error?<p role="alert" className="w-full text-meta text-muted">{error}</p>:null}</>;
}
