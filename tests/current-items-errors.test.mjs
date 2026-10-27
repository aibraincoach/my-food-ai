import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {getCurrentItems} from '../src/lib/nutrition/totals.ts';
import {isRetriable} from '../src/lib/worker/errors.ts';
const item={id:'item',name:'Food',portion_grams:50,source:'user'};
function client(nutrition,status=200){return createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(url)=>{
 const current=String(url).includes('/current_post_items');
 const data=status===200?(current?[item]:nutrition):{code:'fixture',message:'Unavailable'};
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
}}});}
test('actual PostgREST HTTP errors retain retry classification in current item reader',async()=>{
 for(const status of [400,429,503])await assert.rejects(getCurrentItems(client([],status),'post'),e=>isRetriable(e)===(status!==400));
});
test('pending nutrition defers correction but explicitly unknown nutrition is resolved',async()=>{
 await assert.rejects(getCurrentItems(client([]),'post',{requireNutrition:true}),e=>isRetriable(e));
 const unknown={post_item_id:'item',calories:null,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[],source_ref:null};
 const rows=await getCurrentItems(client([unknown]),'post',{requireNutrition:true});
 assert.equal(rows.length,1);assert.equal(rows[0].calories,null);
 const visible=await getCurrentItems(client([]),'post');assert.equal(visible[0].calories,null);
});
