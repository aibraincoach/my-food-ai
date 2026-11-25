import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
const id='11111111-1111-4111-8111-111111111111';
function route(file){
 const calls=[];const admin={from(table){calls.push('from:'+table);const q={select(){return q;},eq(){return q;},in(){return q;},maybeSingle:async()=>({data:null,error:null}),then(resolve){return Promise.resolve({data:[{id,drinks:[]}],error:null}).then(resolve);}};return q;},rpc:async(name)=>{calls.push('rpc:'+name);return{data:id,error:null};}};
 const modules={
 'next/server':{NextResponse:{json:(value,init)=>Response.json(value,init)}},
 'next/headers':{cookies:async()=>({get:()=>({value:'UTC'})})},
 '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id}}})},from(){calls.push('owner read/write');return{select(){return this;},eq(){return this;},single:async()=>({data:{id},error:null}),insert:async()=>({error:null})};}})},
 '@/lib/supabase/admin':{createAdminClient:()=>{calls.push('admin');return admin;}},
 '@/lib/limits/user-cap':{capUser:async()=>null},
 '@/lib/posts/days':{validZone:v=>v},'@/lib/posts/items':{isUuid:v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v)},
 '@/lib/posts/food-operation':{foodRequestKey:()=> 'fixture'},
 '@/lib/posts/eaten-at':{validEatenAt:v=>v},
 '@/lib/fdc/client':{searchFoods:async()=>[{fdcId:1,description:'Fixture'}]},
 '@/lib/fdc/serving':{servingPortion:()=>({amount:100,unit:'g'})},
 '@/lib/fdc/nutrients':{scaleNutrition:()=>({calories:100,micronutrients:[]})},
 '@/lib/intake/drink-operation':{photoDrinkKey:()=> 'fixture',readDrinkReceipt:async()=>null,drinkErrorStatus:()=>500},
 '@/lib/nutrition/totals':{sumNutrition:()=>({})},'@/lib/pipeline/wording':{plainConsumed:()=> 'Fixture'},
 '@/lib/pipeline/persist':{markReady:async()=>{}},
 '@/lib/media/staged-photo':{queueStagedPhotoCleanup:async()=>{calls.push('cleanup');}},
 '@/lib/media/storage':{signShotUploads:async(_db,_user,_id,_positions,options)=>{calls.push('sign:'+String(options?.upsert===true));return[];}}
 };
 const exports={};const code=ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',code)(name=>modules[name]??{},exports);return{post:exports.POST,calls};
}
for(const [label,file,body]of [
 ['tile drink','../src/app/api/intake/post/route.ts',{tile:0}],
 ['food','../src/app/api/posts/food/route.ts',{fdc_id:1,query:'rice',eaten_at:'2026-01-01T00:00:00Z'}],
 ['photo drink','../src/app/api/drinks/post/route.ts',{upload_id:id,caption:'',readings:[{reading_id:id,selections:[]}],save_as_meal:false}]
])test(label+' refuses a missing operation before publication, with an API message code',async()=>{
 for(const operation_id of [undefined,null,'invalid']){
  const r=route(file),response=await r.post(new Request('http://localhost/api/fixture',{method:'POST',body:JSON.stringify({...body,...(operation_id===undefined?{}:{operation_id})})}));assert.equal(response.status,400);assert.equal(typeof(await response.json()).message_code,'string');assert.deepEqual(r.calls,[],'no admin read, old publication or second write');
 }
});

test('signing accepts only a cleanup-backed staged pack photo and refuses the old post/shots writer',async()=>{
 const file='../src/app/api/media/sign-upload/route.ts';
 for(const body of [null,{}, {staged:false}, {postId:id,shots:[{position:0,width:100,height:100}]}]){
  const r=route(file),response=await r.post(new Request('http://localhost/api/media/sign-upload',{method:'POST',body:JSON.stringify(body)}));assert.equal(response.status,400);assert.equal(typeof(await response.json()).message_code,'string');assert.deepEqual(r.calls,[]);
 }
 const r=route(file),response=await r.post(new Request('http://localhost/api/media/sign-upload',{method:'POST',body:JSON.stringify({staged:true})}));assert.equal(response.status,200);assert.deepEqual(r.calls,['admin','cleanup','sign:false']);
});
