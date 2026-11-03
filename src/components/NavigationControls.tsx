'use client';
import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useState} from 'react';
import UploadChip from './UploadChip';
import SavedMealListeners from './SavedMealListeners';
import CorrectProductAction from './CorrectProductAction';
import BottomBar from '@/components/BottomBar';
import PlusMenu,{type PostEntry} from '@/components/PlusMenu';
import CaptureSheet from '@/components/CaptureSheet';
import IntakeBar from '@/components/IntakeBar';

/** The same navigation and entry surface is mounted on tabs and post detail. */
export default function NavigationControls() {
  const router=useRouter();
  const [initialFiles,setInitialFiles]=useState<File[]|undefined>();
  const [menuOpen,setMenuOpen]=useState(false);
  const [attachment,setAttachment]=useState<{postId:string;notEaten:boolean}|null>(null);
  const [entry,setEntry]=useState<PostEntry|null>(null);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  const closeEntry=useCallback(()=>{setEntry(null);setAttachment(null);setInitialFiles(undefined);},[]);
  const closeCapture=useCallback(()=>{closeEntry();router.push('/');},[closeEntry,router]);
  useEffect(()=>{
    const open=(event:Event)=>{const detail=(event as CustomEvent<{entry?:PostEntry;forPost?:string;notEaten?:boolean}>).detail;const value=detail?.entry;if(value&&['camera','text','drink','coffee'].includes(value)){setMenuOpen(false);setAttachment(value==='camera'&&typeof detail?.forPost==='string'?{postId:detail.forPost,notEaten:detail.notEaten===true}:null);setEntry(value);}};
    const close=()=>{setEntry(null);setAttachment(null);setMenuOpen(false);};
    window.addEventListener('open-entry',open);window.addEventListener('close-sheets',close);
    return()=>{window.removeEventListener('open-entry',open);window.removeEventListener('close-sheets',close);};
  },[]);
  useEffect(()=>{
    const deliver=(files:File[])=>{if(!files.length)return;if(entry==='camera'||entry==='text')window.dispatchEvent(new CustomEvent('capture-files',{detail:{files}}));else {setInitialFiles(files);setEntry('camera');}};
    const drop=(event:DragEvent)=>{if(!matchMedia('(min-width:1024px)').matches||!event.dataTransfer?.types.includes('Files'))return;event.preventDefault();deliver(Array.from(event.dataTransfer.files).filter(file=>file.type.startsWith('image/')));};
    const drag=(event:DragEvent)=>{if(matchMedia('(min-width:1024px)').matches&&event.dataTransfer?.types.includes('Files'))event.preventDefault();};
    const paste=(event:ClipboardEvent)=>{if(!matchMedia('(min-width:1024px)').matches)return;const files=Array.from(event.clipboardData?.files??[]).filter(file=>file.type.startsWith('image/'));if(files.length){event.preventDefault();deliver(files);}};
    window.addEventListener('drop',drop);window.addEventListener('dragover',drag);window.addEventListener('paste',paste);
    return()=>{window.removeEventListener('drop',drop);window.removeEventListener('dragover',drag);window.removeEventListener('paste',paste);};
  },[entry]);
  return <>
    <SavedMealListeners/><CorrectProductAction/><UploadChip/>
    <div className="desktop:hidden"><BottomBar onPlus={()=>setMenuOpen(value=>!value)} menuOpen={menuOpen}/>
    <PlusMenu open={menuOpen} onClose={closeMenu}/></div>
    {entry==='camera'||entry==='text'?<CaptureSheet initialFiles={initialFiles} key={`${entry}:${attachment?.postId??"new"}:${attachment?.notEaten??false}`} forPost={attachment?.postId} attachNotEaten={attachment?.notEaten} initialMode={entry==='camera'?'photo':'text'} onClose={closeCapture}/>:null}
    <IntakeBar onClose={closeEntry}/>
  </>;
}
