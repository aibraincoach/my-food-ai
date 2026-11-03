import test from 'node:test';
import assert from 'node:assert/strict';
import {getPostCard} from '../src/lib/posts/feed.ts';
import {getCurrentItems} from '../src/lib/nutrition/totals.ts';
test('feed and detail normalize the same legacy branded row',async()=>{
 const item={id:'item',name:'Food',portion_grams:50,portion_text:'50g',source:'model'};
 const row={post_item_id:'item',calories:333,protein_g:16,source_ref:'123',micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200}]};
 const client={rpc:async()=>({data:{modelCommentId:null,fingerprint:'fixture'},error:null}),from(table){
  let ranged=false;
  const data=table==='posts'?{id:'post',status:'ready',eaten_at:'2026-10-27T12:00:00Z'}:['post_media','saved_meals'].includes(table)?null:table==='current_post_items'?[item]:[row];
  const q={select(columns){if(table==='item_nutrition')assert.ok(columns.includes('micronutrients')&&columns.includes('source_ref'));return q;},or(filter){assert.equal(filter,'needs_input.is.null,status.eq.failed');return q;},eq(){return q;},order(){return q;},gte(){return q;},lte(){return q;},lt(){return q;},range(){ranged=true;return q;},limit(){return q;},in(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data:ranged?[]:data,error:null}).then(resolve);}};return q;
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
