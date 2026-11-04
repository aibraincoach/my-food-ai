#!/usr/bin/env node
// Fleet14 §6.7, two named photo posts through the real gallery/composer flow.
// No image is written. Private ledger records only owned post IDs for cleanup.
// node --env-file=.env.local scripts/run14-production-checks.mjs --bidi=ws://127.0.0.1:19424/session --out=uploads/run14/production-checks.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';
const options=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(i<0)throw Error('Use --key=value');return[a.slice(2,i),a.slice(i+1)];}));
const base=new URL(options.url||process.env.APP_URL||'https://my-food-ai-ten.vercel.app');process.env.APP_URL=base.origin;
const {user}=await signInTestClient(2);if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated account2 required');
const cookie=await signInAsTestUser(2),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const endpoint=options.bidi||'ws://127.0.0.1:19424/session';if(!['127.0.0.1','localhost'].includes(new URL(endpoint).hostname))throw Error('Local browser only');
const ws=new WebSocket(endpoint);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.type==='error'?p.reject(Error(m.message)):p.resolve(m.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error(method+' timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
const unwrap=v=>v?.type==='object'?Object.fromEntries(v.value.map(([k,x])=>[k,unwrap(x)])):v?.type==='array'?v.value.map(unwrap):v?.type==='null'?null:v?.value;
let context;const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function evaluate(expression){const r=await call('script.evaluate',{expression,target:{context},awaitPromise:true,resultOwnership:'none'});if(r.type==='exception')throw Error(r.exceptionDetails.text);return unwrap(r.result);}
async function navigate(path){await call('browsingContext.navigate',{context,url:new URL(path,base).href,wait:'complete'});await pause(1000);}
async function tap(selector,text){const p=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});if(!e)throw Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);await call('input.performActions',{context,actions:[{type:'pointer',id:'photo-check-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',origin:'viewport',...p},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});await pause(300);}
async function fill(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Field missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await pause(100);}
async function until(expression,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error('Browser condition did not settle');}
const checked=r=>{if(r.error)throw Error('Owned fixture database operation failed');return r.data;};
const ledger={startedAt:new Date().toISOString(),posts:[],cleanup:[]},receipt={observedAt:new Date().toISOString(),engine:'Firefox native BiDi,390x844,no CPU throttle available',checks:{},posts:[]};
await mkdir('uploads/run14',{recursive:true});const save=()=>writeFile('uploads/run14/production-checks-private.json',JSON.stringify(ledger,null,2)+'\n',{mode:0o600});
async function storedPaths(prefix){const paths=[];for(let offset=0;;offset+=1000){const list=checked(await admin.storage.from('media').list(prefix,{limit:1000,offset}));for(const o of list){const path=prefix+'/'+o.name;if(o.id)paths.push(path);else paths.push(...await storedPaths(path));}if(list.length<1000)return paths;}}
async function photoPost(name,bytes,type,caption){
 await navigate('/');await evaluate(`(()=>{window.__fixturePostIds=[];const original=window.fetch;window.fetch=async(...args)=>{try{const u=new URL(typeof args[0]==='string'?args[0]:args[0].url,location.origin);if(u.origin===location.origin&&u.pathname==='/api/posts'&&args[1]?.method==='POST'){const operation=JSON.parse(args[1].body).operation_id;if(typeof operation==='string'&&/^[0-9a-f-]{36}$/i.test(operation)&&!window.__fixturePostIds.includes(operation))window.__fixturePostIds.push(operation);}}catch{}const r=await original(...args);try{const u=new URL(typeof args[0]==='string'?args[0]:args[0].url,location.origin);if(u.origin===location.origin&&u.pathname==='/api/posts'&&r.ok){const data=await r.clone().json();if(data.postId&&!window.__fixturePostIds.includes(data.postId))window.__fixturePostIds.push(data.postId);}}catch{}return r;};return true;})()`);
 await tap('button','Post a meal');await tap('button[data-entry]','Camera');
 await evaluate(`(()=>{const raw=atob(${JSON.stringify(bytes.toString('base64'))});const data=Uint8Array.from(raw,c=>c.charCodeAt(0));const file=new File([data],${JSON.stringify(name)},{type:${JSON.stringify(type)}});window.dispatchEvent(new CustomEvent('capture-files',{detail:{files:[file]}}));return true;})()`);
 await until(`!!document.querySelector('textarea[aria-label="Caption"]')`);await fill('textarea[aria-label="Caption"]',caption);
 await until(`window.__fixturePostIds.length>0`,60000);const ids=await evaluate('window.__fixturePostIds');const postId=ids[0];
 ledger.posts.push({id:postId,name,ownerVerified:false});await save();
 let verified=false;for(let i=0;i<100;i++){const [draft,post]=await Promise.all([admin.from('post_upload_drafts').select('id,user_id').eq('id',postId).maybeSingle().then(checked),admin.from('posts').select('id,user_id').eq('id',postId).maybeSingle().then(checked)]);if((draft&&draft.user_id!==user.id)||(post&&post.user_id!==user.id))throw Error('Browser reservation belongs to another account');if(draft?.user_id===user.id||post?.user_id===user.id){verified=true;break;}await pause(100);}if(!verified)throw Error('Browser reservation owner not acknowledged');
 ledger.posts.at(-1).ownerVerified=true;await save();
 await until(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Post');return !!b&&!b.disabled;})()`,60000);
 const started=Date.now();await tap('button','Post');await until(`!document.querySelector('textarea[aria-label="Caption"]')`,30000);
 const closeMs=Date.now()-started;let pendingNames=null,lastStatus=null;
 const end=Date.now()+300000;while(Date.now()<end){const post=checked(await admin.from('posts').select('status,pending_items').eq('id',postId).eq('user_id',user.id).maybeSingle());if(!post){await pause(300);continue;}lastStatus=post.status;if(Array.isArray(post.pending_items)&&post.pending_items.some(p=>typeof p.name==='string'&&p.kcal==null))pendingNames=post.pending_items.map(p=>({name:p.name,kcal:p.kcal}));if(['ready','needs_input','failed'].includes(post.status))break;await pause(300);}
 if(!['ready','needs_input','failed'].includes(lastStatus))throw Error('Photo fixture did not settle in five minutes');
 const detail=checked(await admin.from('current_post_items').select('name,item_nutrition(calories)').eq('post_id',postId));const intake=checked(await admin.from('intake_logs').select('kind,amount,label').eq('post_id',postId));
 const result={fixture:name,idPrefix:postId.slice(0,8),status:lastStatus,closeMs,pendingNames,items:detail,intake};receipt.posts.push(result);return{postId,result};
}
try{
 await call('session.new',{capabilities:{alwaysMatch:{}}});({context}=await call('browsingContext.create',{type:'tab'}));await call('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(cookie)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax${base.protocol==='https:'?'; Secure':''}';return true;})()`);await navigate('/');
 // The historical Fleet9 raw product photograph, not a screenshot of the app.
 const colaResponse=await fetch('https://i.ebayimg.com/images/g/nLYAAOSwC4ZeaqcQ/s-l500.png',{signal:AbortSignal.timeout(30000)});if(!colaResponse.ok)throw Error('Historical cola photograph unavailable');const cola=Buffer.from(await colaResponse.arrayBuffer());
 const drink=await photoPost('fleet14-cola.png',cola,'image/png','Fleet 14 production photographed cola fixture');
 receipt.checks.photographedDrink={status:drink.result.status,caffeineRows:drink.result.intake.filter(r=>r.kind==='caffeine'),scope:'Real pipeline and persisted drink intake; rendered second-slide picture still separately inspected'};
 const meal=await photoPost('fleet14-meal.jpg',await readFile(new URL('./fixtures/plate1.jpg',import.meta.url)),'image/jpeg','Fleet 14 production meal fixture. '+('A deliberately long caption checks the more control and keeps this separate from the owner and recording accounts. '.repeat(5)));
 receipt.checks.earlyFoodNames={observed:meal.result.pendingNames!==null,rows:meal.result.pendingNames};
 await navigate('/');await tap('button','Post a meal');await tap('button[data-entry]','Drink');await pause(1800);
 receipt.checks.drinkTiles=await evaluate(`[...document.querySelectorAll('button[aria-label^="Post "]')].filter(e=>e.getBoundingClientRect().height).map(e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height}})`);
 await navigate('/');await tap('button','Post a meal');await tap('button[data-entry]','Camera');await tap('button[role="tab"]','Barcode');
 receipt.checks.barcodePrompt=await evaluate(`(()=>{const e=document.querySelector('section[aria-label="Scanned product"]');return{present:!!e,background:e?getComputedStyle(e).backgroundColor:null,text:e?.textContent};})()`);
 await navigate('/days');await pause(1200);
 receipt.checks.calendar=await evaluate(`(()=>{const days=[...document.querySelectorAll('button[data-day]')];const today=new Date().toLocaleDateString('en-CA');const visible=days.filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight});return{summary:document.querySelector('p[aria-live="polite"]')?.textContent,visibleDates:visible.map(e=>e.dataset.day),octoberLast:!!document.querySelector('[data-day="2026-10-31"]'),novemberFirst:!!document.querySelector('[data-day="2026-11-01"]'),dayStepMs:days.slice(1).map((e,i)=>Date.parse(e.dataset.day)-Date.parse(days[i].dataset.day)),browserDate:today};})()`);
 for(const month of ['2026-10','2026-11']){await evaluate(`document.querySelector('[data-month-start="${month}"]')?.scrollIntoView({block:'start'})`);await pause(500);receipt.checks.calendar[month]=await evaluate(`({summary:document.querySelector('p[aria-live="polite"]')?.textContent,markerTop:document.querySelector('[data-month-start="${month}"]')?.getBoundingClientRect().top})`);}
}catch(error){receipt.error=error.message;process.exitCode=1;}finally{
 // A request's operation id is captured before transmission, so an ambiguous
 // reservation response still enters the private interruption ledger.
 if(context)try{const extra=await evaluate('window.__fixturePostIds||[]');for(const id of extra)if(!ledger.posts.some(p=>p.id===id))ledger.posts.push({id,name:'interrupted browser fixture',ownerVerified:false});await save();}catch{}
 // Stop browser uploads/retries before cleaning reserved but unpublished drafts.
 if(context){try{await call('browsingContext.close',{context});}catch{}context=null;}
 await pause(1500);
 for(const entry of ledger.posts){try{
  const [draft,post]=await Promise.all([admin.from('post_upload_drafts').select('id,user_id').eq('id',entry.id).maybeSingle().then(checked),admin.from('posts').select('id,user_id').eq('id',entry.id).maybeSingle().then(checked)]);
  if((draft&&draft.user_id!==user.id)||(post&&post.user_id!==user.id))throw Error('Reservation belongs to another owner; left untouched');
  const proved=entry.ownerVerified||draft?.user_id===user.id||post?.user_id===user.id;
  const prefix=user.id+'/'+entry.id;
  if(proved){
   // The posts row may never have existed. Drafts and their detached cleanup
   // jobs still require removal, along with every object under the owned id.
   checked(await admin.from('posts').delete().eq('id',entry.id).eq('user_id',user.id));
   checked(await admin.from('post_upload_drafts').delete().eq('id',entry.id).eq('user_id',user.id));
   checked(await admin.from('jobs').delete().eq('kind','media_cleanup').contains('payload',{owner_id:user.id,deleted_post_id:entry.id}));
   await pause(1500);for(let pass=0;pass<2;pass++){const paths=await storedPaths(prefix);if(paths.length)checked(await admin.storage.from('media').remove(paths));await pause(500);}
  }
  const [posts,drafts,jobs,objects]=await Promise.all([admin.from('posts').select('id').eq('id',entry.id).then(checked),admin.from('post_upload_drafts').select('id').eq('id',entry.id).then(checked),admin.from('jobs').select('id').eq('kind','media_cleanup').contains('payload',{owner_id:user.id,deleted_post_id:entry.id}).then(checked),storedPaths(prefix)]);
  if(posts.length||drafts.length||jobs.length||objects.length)throw Error(proved?'Fixture cleanup verification failed':'Ownership unproved; residual data left untouched');
  ledger.cleanup.push({id:entry.id,absent:true,ownerVerified:Boolean(proved),postRows:0,draftRows:0,cleanupJobs:0,objects:0});
 }catch(error){ledger.cleanup.push({id:entry.id,absent:false,error:error.message});process.exitCode=1;}await save();}
 receipt.cleanup={created:ledger.posts.length,verifiedAbsent:ledger.cleanup.filter(p=>p.absent).length};await writeFile(options.out||'uploads/run14/production-checks.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({checks:Object.keys(receipt.checks),posts:receipt.posts.length,cleanup:receipt.cleanup,error:receipt.error??null}));
 if(context)try{await call('browsingContext.close',{context});}catch{}try{await call('session.end');}catch{}ws.close();
}
