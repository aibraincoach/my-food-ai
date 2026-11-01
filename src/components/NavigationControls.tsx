'use client';
import {useCallback,useEffect,useState} from 'react';
import BottomBar from '@/components/BottomBar';
import PlusMenu,{type PostEntry} from '@/components/PlusMenu';
import CaptureSheet from '@/components/CaptureSheet';
import IntakeBar from '@/components/IntakeBar';
import {Sheet} from '@/components/ui/Sheet';

/** The same navigation and entry surface is mounted on tabs and post detail. */
export default function NavigationControls() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [entry,setEntry]=useState<PostEntry|null>(null);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  const closeEntry=useCallback(()=>setEntry(null),[]);
  useEffect(()=>{
    const open=(event:Event)=>{const value=(event as CustomEvent<{entry?:PostEntry}>).detail?.entry;if(value&&['camera','text','drink','coffee'].includes(value)){setMenuOpen(false);setEntry(value);}};
    const close=()=>{setEntry(null);setMenuOpen(false);};
    window.addEventListener('open-entry',open);window.addEventListener('close-sheets',close);
    return()=>{window.removeEventListener('open-entry',open);window.removeEventListener('close-sheets',close);};
  },[]);
  return <>
    <BottomBar onPlus={()=>setMenuOpen(value=>!value)} menuOpen={menuOpen}/>
    <PlusMenu open={menuOpen} onClose={closeMenu}/>
    {entry==='camera'||entry==='text'?<CaptureSheet key={entry} initialMode={entry==='camera'?'photo':'text'} onClose={closeEntry}/>:null}
    {entry==='drink'||entry==='coffee'?<Sheet open onClose={closeEntry} label="Drink"><IntakeBar key={entry} initialKind={entry==='coffee'?'caffeine':'water'} embedded onClose={closeEntry}/></Sheet>:null}
  </>;
}
