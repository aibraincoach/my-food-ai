'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {record} from '@/lib/diagnostics/recorder';
import {screenForPath} from '@/lib/diagnostics/schema';
let started=false;
export default function DiagnosticsRecorder(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!started){started=true;void record('page-load');}
    const visibility=()=>{void record('visibility',document.visibilityState==='hidden'?'hidden':'visible');};
    document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  useEffect(()=>{void record('screen',screenForPath(pathname));},[pathname]);
  return null;
}
