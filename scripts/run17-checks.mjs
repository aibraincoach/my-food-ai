#!/usr/bin/env node
// Fleet 17 readings: post-close (Chromium CDP) and beer (Firefox BiDi). Exits 1 when any check fails or cleanup is incomplete (#628).
// node --env-file=.env.local scripts/run17-checks.mjs --mode=post-close --cdp=http://127.0.0.1:9245 --url=http://127.0.0.1:3000 --out=uploads/run17/post-close.json
// node --env-file=.env.local scripts/run17-checks.mjs --mode=beer --bidi=ws://127.0.0.1:19515/session --url=http://127.0.0.1:3000 --out=uploads/run17/beer.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';

const options=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(i<0)throw Error('Use --key=value');return[a.slice(2,i),a.slice(i+1)];}));
const mode=options.mode||'post-close';
if(!['post-close','beer'].includes(mode))throw Error('Unknown --mode');
const base=new URL(options.url||process.env.APP_URL||'http://127.0.0.1:3000');process.env.APP_URL=base.origin;
const {user}=await signInTestClient(2);
if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated account2 required');
const cookie=await signInAsTestUser(2),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error)throw Error('Owned fixture database operation failed');return r.data;};
const ledger={startedAt:new Date().toISOString(),posts:[],cleanup:[]},receipt={observedAt:new Date().toISOString(),mode,runs:[]};
await mkdir('uploads/run17',{recursive:true});
const save=()=>writeFile(options.ledger||'uploads/run17/checks-private.json',JSON.stringify(ledger,null,2)+'\n',{mode:0o600});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
// #628: the fixture push row is removed at the end of every beer run, including one left by an earlier run.
const PUSH_FIXTURE='https://fcm.googleapis.com/run17-fixture';

async function storedPaths(prefix){const paths=[];for(let offset=0;;offset+=1000){const list=checked(await admin.storage.from('media').list(prefix,{limit:1000,offset}));for(const o of list){const path=prefix+'/'+o.name;if(o.id)paths.push(path);else paths.push(...await storedPaths(path));}if(list.length<1000)return paths;}}

const cdpEndpoint=options.cdp||'http://127.0.0.1:9245';
const bidiEndpoint=options.bidi||'ws://127.0.0.1:9223/session';
const useCdp=mode==='post-close';
if(useCdp&&!['127.0.0.1','localhost'].includes(new URL(cdpEndpoint).hostname))throw Error('Local CDP only');
if(!useCdp&&!['127.0.0.1','localhost'].includes(new URL(bidiEndpoint).hostname))throw Error('Local BiDi only');

let ws,send,evaluate,context,navigate,tap,fill,until;
const CHUNK=480_000;
async function dispatchCaptureFiles(name,bytes,type){
 const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 await evaluate('window.__run17B64=[]');
 for(let i=0;i<u8.length;i+=CHUNK)await evaluate(`window.__run17B64.push(${JSON.stringify(Buffer.from(u8.subarray(i,i+CHUNK)).toString('base64'))})`);
 return evaluate(`(()=>{const raw=window.__run17B64.join('');window.__run17B64=null;const data=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));const file=new File([data],${JSON.stringify(name)},{type:${JSON.stringify(type)}});window.dispatchEvent(new CustomEvent('capture-files',{detail:{files:[file]}}));return data.byteLength;})()`);
}
async function draftEncodedSizes(postId){
 const prefix=`${user.id}/${postId}`;
 for(let i=0;i<20;i++){
  const paths=await storedPaths(prefix);
  const encoded=paths.filter(p=>/\.(jpg|jpeg|webp)$/i.test(p)).map(p=>({name:p.split('/').pop()}));
  if(encoded.length) return encoded;
  await pause(500);
 }
 return [];
}
async function installPostIdHook(){
 await evaluate(`(()=>{window.__fixturePostIds=[];const original=window.fetch;window.fetch=async(...args)=>{try{const u=new URL(typeof args[0]==='string'?args[0]:args[0].url,location.origin);if(u.origin===location.origin&&u.pathname==='/api/posts'&&args[1]?.method==='POST'){const operation=JSON.parse(args[1].body).operation_id;if(typeof operation==='string'&&/^[0-9a-f-]{36}$/i.test(operation)&&!window.__fixturePostIds.includes(operation))window.__fixturePostIds.push(operation);}}catch{}const r=await original(...args);try{const u=new URL(typeof args[0]==='string'?args[0]:args[0].url,location.origin);if(u.origin===location.origin&&u.pathname==='/api/posts'&&r.ok){const data=await r.clone().json();if(data.postId&&!window.__fixturePostIds.includes(data.postId))window.__fixturePostIds.push(data.postId);}}catch{}return r;};return true;})()`);
}
if(useCdp){
 const targets=await fetch(new URL('/json/list',cdpEndpoint)).then(r=>r.json());
 const target=targets.find(t=>t.type==='page');if(!target)throw Error('No Chromium page');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();let loadResolve;
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Page.loadEventFired')loadResolve?.();const p=pending.get(m.id);if(p){pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}};
 send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.has(key)){pending.delete(key);reject(Error(method+' timeout'));}},60000);});
 evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text||JSON.stringify(r.exceptionDetails));return r.result?.value;};
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await send('Emulation.setCPUThrottlingRate',{rate:4});
 await send('Network.enable');
 await send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8,connectionType:'cellular3g'});
 navigate=async path=>{let timeout;const loaded=new Promise(r=>{loadResolve=r;timeout=setTimeout(r,25000);});await send('Page.navigate',{url:new URL(path,base).href});await loaded;clearTimeout(timeout);loadResolve=null;await pause(800);};
 tap=async(selector,text)=>{const p=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});if(!e)throw Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await pause(40);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(300);};
}else{
 ws=new WebSocket(bidiEndpoint);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.type==='error')p.reject(Error(m.message));else p.resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error(method+' timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
 send=call;const unwrap=v=>v?.type==='object'?Object.fromEntries(v.value.map(([k,x])=>[k,unwrap(x)])):v?.type==='array'?v.value.map(unwrap):v?.type==='null'?null:v?.value;
 evaluate=async expression=>{const r=await call('script.evaluate',{expression,target:{context},awaitPromise:true,resultOwnership:'none'});if(r.type==='exception')throw Error(r.exceptionDetails.text);return unwrap(r.result);};
 await call('session.new',{capabilities:{alwaysMatch:{}}});({context}=await call('browsingContext.create',{type:'tab'}));await call('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});
 navigate=async path=>{await call('browsingContext.navigate',{context,url:new URL(path,base).href,wait:'complete'});await pause(1000);};
 tap=async(selector,text)=>{const p=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});if(!e)throw Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);await call('input.performActions',{context,actions:[{type:'pointer',id:'run17-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',origin:'viewport',...p},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});await pause(300);};
}
fill=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Field missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await pause(100);};
until=async(expression,ms=30000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error('Browser condition did not settle');};

async function injectFixture(name,bytes,type,caption,{freshHome=true}={}){
 if(freshHome){await navigate('/');await installPostIdHook();}
 else await evaluate('window.__fixturePostIds=[]');
 await tap('button','Post a meal');await tap('button[data-entry]','Camera');
 await dispatchCaptureFiles(name,bytes,type);
 await until(`!!document.querySelector('textarea[aria-label="Caption"]')`);await fill('textarea[aria-label="Caption"]',caption);
 await until(`window.__fixturePostIds.length>0`,60000);const ids=await evaluate('window.__fixturePostIds');const postId=ids[0];
 ledger.posts.push({id:postId,name,ownerVerified:false});await save();
 for(let i=0;i<100;i++){const [draft,post]=await Promise.all([admin.from('post_upload_drafts').select('id,user_id').eq('id',postId).maybeSingle().then(checked),admin.from('posts').select('id,user_id').eq('id',postId).maybeSingle().then(checked)]);if((draft&&draft.user_id!==user.id)||(post&&post.user_id!==user.id))throw Error('Reservation belongs to another account');if(draft?.user_id===user.id||post?.user_id===user.id){ledger.posts.at(-1).ownerVerified=true;await save();break;}await pause(100);}
 await until(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Post');return !!b&&!b.disabled;})()`,60000);
 const started=Date.now();await tap('button','Post');await until(`!document.querySelector('textarea[aria-label="Caption"]')`,30000);
 const closeMs=Date.now()-started;
 const uploading=await evaluate(`(()=>{const t=[...document.querySelectorAll('*')].find(e=>e.textContent?.includes('Uploading photo'));return !!t;})()`);
 await pause(500);
 const encoded=await draftEncodedSizes(postId);
 return {postId,closeMs,uploading,encoded};
}

try{
 await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(cookie)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax${base.protocol==='https:'?'; Secure':''}';return true;})()`);await navigate('/');
 if(mode==='post-close'){
  const bytes=await sharp(await readFile(new URL('./fixtures/plate3.jpg',import.meta.url))).resize(4032,3024,{fit:'fill'}).jpeg({quality:95}).toBuffer();
  for(let run=1;run<=3;run++){
   const r=await injectFixture('run17-large.jpg',bytes,'image/jpeg','Fleet 17 post-close '+run,{freshHome:true});
   receipt.runs.push(r);
   if(run<3)await pause(8000);
  }
  receipt.pass=receipt.runs.every(r=>r.closeMs<=1000&&r.uploading);
  if(!receipt.pass)process.exitCode=1;
 }else{
  let tickStop=false;const tick=setInterval(()=>{fetch(new URL('/api/jobs/tick',base),{signal:AbortSignal.timeout(20000)}).catch(()=>{});},2500);
  try{
      if(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY){checked(await admin.from('push_subscriptions').upsert({user_id:user.id,endpoint:PUSH_FIXTURE,keys:{p256dh:'A'.repeat(87),auth:'A'.repeat(22)}},{onConflict:'endpoint'}));ledger.pushFixture=true;await save();}
   const bytes=await readFile(new URL('./fixtures/plate3.jpg',import.meta.url));
   const {postId}=await injectFixture('run17-beer.jpg',bytes,'image/jpeg','a glass of beer');
      // #628: every sample names the post it read; the dismiss samples read the second post.
      const samples=[];const snap=async(label,id=postId)=>{
       const post=checked(await admin.from('posts').select('status,needs_input,question').eq('id',id).eq('user_id',user.id).maybeSingle());
       const items=checked(await admin.from('current_post_items').select('name').eq('post_id',id));
       const feed=await evaluate(`(()=>{const link=document.querySelector('a[href="/posts/${id}"]');const card=link?.closest('article')||link;return {card:!!card,statusText:card?.textContent?.slice(0,240)||null};})()`).catch(()=>({card:false}));
    const strip=await evaluate(`(()=>{const row=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('question')||b.textContent?.includes('beer')||b.textContent?.includes('Clarification'));return !!row;})()`).catch(()=>false);
    samples.push({label,id,feed,strip,items:items?.map(i=>i.name),post});
   };
   for(const delay of [1000,5000]){await pause(delay);await snap(`${delay}ms`);}
   let settled=null;for(let i=0;i<40;i++){await pause(5000);await snap(`settle-${i}`);const st=samples.at(-1).post?.status;if(st==='ready'&&samples.at(-1).post?.question){settled=samples.at(-1);break;}if(st==='failed'||st==='needs_input')break;}
      receipt.postId=postId;
      if(!settled)throw Error('The beer post never settled with a question');
   if(settled?.post?.question?.options?.[0]){
    await evaluate(`(()=>{const row=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('A question about this meal'));if(!row)throw Error('Strip row missing');row.click();return true;})()`);
    await until(`!!document.querySelector('[aria-label="Your answer"]')`,15000);
    const option=settled.post.question.options[0];
    await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(option)});if(!b)throw Error('Option missing');b.click();return true;})()`);
    await tap('button','Done');
    for(let i=0;i<24;i++){await pause(5000);await snap(`answer-${i}`);if(!samples.at(-1).post?.question)break;}
   }
   const bytes2=await readFile(new URL('./fixtures/plate3.jpg',import.meta.url));
   const second=await injectFixture('run17-beer-2.jpg',bytes2,'image/jpeg','a glass of beer');
      const dismissId=second.postId;receipt.dismissPostId=dismissId;
      for(let i=0;i<40;i++){await pause(5000);await snap(`dismiss-wait-${i}`,dismissId);if(samples.at(-1).post?.status==='ready'&&samples.at(-1).post?.question)break;}
      const asked=samples.at(-1).post?.question?.question;
      if(samples.at(-1).post?.status!=='ready'||typeof asked!=='string')throw Error('The second beer post never settled with a question');
      // #628: dismiss only this post's own strip row (matched by its own question text) and prove the request reached this post.
      const ownRow=`[...document.querySelectorAll('button[aria-label="Dismiss question"]')].filter(b=>b.parentElement?.textContent?.includes(${JSON.stringify(asked)}))`;
      await until(`${ownRow}.length===1`,30000);
      await evaluate(`(()=>{window.__dismissCalls=[];const original=window.fetch;window.fetch=async(...args)=>{const u=new URL(typeof args[0]==='string'?args[0]:args[0].url,location.origin);const r=await original(...args);if(args[1]?.method==='DELETE')window.__dismissCalls.push({path:u.pathname,status:r.status});return r;};return true;})()`);
      await evaluate(`(()=>{const rows=${ownRow};if(rows.length!==1)throw Error('Expected one strip row for this post, found '+rows.length);rows[0].click();return true;})()`);
      await until(`window.__dismissCalls.length>0`,15000);
      const calls=await evaluate('window.__dismissCalls');receipt.dismissCalls=calls;
      if(calls.length!==1||calls[0].path!==`/api/posts/${dismissId}/question`||calls[0].status!==204)throw Error('Dismiss did not reach this post: '+JSON.stringify(calls));
      await pause(2000);
      await snap('after-dismiss',dismissId);
      const still=checked(await admin.from('posts').select('id,question,status').eq('id',dismissId).eq('user_id',user.id).maybeSingle());
   receipt.samples=samples;
      receipt.pass=Boolean(settled?.feed?.card&&settled?.post?.status==='ready'&&settled?.post?.question&&samples.some(s=>!s.post?.question&&s.label.startsWith('answer'))&&still?.id&&!still?.question&&still?.status==='ready');
      if(!receipt.pass)process.exitCode=1;
  }finally{tickStop=true;clearInterval(tick);}
 }
}catch(error){receipt.error=error.message;process.exitCode=1;}finally{
 if(useCdp)try{await send('Emulation.setCPUThrottlingRate',{rate:1});}catch{}
 if(!useCdp&&context)try{await send('browsingContext.close',{context});await send('session.end');}catch{}
 if(ws)ws.close();
 for(const entry of ledger.posts){try{
  const prefix=user.id+'/'+entry.id;
  checked(await admin.from('posts').delete().eq('id',entry.id).eq('user_id',user.id));
  checked(await admin.from('post_upload_drafts').delete().eq('id',entry.id).eq('user_id',user.id));
  for(let pass=0;pass<2;pass++){const paths=await storedPaths(prefix);if(paths.length)checked(await admin.storage.from('media').remove(paths));await pause(300);}
  ledger.cleanup.push({id:entry.id,absent:true});
 }catch(e){ledger.cleanup.push({id:entry.id,error:e.message});process.exitCode=1;}await save();}
    if(mode==='beer')try{checked(await admin.from('push_subscriptions').delete().eq('user_id',user.id).eq('endpoint',PUSH_FIXTURE));if(checked(await admin.from('push_subscriptions').select('id').eq('user_id',user.id).eq('endpoint',PUSH_FIXTURE)).length)throw Error('Push fixture still present');ledger.cleanup.push({pushFixture:'removed'});}catch(e){ledger.cleanup.push({pushFixture:e.message});process.exitCode=1;}await save();
 await writeFile(options.out||`uploads/run17/${mode}.json`,JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({mode,pass:receipt.pass??null,runs:receipt.runs?.length??0,error:receipt.error??null}));
}
