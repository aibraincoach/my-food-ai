'use client';
import {useTranslations} from 'next-intl';
import {useEffect,useRef} from 'react';

export default function ShortcutsDialog({open,onClose}:{open:boolean;onClose:()=>void}){
 const t=useTranslations('shortcuts'),nav=useTranslations('navigation');
 const shortcuts=[['J / K',t('nextPreviousPost')],['Enter',t('openSelected')],['Esc',t('closeWindowClearSearch')],['N',nav('newPost')],['/',nav('search')],['D',nav('days')],['← →',t('slidesCalendar')],['↑ ↓',t('searchGridWeeks')]];
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;if(open)dialog?.showModal();else dialog?.close();},[open]);
 return <dialog ref={ref} aria-labelledby="shortcuts-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}} className="m-auto w-[480px] max-w-[calc(100vw-48px)] rounded-[10px] bg-surface p-6 text-text shadow-2xl backdrop:bg-scrim-32">
  <header className="mb-5 flex items-center justify-between"><h2 id="shortcuts-title" className="text-[20px] font-semibold">{t('keyboardShortcuts')}</h2><button aria-label={t('closeKeyboardShortcuts')} onClick={onClose} className="size-8 text-[24px]">×</button></header>
  <dl className="space-y-4">{shortcuts.map(([key,label])=><div key={key} className="flex items-center gap-5"><dt className="w-20 shrink-0"><kbd className="rounded-chip border border-line bg-white px-2 py-1 text-[12px]">{key}</kbd></dt><dd className="text-detail">{label}</dd></div>)}</dl>
 </dialog>;
}
