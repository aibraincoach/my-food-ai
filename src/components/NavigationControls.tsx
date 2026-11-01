'use client';
import {useCallback,useEffect,useState} from 'react';
import SavedMealListeners from './SavedMealListeners';
import CorrectProductAction from './CorrectProductAction';
import BottomBar from '@/components/BottomBar';
import PlusMenu,{type PostEntry} from '@/components/PlusMenu';
import CaptureSheet from '@/components/CaptureSheet';
import IntakeBar from '@/components/IntakeBar';
import {Sheet} from '@/components/ui/Sheet';

/** The same navigation and entry surface is mounted on tabs and post detail. */
export default function NavigationControls() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [attachment,setAttachment]=useState<{postId:string;notEaten:boolean}|null>(null);
  const [entry,setEntry]=useState<PostEntry|null>(null);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  const closeEntry=useCallback(()=>{setEntry(null);setAttachment(null);},[]);
  useEffect(()=>{
    const open=(event:Event)=>{const detail=(event as CustomEvent<{entry?:PostEntry;forPost?:string;notEaten?:boolean}>).detail;const value=detail?.entry;if(value&&['camera','text','drink','coffee'].includes(value)){setMenuOpen(false);setAttachment(value==='camera'&&typeof detail?.forPost==='string'?{postId:detail.forPost,notEaten:detail.notEaten===true}:null);setEntry(value);}};
    const close=()=>{setEntry(null);setAttachment(null);setMenuOpen(false);};
    window.addEventListener('open-entry',open);window.addEventListener('close-sheets',close);
    return()=>{window.removeEventListener('open-entry',open);window.removeEventListener('close-sheets',close);};
  },[]);
  return <>
    <SavedMealListeners/><CorrectProductAction/>
    <BottomBar onPlus={()=>setMenuOpen(value=>!value)} menuOpen={menuOpen}/>
    <PlusMenu open={menuOpen} onClose={closeMenu}/>
    {entry==='camera'||entry==='text'?<CaptureSheet key={`${entry}:${attachment?.postId??"new"}:${attachment?.notEaten??false}`} forPost={attachment?.postId} attachNotEaten={attachment?.notEaten} initialMode={entry==='camera'?'photo':'text'} onClose={closeEntry}/>:null}
    {entry==='drink'||entry==='coffee'?<Sheet open onClose={closeEntry} label="Drink"><IntakeBar key={entry} initialKind={entry==='coffee'?'caffeine':'water'} embedded onClose={closeEntry}/></Sheet>:null}
  </>;
}
