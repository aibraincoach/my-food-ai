import fs from 'node:fs/promises';import assert from 'node:assert/strict';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);const app=process.env.APP_URL,root=process.env.FREEZE_CHECK_OUT,engine=process.env.ONLY_ENGINE;if(process.env.MFA_TEST_DISPOSABLE!=='1'||!root||![app,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>new URL(v).hostname==='127.0.0.1'))throw Error('Local only');
const {chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});let c;
try{
 c=await browser.newContext();const cookies=JSON.parse(await fs.readFile(root+'/session.json','utf8'));await c.addCookies(cookies.map(v=>({name:v.name,value:v.value,url:app})));
 const valid={events:[{t:Date.now(),name:'page-load'}],user_agent:'Local final-head API probe',build:'final-head',camera_permission:'unknown'};
 const responses=await Promise.all([c.request.post(app+'/api/freeze-report',{data:valid}),c.request.post(app+'/api/freeze-report',{data:valid})]);assert.deepEqual(responses.map(r=>r.status()).sort(),[200,429]);
 const invalid=await c.request.post(app+'/api/freeze-report',{data:{...valid,events:[{t:9000000000000000,name:'page-load'}]}});assert.equal(invalid.status(),400);
 const result={engine,concurrentStatuses:[200,429],invalidDate400:true};await fs.writeFile(root+'/'+engine+'-final-api.json',JSON.stringify(result));console.log(JSON.stringify(result));
}finally{if(c)await c.close();await browser.close();}
