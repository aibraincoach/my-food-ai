// node --import tsx --env-file=.env.local --test tests/drink-tiles-route.test.mjs
// Requires a locally served build and disposable database with migration 0037.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser} from '../scripts/lib/session.mjs';
import {DRINK_TILES} from '../src/lib/intake/intake.ts';

const checked=result=>{assert.ifError(result.error);return result.data;};
test('actual intake route commits all six server tiles, legacy water and rejects an invalid tile',async()=>{
 const origin=process.env.APP_URL;
 for(const endpoint of [origin,process.env.NEXT_PUBLIC_SUPABASE_URL])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname),'Disposable local stack required.');
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const cookie=await signInAsTestUser(),ids=[];
 const counts=async(auth)=>{const response=await fetch(`${origin}/api/intake/tile-counts`,{headers:{Cookie:auth}});assert.equal(response.status,200);return response.json();};
 const otherCookie=await signInAsTestUser(2);
 let before;
 const otherBefore=await counts(otherCookie);
 const anonymous=await fetch(`${origin}/api/intake/tile-counts`);assert.equal(anonymous.status,401);
 // Explicit synthetic FDC search cache fixtures prevent real USDA traffic.
 const queries=['Coffee, brewed from grounds, prepared with tap water','Coffee, brewed, espresso, restaurant-prepared','Beverages, tea, black, brewed, prepared with tap water','Beverages, carbonated, cola, regular'];
 const fixtures=queries.map((description,i)=>{const query=description.toLowerCase();return{query:`fdc-search-v3:${query}`,response:{kind:'fdc-search-v3',query,payload:{foods:[{fdcId:9900370+i,description,dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:i===3?42:1},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:0},{nutrientId:1004,nutrientName:'Total lipid (fat)',unitName:'G',value:0},{nutrientId:1005,nutrientName:'Carbohydrate, by difference',unitName:'G',value:0}]}]}}};});
 const prior=checked(await db.from('fdc_cache').select('*').in('query',fixtures.map(x=>x.query)));
 try{
  checked(await db.from('fdc_cache').upsert(fixtures,{onConflict:'query'}));
  for(const [body,expected] of [...DRINK_TILES.map((tile,index)=>[{tile:index},{label:`${tile.name}, ${tile.size}`,kind:tile.kind,ml:tile.ml,caffeineMg:tile.caffeineMg}]),[{kind:'water',ml:330},{label:'Water',kind:'water',ml:330,caffeineMg:0}],[{tile:1,ml:350},{label:'Coffee, large',kind:'caffeine',ml:350,caffeineMg:138}]]){
   if(body.tile===1&&body.ml===350)before=await counts(cookie);
   const r=await fetch(`${origin}/api/intake/post`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
   const result=await r.json();if(result.post_id)ids.push(result.post_id);assert.equal(r.status,201,JSON.stringify({body,result}));assert.equal(typeof result.post_id,'string');
   const row=checked(await db.from('intake_logs').select('kind,ml,amount,label').eq('post_id',result.post_id).single());
   assert.deepEqual(row,{kind:expected.kind,ml:expected.ml,amount:expected.kind==='water'?expected.ml:expected.caffeineMg,label:expected.label});
   const items=checked(await db.from('post_items').select('id').eq('post_id',result.post_id));assert.equal(items.length,1);
   const nutrition=checked(await db.from('item_nutrition').select('calories,micronutrients').eq('post_item_id',items[0].id).single());
   if(expected.kind==='water')assert.equal(Number(nutrition.calories),0);
   else assert.equal(nutrition.micronutrients.find(x=>x.nutrientId===1057).value,expected.caffeineMg);
  }
  for(const body of [{tile:9},{tile:1,ml:300}]){
   const invalid=await fetch(`${origin}/api/intake/post`,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(invalid.status,400);
  }
  const after=await counts(cookie);
  assert.deepEqual(after.counts,before.counts.map((count,index)=>count+(index===1?1:0)));
  assert.deepEqual(await counts(otherCookie),otherBefore,'another account never inherits the first account’s counts');
 }finally{
  if(ids.length)checked(await db.from('posts').delete().in('id',ids));
  checked(await db.from('fdc_cache').delete().in('query',fixtures.map(x=>x.query)));
  if(prior.length)checked(await db.from('fdc_cache').insert(prior));
 }
});
