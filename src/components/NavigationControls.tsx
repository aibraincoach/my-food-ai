'use client';
import {useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useCallback,useEffect,useState} from 'react';
import UploadChip from './UploadChip';
import SavedMealListeners from './SavedMealListeners';
import CorrectProductAction from './CorrectProductAction';
import BottomBar from '@/components/BottomBar';
import PlusMenu,{type PostEntry} from '@/components/PlusMenu';
import type CaptureSheetComponent from '@/components/CaptureSheet';
import IntakeSheet from '@/components/IntakeSheet';
import {Sheet} from '@/components/ui/Sheet';

// Fetched after the page is up, not with it. public/sw.js keeps the file for offline opens.
const loadCaptureSheet=()=>import('@/components/CaptureSheet').then(module=>module.default);
/** The same navigation and entry surface is mounted on tabs and post detail. */
export default function NavigationControls() {
  const t=useTranslations('days'),nav=useTranslations('navigation');
  const router=useRouter();
  const [initialFiles,setInitialFiles]=useState<File[]|undefined>();
  const [menuOpen,setMenuOpen]=useState(false);
  const [attachment,setAttachment]=useState<{postId:string;notEaten:boolean}|null>(null);
  const [entry,setEntry]=useState<PostEntry|null>(null);
  const [loadFailed,setLoadFailed]=useState(false);
  const [loadAttempt,setLoadAttempt]=useState(0);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);
  useEffect(()=>{
    window.addEventListener('pagehide',closeMenu);
    return()=>window.removeEventListener('pagehide',closeMenu);
  },[closeMenu]);
  const closeEntry=useCallback(()=>{setEntry(null);setAttachment(null);setInitialFiles(undefined);setLoadFailed(false);},[]);
  const [CaptureSheet,setCaptureSheet]=useState<typeof CaptureSheetComponent|null>(null);
  const capture=entry==='camera'||entry==='text';
  useEffect(()=>{
    if(CaptureSheet)return;
    let live=true;
    const load=()=>{void loadCaptureSheet().then(component=>{if(live)setCaptureSheet(()=>component);},()=>{if(live&&capture)setLoadFailed(true);});};
    if(capture){load();return()=>{live=false;};}
    const timer=window.setTimeout(load,1500);
    return()=>{live=false;window.clearTimeout(timer);};
  },[CaptureSheet,capture,loadAttempt]);
  const closeCapture=useCallback(()=>{window.dispatchEvent(new Event('entry-closed'));closeEntry();router.push('/');},[closeEntry,router]);
  useEffect(()=>{
    const open=(event:Event)=>{const detail=(event as CustomEvent<{entry?:PostEntry;forPost?:string;notEaten?:boolean}>).detail;const value=detail?.entry;if(value&&['camera','text','drink','coffee'].includes(value)){setLoadFailed(false);setLoadAttempt(value=>value+1);setMenuOpen(false);setAttachment(value==='camera'&&typeof detail?.forPost==='string'?{postId:detail.forPost,notEaten:detail.notEaten===true}:null);setEntry(value);}};
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
    {capture&&CaptureSheet?<CaptureSheet initialFiles={initialFiles} key={`${entry}:${attachment?.postId??"new"}:${attachment?.notEaten??false}`} forPost={attachment?.postId} attachNotEaten={attachment?.notEaten} initialMode={entry==='camera'?'photo':'text'} onClose={closeCapture}/>:null}
    <Sheet confirmation open={capture&&!CaptureSheet} onClose={closeEntry} label={nav('newPost')}>
      {loadFailed?<><p role="alert">{t('composerOpenFailed')}</p><button className="min-h-tap text-accent" onClick={()=>{setLoadFailed(false);setLoadAttempt(value=>value+1);}}>{t('tryAgain')}</button><button className="min-h-tap text-accent" onClick={()=>window.location.reload()}>{t('reloadApp')}</button></>:<p role="status">{t('openingComposer')}</p>}
    </Sheet>
    <IntakeSheet onClose={closeEntry}/>
  </>;
}
