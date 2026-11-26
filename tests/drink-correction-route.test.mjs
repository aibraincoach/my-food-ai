// Built disposable loopback app only; seeds the reading directly, no model calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
import {photoDrinkProduct} from '../src/lib/intake/photo-drinks.ts';
test('real PATCH refuses an unchanged correction and bad caffeine before a write; a rename drops database nutrients',async()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');
 for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])assert.ok(['127.0.0.1','localhost'].includes(new URL(process.env[key]).hostname));
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {user,client}=await signInTestClient(),cookie=await signInAsTestUser(),stage=randomUUID();
 const checked=r=>{assert.ifError(r.error);return r.data;};
 const drink={name:'Cola',ml:200,grams:210,caffeineMg:20,kcal:80,source:'read from the can',nutrition:{calories:80,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:20,sodium_mg:10,micronutrients:[{nutrientId:1092,nutrientName:'Potassium',unitName:'MG',value:25,basis:'portion'},{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',value:20,basis:'portion'}],source_ref:'123',food_category:'Soft drinks'}};
 try{
  checked(await admin.rpc('reserve_post_upload_with_leftovers',{p_operation_id:stage,p_user_id:user.id,p_caption:'source correction proof',p_eaten_at:new Date().toISOString(),p_shots:[{position:0,width:390,height:390}],p_location:null,p_not_eaten_positions:[],p_save_as_meal:false,p_render_zone:'UTC'}));
  const reading=checked(await admin.from('composer_drink_readings').insert({user_id:user.id,upload_id:stage,position:0,state:'ready',all_drinks:true,drinks:[drink]}).select('id').single());
  const patch=correction=>fetch(process.env.APP_URL+'/api/drinks/identify',{method:'PATCH',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({reading_id:reading.id,index:0,correction}),signal:AbortSignal.timeout(10000)});
  const unchanged={name:'Cola',pack_amount:200,pack_unit:'ml',per_100:photoDrinkProduct(drink).per100g,caffeine_mg:null};
  for(const correction of [unchanged,{...unchanged,name:'Coffee',caffeine_mg:1001}]){
   const r=await patch(correction);assert.equal(r.status,400,await r.text());
   assert.deepEqual(checked(await admin.from('composer_drink_readings').select('drinks').eq('id',reading.id).single()).drinks,[drink]);
  }
  const changed=await patch({...unchanged,name:'Orange juice'});assert.equal(changed.status,200,await changed.clone().text());
  const result=(await changed.json()).drinks[0];assert.equal(result.name,'Orange juice');assert.equal(result.caffeineMg,null);assert.equal(result.grams,null);assert.equal(result.nutrition.food_category,null);
  assert.equal(result.nutrition.source_ref,'user:drink-correction:'+reading.id);assert.deepEqual(result.nutrition.micronutrients,[{nutrientId:1051,nutrientName:'Water',unitName:'G',value:200,basis:'portion'}]);
  const coffee=await patch({...unchanged,name:'Coffee',caffeine_mg:75});assert.equal(coffee.status,200,await coffee.clone().text());assert.equal((await coffee.json()).drinks[0].caffeineMg,75);
 }finally{checked(await admin.from('post_upload_drafts').delete().eq('id',stage));await client.auth.signOut();const session=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>cookie.split('; ').map(pair=>({name:pair.slice(0,pair.indexOf('=')),value:pair.slice(pair.indexOf('=')+1)})),setAll(){}}});assert.ifError((await session.auth.signOut()).error);}
});
