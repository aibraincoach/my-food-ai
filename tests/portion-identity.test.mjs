import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePortionNutrition} from '../src/lib/nutrition/portion.ts';
import {getFoodById} from '../src/lib/fdc/client.ts';
const detail={fdcId:77,description:'Selected rice',dataType:'Foundation',foodNutrients:[{nutrient:{id:1008,name:'Energy',unitName:'KCAL'},amount:200}]};
const nutrition={post_item_id:'original',source_ref:'77',calories:100,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:100,basis:'portion'}]};
function admin({unknown=false,renamed=false,cache=true}={}){
 const items={second:{id:'second',name:'Selected rice',portion_grams:75,supersedes:'first'},first:{id:'first',name:'Selected rice',portion_grams:100,supersedes:'original'},original:{id:'original',name:renamed?'Other food':'Selected rice',portion_grams:unknown?null:50,supersedes:null}};
 return {from(table){let key;const q={select(){return q;},eq(column,value){if(column!=='post_id')key=value;return q;},maybeSingle(){const row=unknown?{...nutrition,calories:null,micronutrients:[]}:nutrition;return Promise.resolve({data:table==='post_items'?items[key]??null:table==='item_nutrition'?(key==='original'?row:null):cache?{response:{kind:'fdc-detail-v1',fdcId:77,payload:detail}}:null,error:null,status:200});},upsert(value){assert.equal(table,'fdc_cache');assert.equal(value.query,'fdc-detail:77');return Promise.resolve({error:null,status:201});}};return q;}};
}
test('rapid pending revisions retain exact identity and original density',async()=>{
 const n=await resolvePortionNutrition(admin(),'post','second','Selected rice',25);
 assert.equal(n.source_ref,'77');assert.equal(n.calories,50);
 assert.equal(await resolvePortionNutrition(admin({renamed:true}),'post','second','Selected rice',25),null);
});
test('unknown portion becomes known using exact retained food reference',async()=>{
 const n=await resolvePortionNutrition(admin({unknown:true}),'post','second','Selected rice',75);
 assert.equal(n.source_ref,'77');assert.equal(n.calories,150);
});
test('exact identity endpoint validates response and never searches by name',async()=>{
 const original=globalThis.fetch;const key=process.env.FDC_API_KEY;process.env.FDC_API_KEY='fixture';
 try{globalThis.fetch=async url=>{assert.equal(new URL(url).pathname,'/fdc/v1/food/77');return Response.json(detail);};
 assert.equal((await getFoodById(admin({cache:false}),77)).foodNutrients[0].value,200);
 globalThis.fetch=async()=>Response.json({...detail,fdcId:78});
 await assert.rejects(getFoodById(admin({cache:false}),77),/invalid food detail/);
 }finally{globalThis.fetch=original;if(key===undefined)delete process.env.FDC_API_KEY;else process.env.FDC_API_KEY=key;}
});

for(const source_ref of ['barcode:123','barcode-own:123'])test(source_ref+' preserves values and provenance on a volume edit without a lookup',async()=>{
 const row={post_item_id:'original',calories:100,protein_g:1,carbs_g:10,fat_g:2,fibre_g:null,sugar_g:null,sodium_mg:null,source_ref,micronutrients:[]};
 const admin={from(table){assert.ok(['post_items','item_nutrition'].includes(table));const q={select(){return q;},eq(){return q;},async maybeSingle(){return {data:table==='post_items'?{name:'Drink',portion_grams:null,portion_text:'100 ml',supersedes:null}:row,error:null};}};return q;}};
 const result=await resolvePortionNutrition(admin,'post','original','Drink',null,'200 ml');assert.equal(result.calories,200);assert.equal(result.source_ref,source_ref);
});
