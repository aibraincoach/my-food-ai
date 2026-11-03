import {connection} from 'next/server';
import {cookies} from 'next/headers';
import {validZone} from '@/lib/posts/days';
import LocalTimeZone from '@/components/LocalTimeZone';
import {notFound,redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {getPostDetail,isUuid} from '@/lib/posts/items';
import {getPostCard} from '@/lib/posts/feed';
import OutlineOverlay from '@/components/OutlineOverlay';
import Thread from '@/components/Thread';
import ServingsControl from '@/components/ServingsControl';
import PostDetailHeader from '@/components/PostDetailHeader';
import type {PostPresentation} from '@/lib/posts/summary-line';
export default async function PostDetail({id}:{id:string}) {
 await connection();const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/sign-in');
 if(!isUuid(id))notFound();
 const cookieZone=(await cookies()).get("time-zone")?.value;const zone=validZone(cookieZone);
 const [detail,card]=await Promise.all([getPostDetail(supabase,id,zone),getPostCard(supabase,id,zone)]);if(!detail)notFound();
 const row=card as PostPresentation|null;
 return <>
  <LocalTimeZone zone={zone} explicit={Boolean(cookieZone)}/>
  <PostDetailHeader post={card??undefined} readOnly={detail.isDrink} status={detail.post.status} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} gtin={row?.gtin} saved={Boolean(row?.saved_meal_id)}/>
  <OutlineOverlay key={id} initialized={detail.post.analysis_initialized_at!=null} readOnly={detail.isDrink} postId={id} caption={detail.post.caption} eatenAt={detail.post.eaten_at} status={detail.post.status} photo={detail.photo} items={detail.items} cardData={detail.cardData} initialDrink={detail.drink} modelCommentId={card?.modelCommentId??null} fingerprint={card?.analysisFingerprint??null} saved={Boolean(row?.saved_meal_id)}>
   {detail.identification?.model?<p className="px-inset text-[12px] text-muted">{detail.identification.host==='baseten'?`Identified by Muse Spark Open (${detail.identification.model}) · Built with Muse Spark Open`:'Identified by Muse Spark 1.3'}</p>:null}
   {detail.post.analysis_initialized_at!=null&&!detail.isDrink?<ServingsControl key={`${id}:${detail.post.servings}`} postId={id} servings={Number(detail.post.servings)}/>:null}
  </OutlineOverlay>
  <Thread sourcePostId={detail.post.source_post_id} key={id} postId={id} readOnly={detail.isDrink}/>
 </>;
}
