import Link from 'next/link';
import type {ReactNode} from 'react';
import {Icon} from '@/components/ui/Icon';

export function AuthHeader({title,children}:{title:string;children?:ReactNode}){
 return <header className="flex flex-col items-center gap-screen-x">{children}<h1 className="text-title">{title}</h1></header>;
}
export function AuthBackRow({href,children}:{href:string;children:ReactNode}){
 return <nav aria-label="Back" className="flex min-h-tap items-center"><Link href={href} className="inline-flex min-h-tap items-center text-body"><Icon name="back" aria-hidden="true"/>{children}</Link></nav>;
}
export function AuthErrorBanner({children}:{children:ReactNode}){
 return <div role="alert" className="flex items-start gap-tooltip-y rounded-field bg-accent-halo px-tooltip-x py-sheet-top text-comment text-text">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-deep)" strokeWidth="1.8" strokeLinecap="round" className="mt-grid size-icon-thumb shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>
  <span>{children}</span>
 </div>;
}
