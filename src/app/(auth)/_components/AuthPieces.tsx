import {useTranslations} from 'next-intl';
import Link from 'next/link';
import type {ReactNode} from 'react';
import {Icon} from '@/components/ui/Icon';

export function AuthHeader({title,children,description,align='center'}:{title:string;children?:ReactNode;description?:string;align?:'center'|'start'}){
 return <header className={`flex flex-col ${align==='start'?'items-start gap-2':'items-center gap-screen-x'}`}>{children}<h1 className={align==='start'?"text-[28px] font-semibold leading-[1.15] tracking-[-0.6px]":"text-title"}>{title}</h1>{description?<p className="text-body">{description}</p>:null}</header>;
}
export function AuthBackRow({href,children}:{href:string;children:ReactNode}){
 const t=useTranslations('auth');
 return <nav aria-label={t('back')} className="flex min-h-tap items-center"><Link href={href} className="inline-flex min-h-tap items-center text-body"><Icon name="back" aria-hidden="true"/>{children}</Link></nav>;
}
export function AuthErrorBanner({children}:{children:ReactNode}){
 return <div role="alert" className="flex items-start gap-tooltip-y rounded-field bg-accent-halo px-tooltip-x py-sheet-top text-comment text-text">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-deep)" strokeWidth="1.8" strokeLinecap="round" className="mt-grid size-icon-thumb shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>
  <span>{children}</span>
 </div>;
}
