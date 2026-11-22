// Fake Realtime, real SDK and card readers. The private fixture controller must
// own one ledgered synthetic meal: reset -> processing; ready -> atomic card
// publication via publish_results_card; save -> save_ready_meal. No model calls.
import fs from 'node:fs/promises';
const {APP_URL:target,READINESS_CHECK_OUT:out,TEST_SESSION_FILE:sessionFile,
  MFA_PLAYWRIGHT_MODULE:browserModule,READINESS_FIXTURE_CONTROL:controller}=process.env;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!target||!controller||
  ![target,controller].every(value=>['127.0.0.1','localhost'].includes(new URL(value).hostname))||
  !out||!sessionFile||!browserModule)throw Error('Explicit disposable loopback app, fixture controller, session, fresh output and browser module required.');
await fs.mkdir(out);
const {webkit,chromium,devices}=await import(browserModule);
const session=JSON.parse(await fs.readFile(sessionFile,'utf8')),results=[];
const fixture=async operation=>{
  const response=await fetch(controller+'/'+operation);
  if(!response.ok)throw Error(await response.text());
  return response.json();
};
for(const engine of ['webkit','chromium']){
  const browser=engine==='webkit'?await webkit.launch():await chromium.launch({
    executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
  try{
    const {id}=await fixture('reset');
    const context=await browser.newContext({...devices['iPhone 13'],
      viewport:{width:390,height:844},timezoneId:'UTC',serviceWorkers:'block'});
    const cookies=session.cookie.split('; ').map(part=>{
      const i=part.indexOf('=');return{name:part.slice(0,i),value:part.slice(i+1),url:target};
    }).filter(cookie=>cookie.name!=='time-zone');
    await context.addCookies([...cookies,{name:'time-zone',value:'UTC',url:target}]);
    const page=await context.newPage(),errors=[],reads=[];let acknowledge;
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{
      const url=new URL(request.url());
      if(url.pathname==='/api/feed'||url.pathname.endsWith('/posts'))
        reads.push({path:url.pathname,selection:url.searchParams.get('select'),ids:url.searchParams.get('ids')});
    });
    await page.routeWebSocket('**/realtime/v1/websocket**',socket=>{
      socket.onMessage(raw=>{
        const [join,ref,topic,event,payload]=JSON.parse(String(raw));
        const reply=response=>socket.send(JSON.stringify([join,ref,topic,'phx_reply',{status:'ok',response}]));
        if(event==='phx_join'){
          const bindings=(payload.config?.postgres_changes||[]).map((filter,index)=>({...filter,id:100+index}));
          if(topic==='realtime:tab-post-readiness')acknowledge=()=>reply({postgres_changes:bindings});
          else reply({postgres_changes:bindings});
        }else if(event==='heartbeat'||event==='phx_leave')reply({});
      });
    });
    try{
      await page.goto(target,{waitUntil:'networkidle',timeout:30000});
      await page.waitForFunction(id=>document.querySelector(`[data-post-id="${id}"]`)?.textContent.includes('Processing'),id,{timeout:10000});
      if(!acknowledge)throw Error('The real SDK did not join the readiness channel.');
      // No row event is sent: completion occurred in the subscription gap.
      await fixture('ready');await fixture('save');
      const started=Date.now();acknowledge();let pass=true;
      try{
        await page.waitForFunction(id=>[...document.querySelectorAll(`[data-post-id="${id}"]`)]
          .some(card=>card.textContent.includes('Synthetic rice')&&!card.textContent.includes('Processing')),id,{timeout:10000});
      }catch{pass=false;}
      const elapsedMs=Date.now()-started;
      await page.screenshot({path:`${out}/${engine}.png`});
      results.push({engine,pass,elapsedMs,errors,reads});
    }finally{await context.close();}
  }finally{await browser.close();}
}
await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
if(results.some(result=>!result.pass||result.errors.length))process.exitCode=1;
