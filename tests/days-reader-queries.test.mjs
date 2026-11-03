// node --import tsx --test tests/days-reader-queries.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {getDays} from '../src/lib/posts/days.ts';

const nutrients={calories:100,protein_g:5,carbs_g:10,fat_g:4,fibre_g:2,sugar_g:1,sodium_mg:20};
function rows(count) {
  return Array.from({length:count},(_,i)=>({id:`p${i}`,caption:`Meal ${i}`,eaten_at:`2026-11-02T${String(8+Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}:00Z`,
    post_media:[{position:0,storage_path:`u/p${i}/0.jpg`}],
    current_post_items:[{id:`i${i}`,post_id:`p${i}`,name:'Rice',portion_text:'100 g',portion_grams:100,box:null,mask_path:null,source:'model',gtin:null,supersedes:null,not_eaten_grams:null,not_eaten_calories:null,count_text:null,not_eaten_count_text:null,created_at:'2026-11-02T08:00:00Z',item_nutrition:[{post_item_id:`i${i}`,...nutrients,micronutrients:[],source_ref:'123',food_category:null}]}]}));
}
function client(posts,{signError=false,intake=[]}={}) {
 const calls=[];
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async(input,options)=>{
   const url=new URL(input instanceof Request?input.url:String(input));
   calls.push({path:url.pathname,query:url.searchParams,body:options?.body});
   if(url.pathname==='/rest/v1/posts') {
     assert.ok(url.searchParams.get('select').includes('current_post_items('));
     assert.ok(url.searchParams.get('select').includes('post_media('));
     assert.equal(url.searchParams.get('user_id'),'eq.u');
     assert.equal(url.searchParams.get('post_media.kind'),'eq.photo');
     assert.equal(url.searchParams.get('post_media.limit'),'1');
     return Response.json(posts);
   }
   if(url.pathname==='/rest/v1/intake_logs')return Response.json(intake);
   if(url.pathname==='/storage/v1/object/sign/media'){
     if(signError)return Response.json({message:'unavailable'},{status:500});
     return Response.json(JSON.parse(options.body).paths.map(path=>({path,signedURL:`/object/sign/media/${path}?token=fixture`,error:null})));
   }
   throw Error(`Unexpected ${url.pathname}`);
 }}});
 return {db,calls};
}

test('40 meals and 2 meals use the same two reads and one batch signing call',async()=>{
 for(const count of [2,40]){
  const {db,calls}=client(rows(count));
  const days=await getDays(db,'u','UTC','2026-11-01','2026-11-30');
  assert.equal(days[0].posts.length,count);
  assert.deepEqual(calls.map(c=>c.path),['/rest/v1/posts','/storage/v1/object/sign/media','/rest/v1/intake_logs']);
  assert.equal(days[0].totals.calories,count*100);
  assert.equal(JSON.parse(calls[1].body).paths.length,count);
 }
});

test('fixed fixture preserves the legacy day/post/item values, first-photo URL and totals',async()=>{
 const {db}=client(rows(1),{intake:[{kind:'water',amount:250,logged_at:'2026-11-02T09:00:00Z'}]});
 const days=await getDays(db,'u','UTC','2026-11-01','2026-11-30');
 assert.deepEqual(days,[{date:'2026-11-02',posts:[{id:'p0',caption:'Meal 0',eatenAt:'2026-11-02T08:00:00Z',photoUrl:'https://fixture.invalid/storage/v1/object/sign/media/u/p0/0.feed.jpg?token=fixture',items:[{id:'i0',name:'Rice',portion_text:'100 g',portion_grams:100,box:null,mask_path:null,source:'model',gtin:null,supersedes:null,not_eaten_grams:null,not_eaten_calories:null,count_text:null,not_eaten_count_text:null,...nutrients,micronutrients:[],source_ref:'123',food_category:null}],totals:nutrients}],totals:nutrients,intake:{water:250,caffeine:0}}]);
});

test('photo signing failure retains meals and unknown nutrition remains unavailable',async()=>{
 const data=rows(1);data[0].current_post_items[0].item_nutrition=[];
 const {db}=client(data,{signError:true});
 const days=await getDays(db,'u','UTC','2026-11-01','2026-11-30');
 assert.equal(days[0].posts[0].photoUrl,null);
 assert.equal(days[0].totals.calories,null);
 assert.deepEqual(days[0].totals.missing.calories,['Rice']);
});
