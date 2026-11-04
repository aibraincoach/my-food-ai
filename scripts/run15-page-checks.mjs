#!/usr/bin/env node
// Fleet15 §6.7, two named photo posts through the real gallery/composer flow.
// No image is written. Private ledger records only owned post IDs for cleanup.
// node --env-file=.env.local scripts/run14-production-checks.mjs --bidi=ws://127.0.0.1:19515/session --out=uploads/run14/production-checks.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {signInAsTestUser,signInTestClient} from './lib/session.mjs';
const options=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(i<0)throw Error('Use --key=value');return[a.slice(2,i),a.slice(i+1)];}));
const base=new URL(options.url||process.env.APP_URL||'http://127.0.0.1:61360');process.env.APP_URL=base.origin;
const {user}=await signInTestClient(2);if(user.email!==process.env.TEST_USER2_EMAIL||user.email===process.env.TEST_USER_EMAIL)throw Error('Designated account2 required');
const cookie=await signInAsTestUser(2),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const endpoint=options.bidi||'ws://127.0.0.1:19515/session';if(!['127.0.0.1','localhost'].includes(new URL(endpoint).hostname))throw Error('Local browser only');
const ws=new WebSocket(endpoint);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.type==='error'?p.reject(Error(m.message)):p.resolve(m.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error(method+' timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
const unwrap=v=>v?.type==='object'?Object.fromEntries(v.value.map(([k,x])=>[k,unwrap(x)])):v?.type==='array'?v.value.map(unwrap):v?.type==='null'?null:v?.value;
let context;const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function evaluate(expression){const r=await call('script.evaluate',{expression,target:{context},awaitPromise:true,resultOwnership:'none'});if(r.type==='exception')throw Error(r.exceptionDetails.text);return unwrap(r.result);}
async function navigate(path){await call('browsingContext.navigate',{context,url:new URL(path,base).href,wait:'complete'});await pause(1000);}
async function tap(selector,text){const p=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});if(!e)throw Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()`);await call('input.performActions',{context,actions:[{type:'pointer',id:'photo-check-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',origin:'viewport',...p},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});await pause(300);}
async function fill(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Field missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await pause(100);}
async function until(expression,ms=30000){const end=Date.now()+ms;while(Date.now()<end){if(await evaluate(expression))return;await pause(200);}throw Error('Browser condition did not settle');}

const receipt={observedAt:new Date().toISOString(),engine:'Firefox native BiDi, unthrottled',checks:{}};
const local=['127.0.0.1','localhost'].includes(base.hostname);
let owned=[];const userContexts=[];
const checked=r=>{if(r.error)throw Error(r.error.message);return r.data;};
try {
 await call('session.new',{capabilities:{alwaysMatch:{}}});({context}=await call('browsingContext.create',{type:'tab'}));
 await call('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});
 await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(cookie)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax';return true;})()`);
 if(local&&!options.captureOnly){
  for(const ago of [0,65]){const d=new Date();d.setUTCDate(d.getUTCDate()-ago);const p=checked(await admin.from('posts').insert({user_id:user.id,caption:'Fleet15 local page fixture',status:'ready',eaten_at:d.toISOString()}).select('id').single());owned.push(p.id);}
 }
 if(!options.captureOnly){
 await navigate('/');await until(`document.querySelector('nav[aria-label="Days"]')?.children.length>=30`);
 const read=`(()=>{const row=document.querySelector('nav[aria-label="Days"]'),r=row.children[5].getBoundingClientRect();return{count:row.children.length,sixth:{left:r.left,right:r.right},width:innerWidth,scroll:row.scrollLeft,feedTop:document.querySelector('[data-desktop-post],article')?.getBoundingClientRect().top??null};})()`;
 receipt.checks.ringsInitial=await evaluate(read);
 await evaluate(`document.querySelector('nav[aria-label="Days"]').scrollBy({left:100,behavior:'smooth'});true`);await pause(1200);receipt.checks.ringsSnap=await evaluate(read);
 await evaluate(`(()=>{const e=document.querySelector('nav[aria-label="Days"]');e.scrollLeft=e.scrollWidth;return true;})()`);await pause(2000);receipt.checks.ringsEnd=await evaluate(read);
 await evaluate(`window.dispatchEvent(new Event('home-reset'));true`);await pause(1000);receipt.checks.ringsReset=await evaluate(read);
 await navigate('/profile/about');receipt.checks.about=await evaluate(`({title:document.querySelector('h1')?.textContent,models:[...document.querySelectorAll('li')].slice(-4).map(e=>e.textContent)})`);
 if(local){checked(await admin.from('profiles').update({role:'admin'}).eq('id',user.id));await navigate('/admin');receipt.checks.admin=await evaluate(`({title:document.querySelector('h1')?.textContent,rows:[...document.querySelectorAll('table')[0].rows].map(r=>r.textContent)})`);checked(await admin.from('profiles').update({role:'user'}).eq('id',user.id));}
 await navigate('/admin');receipt.checks.nonAdmin=await evaluate(`document.body.innerText`);
 }
 receipt.checks.capture=[];
 for(const [width,height] of [[1366,650],[1024,700]]){
  await call('browsingContext.close',{context});const u=await call('browser.createUserContext');userContexts.push(u.userContext);({context}=await call('browsingContext.create',{type:'tab',userContext:u.userContext}));await call('browsingContext.setViewport',{context,viewport:{width,height},devicePixelRatio:1});await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(cookie)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax';return true;})()`);await navigate('/');
  await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim().startsWith('New post'));if(!b)throw Error('New post missing');b.click();return true;})()`);await pause(1800);
  const metrics=await evaluate(`(()=>{const w=document.querySelector('.desktop-camera-inner[data-round6-capture]'),v=document.querySelector('.desktop-viewfinder'),c=document.querySelector('[aria-label="Capture content"]'),s=document.querySelector('.desktop-shutter-row');return{viewport:[innerWidth,innerHeight],documentHeight:document.scrollingElement.scrollHeight,windowHeight:w?.getBoundingClientRect().height,cameraHeight:v?.getBoundingClientRect().height,shutterBottom:s?.getBoundingClientRect().bottom,contentScroll:c?.scrollHeight,contentHeight:c?.clientHeight};})()`);
  receipt.checks.capture.push(metrics);await tap('button','Take a photo');await until(`!!document.querySelector('textarea[aria-label="Caption"]')`);
  metrics.composer=await evaluate(`(()=>{const e=document.querySelector('.desktop-composer');return{height:e?.getBoundingClientRect().height,scroll:e?.scrollHeight,client:e?.clientHeight,documentHeight:document.scrollingElement.scrollHeight};})()`);
 }
}catch(error){receipt.error=error.message;process.exitCode=1;}finally{
 if(context)try{await call('browsingContext.close',{context});}catch{}
 if(local){for(const id of owned)checked(await admin.from('posts').delete().eq('id',id).eq('user_id',user.id));}
 for(const userContext of userContexts)try{await call('browser.removeUserContext',{userContext});}catch{}
 try{await call('session.end');}catch{}ws.close();await mkdir('uploads/run15',{recursive:true});await writeFile(options.out||'uploads/run15/page-checks.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
}
