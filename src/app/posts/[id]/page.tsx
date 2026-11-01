import Link from 'next/link';
import {connection} from 'next/server';
import {cookies} from 'next/headers';
import {validZone} from '@/lib/posts/days';
import LocalTimeZone from '@/components/LocalTimeZone';
import {notFound,redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {getPostDetail,isUuid} from '@/lib/posts/items';
import {getPostCard} from '@/lib/posts/feed';
import {font} from '@/lib/theme/font';
import {Icon} from '@/components/ui/Icon';
import OutlineOverlay from '@/components/OutlineOverlay';
import Thread from '@/components/Thread';
import ServingsControl from '@/components/ServingsControl';
import NavigationControls from '@/components/NavigationControls';
import PostDetailHeader from '@/components/PostDetailHeader';
import type {PostPresentation} from '@/lib/posts/summary-line';
export const instant=false;
export default async function PostDetail({params}:{params:Promise<{id:string}>}) {
 await connection();const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/sign-in');
 const {id}=await params;if(!isUuid(id))notFound();
 const cookieZone=(await cookies()).get("time-zone")?.value;const zone=validZone(cookieZone);
 const [detail,card]=await Promise.all([getPostDetail(supabase,id,zone),getPostCard(supabase,id,zone)]);if(!detail)notFound();
 const row=card as PostPresentation|null;
 return <main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface pb-[calc(100px+env(safe-area-inset-bottom))] text-text`}>
  <header className="flex h-top-safe items-center justify-between px-inset"><Link href="/" className="flex h-tap w-[60px] items-center text-body" aria-label="Back to Feed"><Icon name="back" size={22}/>Feed</Link><h1 className="text-body font-semibold">Post</h1><span className="w-[60px]"/></header>
  <LocalTimeZone zone={zone} explicit={Boolean(cookieZone)}/>
  <PostDetailHeader readOnly={detail.isDrink} status={detail.post.status} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} gtin={row?.gtin} saved={Boolean(row?.saved_meal_id)}/>
  <OutlineOverlay key={id} initialized={detail.post.analysis_initialized_at!=null} readOnly={detail.isDrink} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} cardData={detail.cardData} initialDrink={detail.drink} modelCommentId={card?.modelCommentId??null} fingerprint={card?.analysisFingerprint??null} saved={Boolean(row?.saved_meal_id)}>
   {detail.post.analysis_initialized_at!=null&&!detail.isDrink?<ServingsControl key={`${id}:${detail.post.servings}`} postId={id} servings={Number(detail.post.servings)}/>:null}
  </OutlineOverlay>
  <Thread sourcePostId={detail.post.source_post_id} key={id} postId={id} readOnly={detail.isDrink}/>
  <NavigationControls/>
 </main>;
}
