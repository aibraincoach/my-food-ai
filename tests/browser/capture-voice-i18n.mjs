import fs from'node:fs/promises';import assert from'node:assert/strict';import{postVoiceAndReadRenderedResult}from'./voice-result.mjs';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1')throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8')),f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8')),{chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright'),b=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{}),r={engine,cases:[]},ids=[];
try{
 for(const locale of['en','ja']){
 const m=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')),c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',...(engine==='chromium'?{permissions:['microphone']}: {})});
 await c.addCookies([...cookies.map(x=>({name:x.name,value:x.value,url:app})),{name:'lang',value:locale,url:app},{name:'time-zone',value:'UTC',url:app}]);
 if(engine==='webkit')await c.addInitScript(()=>{Object.defineProperty(MediaDevices.prototype,'getUserMedia',{configurable:true,writable:true,value:async()=>{const a=new AudioContext(),o=a.createOscillator(),d=a.createMediaStreamDestination();o.connect(d);o.start();await a.resume();window.__syntheticAudio=a;return d.stream;}});});
 const p=await c.newPage();
 try{const v=await postVoiceAndReadRenderedResult(p,{app,handle:f.handle,words:{postMeal:m.navigation.postMeal,text:m.navigation.text,speak:m.capture.speak,stop:m.capture.stopRecording,caption:m.capture.caption,post:m.capture.post},onPost:async id=>{ids.push(id);await fs.writeFile(out+'/'+engine+'-voice-posts.json',JSON.stringify(ids));}});assert.ok(v);r.cases.push({locale,...v});await p.screenshot({path:out+'/'+engine+'-'+locale+'-voice-ready.png'});}finally{await c.close();}
 }
 r.pass=true;
}catch(e){r.pass=false;r.failure=String(e);process.exitCode=1;}finally{await b.close();await fs.writeFile(out+'/'+engine+'-voice.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
