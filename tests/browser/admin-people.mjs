import fs from 'node:fs/promises';import assert from 'node:assert/strict';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);
const root=process.env.PEOPLE_OUT,app=process.env.APP_URL,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!root||![app,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>new URL(v).hostname==='127.0.0.1'))throw Error('Synthetic local stack only');
const fixtures=JSON.parse(await fs.readFile(root+'/fixture-ledger.json','utf8')),owner=fixtures[0];
const{chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
const report={engine,cases:[],pageErrors:[],consoleErrors:[],screenshots:[]};const markers=['PRIVATE_1369_CAPTION','PRIVATE_1369_FOOD','PRIVATE_1369_PHOTO_URL','PRIVATE_1369_COMMENT','PRIVATE_1369_POST_ERROR','PRIVATE_1369_JOB_ERROR','PRIVATE_1369_CALL_ERROR','PRIVATE_1369_REQUEST','PRIVATE_1369_RESPONSE'];
async function context(slot,lang='en'){
 const c=await browser.newContext({viewport:engine==='webkit'?{width:390,height:844}:{width:1280,height:800},locale:lang,serviceWorkers:'block'});
 const cookies=slot===null?[]:JSON.parse(await fs.readFile(root+'/session-'+slot+'.json','utf8'));
 await c.addCookies([...cookies.map(v=>({name:v.name,value:v.value,url:app})),{name:'lang',value:lang,url:app},{name:'time-zone',value:'UTC',url:app}]);return c;
}
try{
 const routes=['/admin','/admin/freeze-reports','/admin/posts/'+owner.post,'/admin/people','/admin/people/'+owner.user];
 for(const slot of [null,1]){const c=await context(slot),p=await c.newPage();for(const route of routes){const r=await p.goto(app+route,{waitUntil:'load'});assert.equal(r.status(),404,route+' refuses '+slot);const text=await r.text();assert.ok(!text.includes(owner.handle));for(const marker of markers)assert.ok(!text.includes(marker));report.cases.push({name:'access '+(slot===null?'signed-out':'ordinary')+' '+route,status:404});}await c.close();}
 for(const lang of ['en','ja']){
  const c=await context(0,lang),p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>report.pageErrors.push({lang,message:e.message}));p.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({lang,message:m.text()});});const t=JSON.parse(await fs.readFile(new URL('../../messages/'+lang+'.json',import.meta.url),'utf8')).admin;
  for(const route of routes){const r=await p.goto(app+route,{waitUntil:'load'});assert.equal(r.status(),200,route);await p.locator('main').waitFor();if(route!=='/admin/posts/'+owner.post){const payload=await r.text();for(const marker of markers)assert.ok(!payload.includes(marker),route+' HTML leaked '+marker);if(route!=='/admin/people/'+owner.user)assert.ok(!payload.includes(owner.email),route+' leaked email');const rsc=await c.request.get(app+route+'?_rsc=privacy1369',{headers:{RSC:'1'}});assert.equal(rsc.status(),200);const body=await rsc.text();for(const marker of markers)assert.ok(!body.includes(marker),route+' RSC leaked '+marker);if(route!=='/admin/people/'+owner.user)assert.ok(!body.includes(owner.email),route+' RSC leaked email');}
   if(route==='/admin/people'){
    await p.getByRole('heading',{name:t.peopleTitle,exact:true}).waitFor();
    for(const [key,count]of [['signedUpToday',3],['activeToday',1],['activeLastSeven',1],['errorsLastSeven',2]]){const h=p.getByRole('heading',{name:new RegExp('^'+t[key])});assert.equal((await h.locator('strong').innerText()).trim(),String(count));}
    assert.ok(await p.getByText(t.noHandleYet,{exact:false}).count()>0);assert.ok(await p.getByText(t.emailNotConfirmed,{exact:true}).count()>0);const overviewPath=root+'/'+engine+'-'+lang+'-overview.png';await p.screenshot({path:overviewPath,fullPage:true});report.screenshots.push(overviewPath);await p.getByRole('link',{name:t.peopleNext,exact:true}).last().click();await p.waitForURL('**page=2**');await p.getByText(t.accountsPage.replace('{page}','2'),{exact:true}).waitFor();
    await p.goto(app+'/admin/people?page=3');await p.locator('main').waitFor();assert.ok(await p.getByRole('link',{name:t.peoplePrevious,exact:true}).count()>0);
   }
   if(route==='/admin/people/'+owner.user){await p.getByText(owner.email,{exact:true}).waitFor();await p.getByText('meta:503',{exact:false}).first().waitFor();assert.ok((await p.locator('main').innerText()).includes(t.peopleNotRecorded));}
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'page overflow '+route);
   report.cases.push({name:lang+' owner '+route,status:200});
   if(route==='/admin/people/'+owner.user){const path=root+'/'+engine+'-'+lang+'-'+(route==='/admin/people'?'overview':'person')+'.png';await p.screenshot({path,fullPage:true});report.screenshots.push(path);}
  }
  await c.close();
 }
 assert.equal(report.pageErrors.length,0,'page errors');assert.equal(report.consoleErrors.length,0,'console errors');report.passed=true;
}catch(e){report.error=String(e.stack??e);process.exitCode=1;}finally{await browser.close();await fs.writeFile(root+'/'+engine+'-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
