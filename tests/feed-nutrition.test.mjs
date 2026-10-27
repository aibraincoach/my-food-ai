import test from 'node:test';
import assert from 'node:assert/strict';
import {getPostCard} from '../src/lib/posts/feed.ts';
import {getCurrentItems} from '../src/lib/nutrition/totals.ts';
test('feed and detail normalize the same legacy branded row',async()=>{
 const item={id:'item',name:'Food',portion_grams:50,portion_text:'50g',source:'model'};
 const row={post_item_id:'item',calories:333,protein_g:16,source_ref:'123',micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200}]};
 const client={from(table){
  const data=table==='posts'?{id:'post',status:'ready'}:table==='post_media'?null:table==='current_post_items'?[item]:[row];
  const q={select(columns){if(table==='item_nutrition')assert.ok(columns.includes('micronutrients')&&columns.includes('source_ref'));return q;},eq(){return q;},order(){return q;},limit(){return q;},in(){return q;},maybeSingle(){return q;},then(resolve){return Promise.resolve({data,error:null}).then(resolve);}};return q;
 }};
 const card=await getPostCard(client,'post');const detail=await getCurrentItems(client,'post');
 assert.equal(card.items[0].calories,100);assert.equal(card.items[0].calories,detail[0].calories);
 assert.equal(card.items[0].protein_g,null);
});
