import Link from 'next/link';
import PostDetail from '@/components/PostDetail';
import Sidebar from '@/components/Sidebar';
import NavigationControls from '@/components/NavigationControls';
import {font} from '@/lib/theme/font';
import {Icon} from '@/components/ui/Icon';
export const instant=false;
export default async function PostPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <><Sidebar/><main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-[calc(100px+env(safe-area-inset-bottom))] text-text desktop:ml-[calc(232px_+_(100%_-_232px_-_640px)/2)] desktop:max-w-[640px]`}>
  <header className="flex h-top-safe items-center justify-between px-inset"><Link href="/" className="flex h-tap w-[60px] items-center text-body" aria-label="Back to Feed"><Icon name="back" size={22}/>Feed</Link><h1 className="text-body font-semibold">Post</h1><span className="w-[60px]"/></header>
  <PostDetail id={id}/><NavigationControls/>
 </main></>;
}
