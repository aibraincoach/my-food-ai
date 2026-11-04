import Link from 'next/link';
import type {ReactNode} from 'react';
import Sidebar from '@/components/Sidebar';
import {font} from '@/lib/theme/font';
import {Icon} from '@/components/ui/Icon';
// The post page's frame, shared by the page and its loading state so the
// header never moves between the two.
export default function PostPageShell({children}:{children:ReactNode}) {
 return <><Sidebar/><main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-[calc(100px+env(safe-area-inset-bottom))] text-text desktop:ml-[calc(232px_+_(100%_-_232px_-_640px)/2)] desktop:max-w-[640px]`}>
  <header className="flex h-top-safe items-center justify-between px-inset"><Link href="/" className="flex h-tap w-[60px] items-center text-body" aria-label="Back to Feed"><Icon name="back" size={22}/>Feed</Link><h1 className="text-body font-semibold">Post</h1><span className="w-[60px]"/></header>
  {children}
 </main></>;
}
