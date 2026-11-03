import type {FeedPost} from './feed';
import {mergeFeedPosts} from './feed-order';
import {feedCacheGeneration,readFeedCache,writeFeedCache,subscribeFeedCache} from './feed-cache';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const managed=new Map<string,number>();
export function claimFeedCacheEvents(userId:string):()=>void {
 managed.set(userId,(managed.get(userId)??0)+1);
 return()=>{const count=(managed.get(userId)??1)-1;if(count)managed.set(userId,count);else managed.delete(userId);};
}

// Installed once at the root, so mutations on detail/Profile can invalidate
// last-feed data before navigating Home. No Auth, database or network request.
export function installFeedCacheMutationListener(events:EventTarget=window,activeUserId:()=>string|null=()=>null):()=>void {
 type Known={userId:string;posts:FeedPost[];post:FeedPost};
 const removed=new Map<string,{userId:string;post:FeedPost;epoch:string}>();
 const captions=new Map<string,string>();
 const accepted=new Set<string>();
 let epoch=feedCacheGeneration();
 const reset=()=>{const current=feedCacheGeneration();if(current!==epoch){epoch=current;removed.clear();captions.clear();accepted.clear();}};
 const detachReset=subscribeFeedCache(reset);
 const key=(owner:string,id:string)=>owner+'|'+id;
 const known=(id:string,requested?:unknown):Known|null=>{
  if(!UUID.test(id)||requested!==undefined&&(typeof requested!=='string'||!UUID.test(requested)))return null;
  const active=activeUserId();
  if(active&&requested!==undefined&&active!==requested)return null;
  try{
   const matches:Known[]=[];
   for(let index=0;index<localStorage.length;index++){
    const name=localStorage.key(index);if(!name?.startsWith('mfa-feed:'))continue;
    const userId=name.slice('mfa-feed:'.length);
    if(!UUID.test(userId)||active&&userId!==active||requested!==undefined&&userId!==requested)continue;
    const snapshot=readFeedCache(userId);const post=snapshot?.posts.find(post=>post.id===id);
    if(post)matches.push({userId,posts:snapshot!.posts,post});
   }
   // During SDK bootstrap an ambiguous ID cannot select another owner's cache.
   return matches.length===1?matches[0]:null;
  }catch{return null;}
 };
 const write=(row:Known,post:FeedPost)=>writeFeedCache(row.userId,{posts:row.posts.map(old=>old.id===post.id?post:old),savedAt:Date.now()});
 const invalidate=(post:FeedPost,mediaId?:string):FeedPost=>{
  const slides=post.slides.filter(slide=>slide.kind!=='card'&&(!mediaId||slide.id!==mediaId));
  return {...post,items:[],itemsUnavailable:true,analysisFingerprint:null,modelCommentId:null,slides,photoUrl:slides[0]?.url??null};
 };
 const receive=(event:Event)=>{
  reset();
  const data=(event as CustomEvent<Record<string,unknown>>).detail;
  if(!data||typeof data!=='object')return;
  const id=typeof data.id==='string'?data.id:typeof data.postId==='string'?data.postId:null;
  if(!id||!UUID.test(id))return;
  if(event.type==='post-restore'){
   const active=activeUserId();
   for(const [entryKey,snapshot] of removed){
    if(snapshot.post.id!==id||snapshot.epoch!==epoch||managed.has(snapshot.userId)||active&&active!==snapshot.userId||data.userId!==undefined&&data.userId!==snapshot.userId)continue;
    const current=readFeedCache(snapshot.userId);
    if(current){writeFeedCache(snapshot.userId,{posts:mergeFeedPosts(current.posts,[snapshot.post]),savedAt:Date.now()});removed.delete(entryKey);}
   }
   return;
  }
  const row=known(id,data.userId);if(!row)return;
  const rowKey=key(row.userId,id);
  // Capture rollback/proposals before the live Feed's passive listeners run,
  // but let that Feed own writes while mounted. Navigation during a pending
  // mutation can then hand the rollback to this root without losing history.
  if(managed.has(row.userId)){
   if(['post-deleted','post-unavailable','post-answer-resume'].includes(event.type)){
    removed.set(rowKey,{userId:row.userId,post:row.post,epoch});
    while(removed.size>128)removed.delete(removed.keys().next().value!);
   }
   if(event.type==='post-caption'){
    if(data.error)captions.delete(rowKey);
    else if(typeof data.caption==='string'&&data.caption.length<=2000&&!data.caption.includes('\0'))captions.set(rowKey,data.caption);
   }
   if(event.type==='post-updated'){captions.delete(rowKey);accepted.delete(rowKey);}
   return;
  }

  if(['post-deleted','post-unavailable','post-answer-resume'].includes(event.type)){
   removed.set(rowKey,{userId:row.userId,post:row.post,epoch});
   while(removed.size>128)removed.delete(removed.keys().next().value!);
   writeFeedCache(row.userId,{posts:row.posts.filter(post=>post.id!==id),savedAt:Date.now()});return;
  }
  if(event.type==='post-caption'){
   if(data.error){captions.delete(rowKey);return;}
   if(typeof data.caption==='string'&&data.caption.length<=2000&&!data.caption.includes('\0'))captions.set(rowKey,data.caption);
   return;
  }
  if(event.type==='save-meal-result'){
   if(data.failed)return;
   if(data.savedMealId!==null&&(typeof data.savedMealId!=='string'||!UUID.test(data.savedMealId)))return;
   write(row,{...row.post,saved_meal_id:data.savedMealId as string|null});accepted.add(rowKey);return;
  }
  if(event.type==='post-updated'){
   const caption=captions.get(rowKey);
   if(caption!==undefined){captions.delete(rowKey);write(row,{...row.post,caption});return;}
   if(accepted.delete(rowKey))return;
   write(row,invalidate(row.post));return;
  }
  if(event.type==='media-removed'){
   if(typeof data.mediaId!=='string'||!UUID.test(data.mediaId)||!row.post.slides.some(slide=>slide.id===data.mediaId))return;
   write(row,invalidate(row.post,data.mediaId));return;
  }
  if(event.type==='correction-reverted')write(row,invalidate(row.post));
 };
 const names=['post-deleted','post-unavailable','post-answer-resume','post-restore','post-caption','save-meal-result','post-updated','media-removed','correction-reverted'];
 for(const name of names)events.addEventListener(name,receive);
 return()=>{for(const name of names)events.removeEventListener(name,receive);detachReset();};
}
