import {readFileSync} from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {toFeedPosts} from '../src/lib/posts/feed.ts';
import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
import {cardTranslator} from '../src/i18n/card.ts';
test('Home and Search feed projection retains MEXT attribution and macro markers, preserving ordinary payloads',async()=>{
 const owner='10000000-0000-4000-8000-000000000001',id='20000000-0000-4000-8000-000000000001';
 let source='mext:01088';
 const marker={nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',basis:'portion',value:null,marker:'trace'};
 const water={nutrientId:1051,nutrientName:'Water',unitName:'G',basis:'portion',value:10};
 const measured={nutrientId:1089,nutrientName:'Iron',unitName:'MG',basis:'portion',value:1};
 const db=createClient('https://local-fixture.invalid','fixture',{global:{fetch:async input=>{
  const p=new URL(input instanceof Request?input.url:String(input)).pathname;
  if(p.endsWith('/feedback_revision'))return Response.json({modelCommentId:null,fingerprint:'same'});
  if(p.endsWith('/current_post_items'))return Response.json([{id:'item',post_id:id,name:'Fixture',portion_grams:100,source:'model',item_nutrition:{post_item_id:'item',calories:null,protein_g:2,carbs_g:10,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,source_ref:source,micronutrients:source.startsWith('mext:')?[marker,water,measured]:[water,measured]}}]);
  if(['/post_media','/saved_meals','/profiles'].some(suffix=>p.endsWith(suffix)))return Response.json([]);
  throw Error('Unexpected fixture request '+p);
 }}});
 const rows=[{id,user_id:owner,status:'ready',eaten_at:'2026-11-25T00:00:00Z'}];
 const [post]=await toFeedPosts(db,rows);assert.equal(post.items[0].source_ref,'mext:01088');assert.deepEqual(post.items[0].micronutrients,[marker,water]);
 const card=cardDataFromRow(post,'ja',{t:cardTranslator('ja'),tn:nutritionTranslator('ja')});assert.equal(card.mext,true);assert.deepEqual(card.traceOnly,['calories']);
 source='12345';const [normal]=await toFeedPosts(db,rows);
 const golden=JSON.parse(readFileSync(new URL('./fixtures/mext-usda-feed-main.json',import.meta.url),'utf8'));assert.equal(JSON.stringify(normal),golden.payload,'USDA-only whole payload must be byte-identical to the frozen main result');
 const bounded=structuredClone(post);delete bounded.items[0].source_ref;bounded.items[0].micronutrients=bounded.items[0].micronutrients.filter(n=>n.marker===undefined);assert.equal(JSON.stringify(bounded),golden.payload,'MEXT adds only opaque source and macro marker entries');assert.equal('source_ref'in normal.items[0],false);assert.deepEqual(normal.items[0].micronutrients,[water]);
});
