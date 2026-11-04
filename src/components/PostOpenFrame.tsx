'use client';
import {imageIdentity} from '@/lib/media/retained-image';
import {feedPhotoSrcSet} from '@/lib/posts/feed-photo-url';
import {useState} from 'react';
import {desktopPhotoVars,photoBoxStyle} from '@/lib/media/photo-box';
import {recallPost} from '@/lib/posts/open-frame';
import type {FeedPost} from '@/lib/posts/feed';
import PostDetailSkeleton from '@/components/PostDetailSkeleton';
import PostActions from '@/components/PostActions';
import PostCaption from '@/components/PostCaption';
import {usePostHandle} from '@/components/PostHandle';
import {Shimmer} from '@/components/ui/Shimmer';

// Design 7b: the frame that shows in the same paint as the tap. It uses the
// feed's copy of the post, so nothing downloads again; the item rows shimmer
// until the detail replaces this frame without moving the photo.
export default function PostOpenFrame({id,desktopModal=false}:{id:string;desktopModal?:boolean}) {
 const post=recallPost(id);
 if(!post)return <PostDetailSkeleton/>;
 return desktopModal?<DesktopFrame post={post}/>:<PhoneFrame post={post}/>;
}

function Header({post,height}:{post:FeedPost;height:string}) {
 const handle=usePostHandle((post as {handle?:string}).handle);
 return <div className={`flex ${height} items-center gap-[10px] px-inset`}><span className="flex size-8 shrink-0 items-center justify-center rounded-circle bg-text text-avatar text-surface">{handle.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-handle">{handle}</span></div>;
}

function Photo({post,desktop=false}:{post:FeedPost;desktop?:boolean}) {
 const slide=post.slides.find(slide=>slide.kind!=='card');
 const url=slide?.url??post.photoUrl;
 const [failedSharp,setFailedSharp]=useState<string|null>(null);
 if(!url)return <div className="aspect-square w-full bg-card"/>;
 // eslint-disable-next-line @next/next/no-img-element
 return <div className="relative w-full overflow-hidden bg-card" style={desktop?undefined:photoBoxStyle(slide)}><img src={url} srcSet={failedSharp!==imageIdentity(url)?feedPhotoSrcSet(url):undefined} onError={()=>setFailedSharp(imageIdentity(url))} crossOrigin="anonymous" alt={post.caption||'Meal photo'} draggable={false} className="h-full w-full object-contain"/></div>;
}

function Rows() {
 return <div className="flex flex-col gap-3 px-inset pt-3" role="status" aria-label="Loading meal"><Shimmer width="70%"/><Shimmer width="45%"/><Shimmer width="60%"/></div>;
}

function PhoneFrame({post}:{post:FeedPost}) {
 const handle=usePostHandle((post as {handle?:string}).handle);
 return <div className="flex flex-col pb-6" data-post-open-frame>
  <Header post={post} height="h-[52px]"/>
  <Photo post={post}/>
  <PostActions detail post={post} postId={post.id} modelCommentId={post.modelCommentId??null} fingerprint={post.analysisFingerprint??null} saved={Boolean(post.saved_meal_id)}/>
  <div className="px-inset"><PostCaption postId={post.id} handle={handle} caption={post.caption}/></div>
  <Rows/>
 </div>;
}

function DesktopFrame({post}:{post:FeedPost}) {
 const handle=usePostHandle((post as {handle?:string}).handle);
 return <div className="desktop-post-content" data-post-open-frame style={desktopPhotoVars(post.slides.find(slide=>slide.kind!=='card'))}>
  <Photo post={post} desktop/>
  <div className="desktop-post-record"><Header post={post} height="h-14"/><div className="desktop-post-scroll"><div className="px-inset"><PostCaption postId={post.id} handle={handle} caption={post.caption}/></div><Rows/></div></div>
 </div>;
}
