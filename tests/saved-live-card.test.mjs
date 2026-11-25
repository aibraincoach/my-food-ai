import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {NextIntlClientProvider}=require('next-intl');
const SavedNutritionThumbnail=require('../src/components/SavedNutritionThumbnail.tsx').default;
const LiveNutritionCard=require('../src/components/LiveNutritionCard.tsx').default;
import {createClient} from '@supabase/supabase-js';
import {listSaved} from '../src/lib/posts/saved.ts';
const items=[{name:'Rice',portion_grams:100,portion_text:null,nutrition:{calories:130,protein_g:2.7,carbs_g:28,fat_g:0.3,micronutrients:[]}}];
for(const locale of ['en','ja']){
 const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8'));
 const render=element=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC',now:new Date('2026-11-25T00:00:00Z')},element));
 for(const surface of ['saved snapshot','live meal'])test(locale+' '+surface+' renders localized nutrition facts without a stored card image',()=>{
  const html=render(surface==='saved snapshot'?React.createElement(SavedNutritionThumbnail,{items}):React.createElement(LiveNutritionCard,{items:items.map(i=>({...i.nutrition,name:i.name,portion_grams:i.portion_grams})),eatenAt:'2026-11-25T00:00:00Z'}));
  assert.ok(html.includes(messages.card.summary),'viewer-localized card label');
  assert.ok(html.includes(messages.card.protein),'viewer-localized nutrient heading');
  assert.ok(html.includes('130'),'snapshot calories are rendered');
  assert.doesNotMatch(html,/<img\b|card\.png|object\/sign/,'there is no bitmap or signed image capability');
 });
}
test('a saved meal whose source post is gone renders from its own snapshot without fetching the source or storage',async()=>{
 const row={id:'saved',name:'Rice',source_post_id:null,items,last_logged_at:null};
 const requests=[];
 const db=createClient('https://saved-local.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input));requests.push(url.pathname);
  assert.equal(url.pathname,'/rest/v1/saved_meals','only the saved snapshot is needed');
  return Response.json([row]);
 }}});
 const [saved]=await listSaved(db);
 assert.equal(saved.thumbnail,null);
 assert.deepEqual(saved.items,items);
 assert.deepEqual(requests,['/rest/v1/saved_meals']);
});
