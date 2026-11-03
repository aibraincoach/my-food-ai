import test from 'node:test';
import assert from 'node:assert/strict';
import {getPostCard} from '../src/lib/posts/feed.ts';
import {getCurrentItems} from '../src/lib/nutrition/totals.ts';
test('feed and detail normalize the same legacy branded row',async()=>{
 const item={id:'item',name:'Food',portion_grams:50,portion_text:'50g',source:'model'};
 const row={post_item_id:'item',calories:333,protein_g:16,source_ref:'123',micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200}]};
 const client={rpc:()=>({abortSignal:async()=>({data:{modelCommentId:null,fingerprint:'fixture'},error:null})}),from(table){
  let ranged=false;
  const data=table==='posts'?{id:'post',status:'ready',eaten_at:'2026-10-27T12:00:00Z'}:['post_media','saved_meals'].includes(table)?null:table==='current_post_items'?[item]:[row];
  const q={select(columns){if(table==='item_nutrition')assert.ok(columns.includes('micronutrients')&&columns.includes('source_ref'));return q;},is(){return q;},or(filter){assert.equal(filter,'needs_input.is.null,status.eq.failed');return q;},eq(){return q;},order(){return q;},gte(){return q;},lte(){return q;},lt(){return q;},range(){ranged=true;return q;},limit(){return q;},in(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data:ranged?[]:data,error:null}).then(resolve);}};return q;
 }};
 const card=await getPostCard(client,'post');const detail=await getCurrentItems(client,'post');
 assert.equal(card.items[0].calories,100);assert.equal(card.items[0].calories,detail[0].calories);
 assert.equal(card.items[0].protein_g,null);
});

test('batch nutrition preserves post ownership, legacy scaling and remainder fallback',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {getCurrentItemsForPosts}=await import('../src/lib/nutrition/totals.ts');
 const calls=[];const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input));calls.push(url);
  if(url.pathname.endsWith('/post_items'))return Response.json([{id:'parent',post_id:'post-a',portion_grams:100,item_nutrition:{post_item_id:'parent',calories:200,micronutrients:[]}}]);
  return Response.json([{id:'a',post_id:'post-a',name:'Food A',portion_grams:50,not_eaten_grams:50,supersedes:'parent',item_nutrition:{post_item_id:'a',calories:333,micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200}]}},{id:'b',post_id:'post-b',name:'Food B',portion_grams:20,item_nutrition:null}]);
 }}});
 const result=await getCurrentItemsForPosts(db,['post-a','post-b']);
 assert.equal('item_nutrition' in result.get('post-a')[0],false,'embedded nutrition is not duplicated into the feed payload');assert.equal('post_id' in result.get('post-a')[0],false);
 assert.equal(result.get('post-a')[0].calories,100);assert.equal(result.get('post-a')[0].not_eaten_calories,100);
 assert.equal(result.get('post-b')[0].calories,null);assert.equal(result.get('post-b')[0].name,'Food B');
 assert.equal(calls.length,2);assert.equal(calls[1].searchParams.get('post_id'),'in.(post-a,post-b)');
});


test('only a matching analysis revision may retain previously read nutrition',async()=>{
 const {retainCompleteItems}=await import('../src/lib/posts/feed.ts');
 const previous={id:'meal',status:'ready',analysisFingerprint:'revision-a',items:[{id:'item',name:'Food',calories:100}]};
 const unavailable={...previous,items:[],itemsUnavailable:true};
 assert.deepEqual(retainCompleteItems(previous,unavailable).items,previous.items);
 assert.equal(retainCompleteItems(previous,unavailable).itemsUnavailable,true,'retained nutrition still exposes the failed read and keeps retrying');
 assert.deepEqual(retainCompleteItems(previous,{...unavailable,analysisFingerprint:'revision-b'}).items,[],'a changed revision cannot borrow stale totals');
 assert.deepEqual(retainCompleteItems(previous,{...unavailable,analysisFingerprint:null}).items,[]);
 assert.deepEqual(retainCompleteItems(previous,{...unavailable,itemsUnavailable:false}).items,[],'a successful empty read is genuine, not overwritten by history');
});

test('transient auxiliary failures retain known fields and recovery still applies genuine removals',async()=>{
 const {retainCompleteItems,hasUnavailableFields}=await import('../src/lib/posts/feed.ts');
 const prior={id:'meal',eaten_at:'2026-11-03T00:00:00Z',day:'2026-11-03',status:'ready',items:[],slides:[{id:'photo',url:'https://fixture.invalid/known',kind:'photo'}],photoUrl:'https://fixture.invalid/known',saved_meal_id:'saved',kind:'meal',dayHydration:{totalMl:100}};
 const incomplete={...prior,slides:[],photoUrl:null,saved_meal_id:null,dayHydration:undefined,mediaUnavailable:true,savedStateUnavailable:true,hydrationUnavailable:true};
 const kept=retainCompleteItems(prior,incomplete);
 assert.equal(kept.slides.length,1);assert.equal(kept.saved_meal_id,'saved');assert.equal(kept.dayHydration.totalMl,100);assert.equal(hasUnavailableFields(kept),true);
 const changedMedia=retainCompleteItems(prior,{...incomplete,expectedMediaIds:['new-photo']});
 assert.deepEqual(changedMedia.slides,[],'known removal must not revive an old image even when another signing read fails');
 const recovered=retainCompleteItems(kept,{...prior,slides:[],photoUrl:null,saved_meal_id:null,dayHydration:{totalMl:200},mediaUnavailable:false,savedStateUnavailable:false,hydrationUnavailable:false});
 assert.deepEqual(recovered.slides,[]);assert.equal(recovered.saved_meal_id,null);assert.equal(recovered.dayHydration.totalMl,200);assert.equal(hasUnavailableFields(recovered),false);
});

test('fast first-photo read and full snapshot share the same owner-scoped capability',async()=>{
 const {createClient}=await import('@supabase/supabase-js');const {getFirstFeedPhoto,toFeedPosts}=await import('../src/lib/posts/feed.ts');
 const post={id:'first-photo-post',user_id:'first-owner',caption:'Food',eaten_at:'2026-11-03T00:00:00Z',created_at:'2026-11-03T00:00:00Z',status:'queued'};
 const media={id:'first-photo',post_id:post.id,storage_path:'first-owner/first-photo-post/photo.jpg',kind:'photo',position:0};let single=0;
 const db=createClient('https://photo-fixture.invalid','fixture',{global:{fetch:async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.pathname.endsWith('/posts')){assert.equal(url.searchParams.get('user_id'),'eq.first-owner');return Response.json({...post,post_media:[media]});}
  if(url.pathname.endsWith('/post_media'))return Response.json([media]);
  if(url.pathname.endsWith('/saved_meals'))return Response.json([]);
  if(url.pathname.endsWith('/object/sign/media'))return Response.json([{path:'first-owner/first-photo-post/photo.feed.jpg',signedURL:'/object/sign/media/first-owner/first-photo-post/photo.feed.jpg?token=batch'}]);
  if(url.pathname.endsWith('/photo.feed.jpg')){single++;return Response.json({signedURL:'/object/sign/media/first-owner/first-photo-post/photo.feed.jpg?token=first'});}
  throw Error('Unexpected fixture request');
 }}});
 const first=await getFirstFeedPhoto(db,'first-owner');const full=await toFeedPosts(db,[post]);
 assert.equal(first.id,post.id);assert.equal(first.photoUrl,full[0].photoUrl);assert.equal(single,1,'the first-photo promise is reused rather than replacing its signing token');
});


test('all feed and refreshed photos use small owner URLs while only card PNGs are signed',async()=>{
 const {createClient}=await import('@supabase/supabase-js');const {toFeedPosts}=await import('../src/lib/posts/feed.ts');
 const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 const owner=uuid(99),posts=[1,2].map(n=>({id:uuid(n),user_id:owner,caption:'Food',eaten_at:'2026-11-03T00:00:00Z',created_at:'2026-11-03T00:00:00Z',status:'queued'}));
 const media=[{id:uuid(10),post_id:posts[0].id,kind:'photo',position:0},{id:uuid(11),post_id:posts[0].id,kind:'photo',position:1},{id:uuid(12),post_id:posts[0].id,kind:'card',position:2},{id:uuid(13),post_id:posts[1].id,kind:'photo',position:0}].map(m=>({...m,storage_path:`${owner}/${m.post_id}/${m.kind==='card'?'card.png':m.id+'.jpg'}`,not_eaten:false}));
 const signed=[];
 const db=createClient('https://all-photos.invalid','fixture',{global:{fetch:async(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.pathname.endsWith('/posts'))return Response.json(posts[0]);
  if(url.pathname.endsWith('/post_media'))return Response.json(url.searchParams.get('post_id')?.startsWith('eq.')?media.filter(m=>m.post_id===posts[0].id):media);
  if(url.pathname.endsWith('/saved_meals'))return Response.json([]);
  if(url.pathname.endsWith('/object/sign/media')){const body=JSON.parse(init.body);signed.push(...body.paths);return Response.json(body.paths.map(path=>({path,signedURL:'/object/sign/media/'+path+'?token=fixture'})));}
  if(url.pathname.endsWith('/card.png'))return Response.json({signedURL:'/object/sign/media/'+media[2].storage_path+'?token=fixture'});
  throw Error('Unexpected fixture request '+url.pathname);
 }}});
 const batch=await toFeedPosts(db,posts);
 for(const post of batch)for(const slide of post.slides.filter(s=>s.kind==='photo'))assert.equal(slide.url,`/api/media/feed/${owner}/${post.id}/${slide.id}/v1.webp`);
 assert.deepEqual(signed,[media[2].storage_path],'photo signing is eliminated, not duplicated beside small URLs');
 const refreshed=await getPostCard(db,posts[0].id);
 assert.deepEqual(refreshed.slides.filter(s=>s.kind==='photo').map(s=>s.url),batch[0].slides.filter(s=>s.kind==='photo').map(s=>s.url),'realtime refresh cannot restore the old large Storage paths');
});
