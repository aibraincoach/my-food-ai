#!/usr/bin/env node
// Fleet15 lane B: own-fixture overlap, bookmark and leftovers observations.
// No image is written. Private ledger records only owned post IDs for cleanup.
// node --env-file=.env.local scripts/run15-b-production.mjs --bidi=ws://127.0.0.1:19516/session --out=uploads/run15-b/before.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';
const options=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(i<0)throw Error('Use --key=value');return[a.slice(2,i),a.slice(i+1)];}));
const probeDeadline=Date.now()+180000;
const base=new URL(options.url||process.env.APP_URL||'https://my-food-ai-ten.vercel.app');process.env.APP_URL=base.origin;
const {user}=await signInTestClient(2);if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated account2 required');
const cookie=await signInAsTestUser(2),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const endpoint=options.bidi||'ws://127.0.0.1:19516/session';if(!['127.0.0.1','localhost'].includes(new URL(endpoint).hostname))throw Error('Local browser only');
const ws=new WebSocket(endpoint);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='log.entryAdded'&&m.params?.level==='error')receipt.consoleErrors.push({time:new Date().toISOString(),text:m.params.text});const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.type==='error'?p.reject(Error(m.message)):p.resolve(m.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error(method+' timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
const unwrap=v=>v?.type==='object'?Object.fromEntries(v.value.map(([k,x])=>[k,unwrap(x)])):v?.type==='array'?v.value.map(unwrap):v?.type==='null'?null:v?.value;
let context;const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function evaluate(expression){const r=await call('script.evaluate',{expression,target:{context},awaitPromise:true,resultOwnership:'none'});if(r.type==='exception')throw Error(r.exceptionDetails.text);return unwrap(r.result);}
async function navigate(path){await call('browsingContext.navigate',{context,url:new URL(path,base).href,wait:'complete'});await pause(1000);}
async function tap(selector,text){const p=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});if(!e)throw Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);await call('input.performActions',{context,actions:[{type:'pointer',id:'photo-check-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',origin:'viewport',...p},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});await pause(300);}
async function fill(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Field missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await pause(100);}
async function until(expression,ms=30000){const end=Math.min(Date.now()+ms,probeDeadline);while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error('Browser condition did not settle');}
const checked=r=>{if(r.error)throw Error('Owned fixture database operation failed');return r.data;};
const ledger={startedAt:new Date().toISOString(),posts:[],stagePaths:[],savedMeals:[],cleanup:[]},receipt={observedAt:new Date().toISOString(),engine:'Firefox native BiDi,390x844,no CPU throttle available',revision:options.revision||'production #581 / 376e3306 (before Fleet15 B)',consoleErrors:[],checks:{},posts:[]};
await mkdir('uploads/run15-b',{recursive:true});const save=()=>writeFile('uploads/run15-b/'+(options.phase||'before')+'-private-active.json',JSON.stringify(ledger,null,2)+'\n',{mode:0o600});
async function storedPaths(prefix){const paths=[];for(let offset=0;;offset+=1000){const list=checked(await admin.storage.from('media').list(prefix,{limit:1000,offset}));for(const o of list){const path=prefix+'/'+o.name;if(o.id)paths.push(path);else paths.push(...await storedPaths(path));}if(list.length<1000)return paths;}}
const started=Date.now();
async function collect(){
 const state=await evaluate('window.__run15B||null');if(!state)return;
 for(const postId of state.ids)if(!ledger.posts.some(p=>p.id===postId)){ledger.posts.push({id:postId,ownerVerified:false});await save();}
 for(const path of state.stages)if(!ledger.stagePaths.includes(path))ledger.stagePaths.push(path);
 for(const saved of state.saved)if(!ledger.savedMeals.includes(saved))ledger.savedMeals.push(saved);
 receipt.browser=state;await save();
}
async function fileInput(name){const bytes=await readFile(new URL('./fixtures/'+name,import.meta.url));await evaluate(`(()=>{const raw=atob(${JSON.stringify(bytes.toString('base64'))});const file=new File([Uint8Array.from(raw,c=>c.charCodeAt(0))],${JSON.stringify(name)},{type:'image/jpeg'});window.dispatchEvent(new CustomEvent('capture-files',{detail:{files:[file]}}));return true;})()`);}
async function startPhoto(name,caption){
 const prior=await evaluate('window.__run15B.ids.length');
 await tap('button','Post a meal');await tap('button[data-entry]','Camera');await fileInput(name);
 await until(`!!document.querySelector('textarea[aria-label="Caption"]')`);await fill('textarea[aria-label="Caption"]',caption);
 await until(`window.__run15B.ids.length>${prior}`,60000);await collect();const postId=ledger.posts.at(-1).id;
 await until(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Post');return b&&!b.disabled;})()`,60000);
 const tapAt=Date.now();await tap('button','Post');await until(`!document.querySelector('textarea[aria-label="Caption"]')`);
 const result={postId,tapAt:new Date(tapAt).toISOString(),closeMs:Date.now()-tapAt};receipt.posts.push(result);await collect();return result;
}
async function waitReady(postId){const untilAt=Math.min(Date.now()+60000,probeDeadline);while(Date.now()<untilAt){await collect();const row=checked(await admin.from('posts').select('id,user_id,status').eq('id',postId).maybeSingle());if(row){if(row.user_id!==user.id)throw Error('wrong owner');ledger.posts.find(p=>p.id===postId).ownerVerified=true;await save();if(['ready','needs_input','failed'].includes(row.status))return row.status;}await pause(500);}throw Error('post did not settle');}
async function cleanup(){
 if(context){try{await collect();}catch{}try{await call('browsingContext.close',{context});}catch{}context=null;}
 await pause(1500);
 for(const entry of ledger.posts){try{
 const [post,draft]=await Promise.all([admin.from('posts').select('user_id').eq('id',entry.id).maybeSingle().then(checked),admin.from('post_upload_drafts').select('user_id').eq('id',entry.id).maybeSingle().then(checked)]);
 if((post&&post.user_id!==user.id)||(draft&&draft.user_id!==user.id))throw Error('wrong owner, untouched');
 if(!(post?.user_id===user.id||draft?.user_id===user.id||entry.ownerVerified))throw Error('owner not proved, untouched');
 checked(await admin.from('posts').delete().eq('id',entry.id).eq('user_id',user.id));checked(await admin.from('post_upload_drafts').delete().eq('id',entry.id).eq('user_id',user.id));checked(await admin.from('jobs').delete().eq('kind','media_cleanup').contains('payload',{owner_id:user.id,deleted_post_id:entry.id}));
 await pause(1500);const prefix=user.id+'/'+entry.id;for(let n=0;n<2;n++){const paths=await storedPaths(prefix);if(paths.length)checked(await admin.storage.from('media').remove(paths));await pause(500);}
 const remaining=checked(await admin.from('posts').select('id').eq('id',entry.id));const objects=await storedPaths(prefix);ledger.cleanup.push({id:entry.id,absent:!remaining.length&&!objects.length});
 }catch(e){ledger.cleanup.push({id:entry.id,absent:false,error:e.message});}await save();}
 for(const saved of ledger.savedMeals)checked(await admin.from('saved_meals').delete().eq('id',saved).eq('user_id',user.id));
 const ownPaths=ledger.stagePaths.filter(path=>path.startsWith(user.id+'/'));if(ownPaths.length)checked(await admin.storage.from('media').remove(ownPaths));
 const stages=[...new Set(ownPaths.map(path=>path.split('/').slice(0,2).join('/')))];receipt.stageCleanup=[];for(const prefix of stages){const stageId=prefix.split('/')[1];checked(await admin.from('jobs').delete().eq('kind','media_cleanup').contains('payload',{owner_id:user.id,deleted_post_id:stageId}));const remaining=await storedPaths(prefix);receipt.stageCleanup.push({prefix,objects:remaining.length});if(remaining.length)throw Error('Own staged objects remain');}
 receipt.cleanup={created:ledger.posts.length,verifiedAbsent:ledger.cleanup.filter(e=>e.absent).length,stagePathsRemoved:ownPaths.length,savedMealsRemoved:ledger.savedMeals.length};await save();
}
try{
 await call('session.new',{capabilities:{alwaysMatch:{}}});({context}=await call('browsingContext.create',{type:'tab'}));await call('session.subscribe',{events:['log.entryAdded']});await call('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});
 await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(cookie)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax; Secure';return true;})()`);await navigate('/');
 await evaluate(`(()=>{window.__run15B={ids:[],stages:[],saved:[],requests:[],alerts:[]};const s=window.__run15B,original=window.fetch;window.fetch=async(...args)=>{const input=args[0],u=new URL(typeof input==='string'?input:input.url,location.origin),method=args[1]?.method||input.method||'GET',start=Date.now();if(u.origin===location.origin&&u.pathname==='/api/posts'&&method==='POST'){try{const id=JSON.parse(args[1].body).operation_id;if(id&&!s.ids.includes(id))s.ids.push(id);}catch{}}try{const r=await original(...args);let data;try{if(['/api/posts','/api/media/sign-upload','/api/saved'].includes(u.pathname))data=await r.clone().json();}catch{}if(data?.postId&&!s.ids.includes(data.postId))s.ids.push(data.postId);if(u.pathname==='/api/media/sign-upload'&&data?.uploads)for(const upload of data.uploads){s.stages.push(upload.originalPath,upload.feedPath);}if(u.pathname==='/api/saved'&&r.ok&&data?.id)s.saved.push(data.id);s.requests.push({path:u.pathname,method,status:r.status,start,ms:Date.now()-start});return r;}catch(e){s.requests.push({path:u.pathname,method,status:0,start,ms:Date.now()-start,error:e.message});throw e;}};new MutationObserver(()=>{for(const e of document.querySelectorAll('[role="alert"]')){const text=e.textContent;if(text&&!s.alerts.some(a=>a.text===text))s.alerts.push({text,time:Date.now()});}}).observe(document.body,{childList:true,subtree:true,characterData:true});return true;})()`);
 const first=await startPhoto('plate2.jpg','Fleet15 B '+(options.phase||'before')+' fixture 1');let second;
 if(!options.leftoversOnly){await pause(2000);second=await startPhoto('plate3.jpg','Fleet15 B overlap fixture 2');
 receipt.checks.overlap={secondPostPressNeeded:false,first,second};
 await until(`!!document.querySelector('[data-post-id="${first.postId}"] button[aria-label="Save meal"]')`,30000);
 receipt.checks.processingBookmark=await evaluate(`(()=>{const card=document.querySelector('[data-post-id="${first.postId}"]'),b=card.querySelector('button[aria-label="Save meal"]');return {status:card.dataset.postStatus,disabled:b.disabled};})()`);
 await tap(`[data-post-id="${first.postId}"] button[aria-label="Save meal"]`);await pause(1500);await collect();
 }
 first.status=await waitReady(first.postId);if(second)second.status=await waitReady(second.postId);
 if(first.status!=='ready')throw Error('Own leftovers base photo did not become ready: '+first.status);
 // Reuse only our first new post for the leftovers timing. The same open-entry event is dispatched by its Add photo menu.
 await evaluate(`window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:${JSON.stringify(first.postId)},notEaten:true}}))`);await pause(600);
 const attachTap=Date.now();await fileInput('plate3.jpg');await until(`!document.querySelector('[aria-label="Capture content"]')`,90000);receipt.checks.leftovers={inputAt:new Date(attachTap).toISOString(),closeMs:Date.now()-attachTap,scope:'gallery file selection triggers immediate attachment; no separate Post button in this path'};
 await collect();const media=checked(await admin.from('post_media').select('id,position,not_eaten').eq('post_id',first.postId).order('position'));receipt.checks.leftovers.media=media;
 const slideEnd=Math.min(Date.now()+20000,probeDeadline);while(Date.now()<slideEnd){const observed=await evaluate(`(()=>{const c=document.querySelector('[data-post-id="${first.postId}"]');return !!c?.querySelector('[aria-label="Leftovers photo menu"]')})()`);if(observed){receipt.checks.leftovers.slideMs=Date.now()-attachTap;break;}await pause(300);}
 first.finalStatus=await waitReady(first.postId);receipt.checks.leftovers.attachments=checked(await admin.from('post_photo_attachments').select('created_at,position,not_eaten,media_id').eq('post_id',first.postId));
 for(const post of receipt.posts){post.jobs=checked(await admin.from('jobs').select('kind,status,created_at,started_at,finished_at').eq('post_id',post.postId));for(const job of post.jobs){job.queueWaitMs=job.started_at?Date.parse(job.started_at)-Date.parse(job.created_at):null;job.runMs=job.finished_at&&job.started_at?Date.parse(job.finished_at)-Date.parse(job.started_at):null;}}
 await collect();receipt.checks.failingRequests=receipt.browser.requests.filter(r=>r.status>=400||r.status===0);receipt.checks.toastTexts=receipt.browser.alerts;
}catch(e){receipt.error=e.message;process.exitCode=1;}finally{
 await cleanup();if(receipt.browser){receipt.checks.failingRequests=receipt.browser.requests.filter(r=>r.status>=400||r.status===0);receipt.checks.toastTexts=receipt.browser.alerts;}receipt.durationMs=Date.now()-started;await writeFile(options.out||'uploads/run15-b/before.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({error:receipt.error??null,checks:Object.keys(receipt.checks),cleanup:receipt.cleanup}));try{await call('session.end');}catch{}ws.close();
}
