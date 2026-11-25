// Explicit disposable local-stack probe. Scripted providers by default;
// LIVE_MATCHER_MEASUREMENT=1 enables only the separately authorized bounded
// matcher call; USDA remains a declared transport fixture, never production.
import fs from'node:fs/promises';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{execFileSync}from'node:child_process';import{performance}from'node:perf_hooks';
import{createClient}from'@supabase/supabase-js';
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||[db,url].some(v=>!v||new URL(v).hostname!=='127.0.0.1'))throw Error('Disposable loopback stack only');
const mode=process.argv[2]??'head',live=mode==='measure',stem=process.env.HOT_POT_PROBE_LABEL??mode;
assert.match(stem,/^[a-z0-9-]+$/);
if(!['head','base','measure'].includes(mode)||live&&process.env.LIVE_MATCHER_MEASUREMENT!=='1')throw Error('Explicit measurement authorization required');
const fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
assert.match(fixture.email,/^text1287-[a-f0-9]+@example.com$/);assert.match(fixture.user,/^[a-f0-9-]{36}$/);
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owner=await admin.auth.admin.getUserById(fixture.user);assert.equal(owner.data.user.email,fixture.email);
const sql=body=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:body,encoding:'utf8',timeout:15000}).trim(),quote=s=>"'"+s.replaceAll("'","''")+"'";
const post=randomUUID(),originals=[],pinned=['barcode:fixture','off:fixture','label','user:fixture'];
sql("insert into posts(id,user_id,eaten_at,caption,status,analysis_initialized_at)values("+quote(post)+","+quote(fixture.user)+",now(),'','ready',now());insert into post_comments(post_id,author,body)values("+quote(post)+",'model','Synthetic hot-pot rematch fixture.');");
const rows=[['Pork','2 thin slices',70,350,'999'],['Broth','100 g',100,15,'777'],['Shabu sauce','30 g',30,60,'666'],...pinned.map((ref,i)=>['Pinned '+i,'15 g',15,23,ref])];
for(const[name,text,grams,calories,ref]of rows){
 const id=randomUUID(),nutrition={calories,protein_g:ref==='label'?null:5,carbs_g:0,fat_g:2,fibre_g:0,sugar_g:0,sodium_mg:5,micronutrients:[],source_ref:ref,food_category:null};
 sql("insert into post_items(id,post_id,name,source,portion_text,portion_grams)values("+quote(id)+","+quote(post)+","+quote(name)+",'model',"+quote(text)+","+grams+");insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)values("+quote(id)+","+calories+","+(nutrition.protein_g??'null')+",0,2,0,0,5,'[]',"+quote(ref)+");");
 originals.push({id,name,portion_grams:grams,nutrition});
}
await fs.writeFile(out+'/'+stem+'-before.json',JSON.stringify({post,originals},null,2),{mode:0o600});
execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1','-v','post='+post,'-f','scripts/numbers/11-rematch.sql'],{encoding:'utf8',timeout:15000});
const picked=await admin.from('jobs').select('*').eq('post_id',post).eq('kind','recompute').eq('status','queued').single();assert.equal(picked.error,null);const job={...picked.data,status:'running'};
for(const response of[await admin.from('jobs').update({status:'running',started_at:new Date().toISOString()}).eq('id',job.id),await admin.from('posts').update({status:'processing',active_job_id:job.id}).eq('id',post).eq('user_id',fixture.user)])assert.equal(response.error,null);
const originalFetch=globalThis.fetch,originalBase=process.env.MODEL_API_BASE_URL,originalKey=process.env.MODEL_API_KEY;
if(!live){process.env.MODEL_API_BASE_URL='http://127.0.0.1:9/v1';process.env.MODEL_API_KEY='scripted-fixture';}
const modelBase=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1'),calls={model:0,usdaFixture:0,externalOther:0};
const nutrients=energy=>[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:energy},...[1003,1004,1005,1079,2000,1093].map(id=>({nutrientId:id,nutrientName:'Fixture '+id,unitName:'G',value:1}))];
globalThis.fetch=async(input,init={})=>{
 const target=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(target.protocol==='data:')return originalFetch(input,init);
 if(target.origin===modelBase.origin&&target.pathname.endsWith('/responses')){
  calls.model++;if(calls.model>6)throw Error('Bounded matcher call cap exceeded');
  if(live)return originalFetch(input,init);
  const request=JSON.parse(init.body),context=JSON.parse(request.input[0].content[0].text),id=context.candidates[0]?.id??null;
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({id,query:null,query_food:null,reason:'Compatible scripted fixture reference'})}]}]});
 }
 if(target.hostname==='api.nal.usda.gov'){
  calls.usdaFixture++;const query=target.searchParams.get('query')??(init.body?JSON.parse(init.body).query:'')??'';
  const foods=/pork/i.test(query)?[
   {fdcId:999,description:'Pork, fresh, belly, raw',foodCategory:'Pork Products',dataType:'Foundation',foodNutrients:nutrients(500)},
   {fdcId:888,description:'Pork, fresh, loin, raw',foodCategory:'Pork Products',dataType:'Foundation',foodNutrients:nutrients(100)},
  ]:[{fdcId:/broth/i.test(query)?777:666,description:/broth/i.test(query)?'Broth, ready to serve':'Dipping sauce',foodCategory:/broth/i.test(query)?'Soups, Sauces, and Gravies':'Sauces',dataType:'Foundation',foodNutrients:nutrients(/broth/i.test(query)?15:200)}];
  return Response.json({foods});
 }
 if(target.hostname==='127.0.0.1'&&target.pathname.endsWith('/fdc_cache')){
  // Keep these synthetic references out of the shared cache and ignore older
  // cached fixtures so this probe's candidate transport is reproducible.
  return init.method==='POST'?new Response(null,{status:204}):Response.json(null);
 }
 if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname)){calls.externalOther++;(calls.blockedHosts??=[]).push(target.hostname);throw Error('Unapproved external fixture request');}
 return originalFetch(input,init);
};
const proof={mode,post,liveMatcher:live,usdaScripted:true,started:new Date().toISOString(),calls,pass:false};
try{
 const module=mode==='base'?process.env.HOT_POT_BASE_MODULE:'../../src/lib/worker/jobs/recompute.ts';
 if(mode==='base'&&(!module||!module.startsWith('/tmp/')))throw Error('Explicit local base worktree required');
 const {default:recompute}=await import(module),{traceContext}=await import('../../src/lib/trace/context.ts');
 const start=performance.now();await traceContext.run({postId:post,deadlineAt:Date.now()+180000},()=>recompute(admin,job));proof.wallMs=Math.round(performance.now()-start);
 const current=JSON.parse(sql("select json_agg(json_build_object('id',i.id,'name',i.name,'portion_grams',i.portion_grams,'nutrition',to_jsonb(n)))from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id="+quote(post)));
 await fs.writeFile(out+'/'+stem+'-after.json',JSON.stringify(current,null,2),{mode:0o600});
 const pork=current.find(i=>i.name==='Pork'),shared=current.filter(i=>['Broth','Shabu sauce'].includes(i.name));
 proof.checks={sliceGrams:pork.portion_grams===30,leanReference:pork.nutrition.source_ref==='888',sharedZero:shared.every(i=>i.nutrition.calories===0&&i.nutrition.source_ref.startsWith('shared-pot:v1:'))};
 const{sharedPotMarker}=await import('../../src/lib/nutrition/hot-pot.ts');
 if(mode!=='base'){assert.equal(sharedPotMarker(shared.find(i=>i.name==='Broth').nutrition.source_ref).original.source_ref,'777');}
 for(const ref of pinned){const old=originals.find(i=>i.nutrition.source_ref===ref),row=current.find(i=>i.nutrition.source_ref===ref);assert.ok(row);assert.equal(row.portion_grams,old.portion_grams);for(const key of['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg','source_ref'])assert.equal(row.nutrition[key],old.nutrition[key],ref+' '+key);}
 proof.pinsUnchanged=true;proof.pass=mode==='base'?Object.values(proof.checks).some(value=>!value):Object.values(proof.checks).every(Boolean);
 assert.equal(proof.pass,true,mode==='base'?'Main must expose a policy failure':'Rematch policy assertions');
}catch(e){proof.error=String(e);process.exitCode=1;}
finally{globalThis.fetch=originalFetch;if(originalBase===undefined)delete process.env.MODEL_API_BASE_URL;else process.env.MODEL_API_BASE_URL=originalBase;if(originalKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=originalKey;proof.finished=new Date().toISOString();await fs.writeFile(out+'/'+stem+'-rematch.json',JSON.stringify(proof,null,2),{mode:0o600});console.log(JSON.stringify({mode,pass:proof.pass,checks:proof.checks,pinsUnchanged:proof.pinsUnchanged,calls,wallMs:proof.wallMs,error:proof.error}));}
