#!/usr/bin/env node
// Native Chromium CDP control measurements at CPU 4x. No image is written.
// node --env-file=.env.local scripts/run14-control-table.mjs --cdp=http://127.0.0.1:19425 --out=uploads/run14-controls.json
// Use a dedicated Chromium profile. Only designated test account 2 is signed in.
// DOM/CLS observers measure physical touches; no browser automation library.
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {signInAsTestUser} from './lib/session.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(!a.startsWith('--')||i<0)throw Error('Use --name=value');return[a.slice(2,i),a.slice(i+1)];}));
const base=new URL(args.url||'https://my-food-ai-ten.vercel.app');
if(!['https:','http:'].includes(base.protocol)||base.username||base.password)throw Error('Invalid app origin');
process.env.APP_URL=base.origin;
const bidi=Boolean(args.bidi);const endpoint=args.bidi||args.cdp||'http://127.0.0.1:19425';
if(!['localhost','127.0.0.1','[::1]'].includes(new URL(endpoint).hostname))throw Error('Local CDP endpoint only');
const targets=bidi?[]:await fetch(new URL('/json/list',endpoint)).then(r=>r.json());
const target=targets.find(t=>t.type==='page');if(!bidi&&!target)throw Error('No browser page target');
const ws=new WebSocket(bidi?endpoint:target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});let seq=0;const pending=new Map();let loadResolve;
ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(m.method==='Page.loadEventFired')loadResolve?.();if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.error||m.type==='error')p.reject(Error(m.error?.message||m.message));else p.resolve(m.result);}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
let context;const rows=[];
const unwrap=x=>x?.type==='object'?Object.fromEntries(x.value.map(([k,v])=>[k,unwrap(v)])):x?.type==='array'?x.value.map(unwrap):x?.type==='null'?null:x?.value;
async function evaluate(expression){if(bidi){const r=await send('script.evaluate',{expression,target:{context},awaitPromise:true,resultOwnership:'none'});if(r.type==='exception')throw Error(r.exceptionDetails.text);return unwrap(r.result);}const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result?.value;}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function navigate(path){if(bidi){await send('browsingContext.navigate',{context,url:new URL(path,base).href,wait:'complete'});await pause(1000);return;}let timeout;const loaded=new Promise(resolve=>{loadResolve=resolve;timeout=setTimeout(resolve,20000);});await send('Page.navigate',{url:new URL(path,base).href});await loaded;clearTimeout(timeout);loadResolve=null;await pause(1000);}
async function point(selector,text,nth=0){return evaluate(`(()=>{const all=[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'&&(!e.closest('details:not([open])')||e.tagName==='SUMMARY')&&(${text?`(e.getAttribute('aria-label')||e.textContent||'').trim()===${JSON.stringify(text)}`:'true'});});const e=all[${nth}];if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,disabled:e.matches(':disabled'),tag:e.tagName,text:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,100)};})()`);}
async function pointer(p){if(bidi)return send('input.performActions',{context,actions:[{type:'pointer',id:'control-touch',parameters:{pointerType:'touch'},actions:[{type:'pointerMove',origin:'viewport',x:Math.round(p.x),y:Math.round(p.y)},{type:'pointerDown',button:0},{type:'pause',duration:40},{type:'pointerUp',button:0}]}]});await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:1,radiusY:1,force:1}]});await pause(40);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function preTap(selector,text){const p=await point(selector,text);if(!p)throw Error('Setup control missing: '+text);await pointer(p);await pause(350);}

let modelOriginal;
async function fill(selector,value){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Field absent');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);await pause(100);}
async function enter(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);if(bidi)await send('input.performActions',{context,actions:[{type:'key',id:'field-key',actions:[{type:'keyDown',value:'\uE007'},{type:'keyUp',value:'\uE007'}]}]});else{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}}
async function entry(label){await preTap('button','Post a meal');await preTap('button[data-entry]',label);await pause(300);}

async function instrument(){await evaluate(`(()=>{if(window.__controlObserver)return;window.__controlObserver=true;window.__tapMeasure=null;document.addEventListener('pointerdown',e=>{const started=performance.now();window.__tapMeasure={started,firstMutation:null,pressed:null,cls:null,pointerdowns:(window.__tapMeasure?.pointerdowns||0)+1};const row=window.__tapMeasure;const target=e.target.closest('button,a,summary,input,textarea,select,[role="button"]');setTimeout(()=>{row.pressed=!!target?.hasAttribute('data-tap-pressed');},16);const mo=new MutationObserver(()=>{if(row.firstMutation===null)row.firstMutation=performance.now()-started;});mo.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});setTimeout(()=>mo.disconnect(),2000);if(PerformanceObserver.supportedEntryTypes.includes('layout-shift')){row.cls=0;const po=new PerformanceObserver(list=>{for(const v of list.getEntries())row.cls+=v.value;});po.observe({type:'layout-shift'});setTimeout(()=>po.disconnect(),2000);}},true);return true;})()`);}
async function measure(name,{route='/',selector,text,setup,after,nth=0,scope='production interface'}={}){
 try{await navigate(route);if(setup)await setup();const p=await point(selector,text,nth);if(!p){rows.push({control:name,verdict:'not exercised',reason:'Control absent in this test account/state'});return;}
 await instrument();await evaluate('window.__tapMeasure=null');await pointer(p);await pause(150);const first=await evaluate('window.__tapMeasure');const afterFirst=await evaluate(`({path:location.pathname,dialogs:document.querySelectorAll('[role="dialog"],dialog[open],details[open]').length})`);
 // A second physical tap at the same coordinates exposes toggling, repeated
 // navigation and pending-state guards, without invoking a new target by DOM.
 await pointer(p);await pause(2000);const second=await evaluate('window.__tapMeasure');const afterSecond=await evaluate(`({path:location.pathname,dialogs:document.querySelectorAll('[role="dialog"],dialog[open],details[open]').length})`);
 const changed=first?.firstMutation;rows.push({control:name,hitArea:{width:p.width,height:p.height},disabled:p.disabled,pressed:first?.pressed??null,timeToVisibleMutationMs:changed??null,cumulativeLayoutShift:first?.cls??null,doubleTap:{first:afterFirst,second:afterSecond,pointerdowns:second?.pointerdowns??null},scope,verdict:p.disabled?'not available':changed!==null&&changed!==undefined&&changed<=100&&first?.pressed?'pass':'needs follow-up'});
 if(after)await after();
 }catch(error){rows.push({control:name,verdict:'not exercised',reason:error.message,scope});}
}
try{
 if(bidi){await send('session.new',{capabilities:{alwaysMatch:{}}});({context}=await send('browsingContext.create',{type:'tab'}));await send('browsingContext.setViewport',{context,viewport:{width:390,height:844},devicePixelRatio:1});}else{await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true});await send('Emulation.setCPUThrottlingRate',{rate:4});}
 const jar=await signInAsTestUser(2);await navigate('/sign-in');await evaluate(`(()=>{for(const pair of ${JSON.stringify(jar)}.split('; '))document.cookie=pair+'; Path=/; SameSite=Lax${base.protocol==='https:'?'; Secure':''}';return true;})()`);await navigate('/');
 if(await evaluate(`location.pathname==='/sign-in'`))throw Error('Designated test account sign-in did not reach Home');
 const detail=await evaluate(`document.querySelector('a[aria-label="Open meal details"]')?.getAttribute('href')||document.querySelector('a[href^="/posts/"]')?.getAttribute('href')`);
 const specs=[
 ['Bottom bar Home',{selector:'a',text:'Home'}],['Bottom bar Search',{selector:'a',text:'Search'}],['Bottom bar Days',{selector:'a',text:'Days'}],['Bottom bar Profile',{selector:'a',text:'Profile'}],
 ['Bottom bar +',{selector:'button',text:'Post a meal'}],['Saved meals header',{selector:'button',text:'Saved meals'}],['Today ring',{selector:'button',text:'Photograph a meal today'}],['Past-day ring',{selector:'a[href^="/days/"]'}],
 ['Meal menu',{selector:'summary',text:'Meal menu'}],['Menu Edit caption',{selector:'button',text:'Edit caption',setup:()=>preTap('summary','Meal menu')}],
 ['Thumbs up',{selector:'button',text:'Accept analysis'}],['Thumbs down',{selector:'button',text:'Correct analysis'}],['Comment',{selector:'a',text:'Comment or correct'}],['Log again row',{selector:'button',text:'Log again'}],['Details',{selector:'a',text:'Details ›'}],['Photo',{selector:'a',text:'Open meal details'}],['More',{selector:'button',text:'more'}],['Bookmark',{selector:'button',text:'Save meal'}],['Try again failed post',{selector:'button',text:'Try again'}],
 ['Days month navigation',{route:'/days',selector:'main header button'}],['Days day cell',{route:'/days',selector:'button[data-day]:not(:disabled)'}],
 ['Search field',{route:'/search',selector:'input'}],['Search result',{route:'/search',selector:'a[href^="/posts/"]',setup:async()=>{await fill('input[aria-label="Search meals"]','rice');await enter('input[aria-label="Search meals"]');for(let i=0;i<80;i++){await pause(250);if(!await evaluate(`document.querySelector('[role="status"]')?.textContent?.includes('Searching')`))break;}}}],
 ['Profile grid post',{route:'/profile',selector:'a[href^="/posts/"]'}],['Profile Connect an agent',{route:'/profile',selector:'a[data-agent-row]'}],['Profile model setting',{route:'/profile',selector:'button[role="switch"]',setup:async()=>{modelOriginal=await evaluate(`document.querySelector('button[role="switch"]')?.getAttribute('aria-checked')`);},after:async()=>{if(await evaluate(`document.querySelector('button[role="switch"]')?.getAttribute('aria-checked')`)!==modelOriginal){await preTap('button[role="switch"]');await pause(1000);}if(await evaluate(`document.querySelector('button[role="switch"]')?.getAttribute('aria-checked')`)!==modelOriginal)throw Error('Model setting restoration not verified');}}],
 ];
 if(detail)specs.push(['Detail action row',{route:detail,selector:'button',text:'Accept analysis'}]);
 const extended=[
 ['Capture Text entry',{selector:'button[data-entry]',text:'Text',setup:()=>preTap('button','Post a meal')}],
 ['Capture Photo mode',{selector:'button[role="tab"]',text:'Photo',setup:()=>entry('Camera')}],
 ['Capture Text mode',{selector:'button[role="tab"]',text:'Text',setup:()=>entry('Camera')}],
 ['Capture Barcode mode',{selector:'button[role="tab"]',text:'Barcode',setup:()=>entry('Camera')}],
 ['Capture Caption field',{selector:'textarea[aria-label="Caption"]',setup:()=>entry('Text')}],
 ['Capture Post empty draft',{selector:'button',text:'Post',setup:()=>entry('Text'),scope:'actual disabled empty-draft state; populated Post measured with the dedicated post fixture'}],
 ['Capture shutter',{selector:'button',text:'Take a photo',setup:()=>entry('Camera'),scope:'actual camera availability on this browser; fake-camera publication measured separately'}],
 ['Drink sheet entry',{selector:'button[data-entry]',text:'Drink',setup:()=>preTap('button','Post a meal')}],
 ['Drink description',{selector:'input[aria-label="Drink description"]',setup:()=>entry('Drink')}],
 ['Drink photograph action',{selector:'button',text:'Photograph a drink',setup:()=>entry('Drink')}],
 ['Days month list selection',{route:'/days',selector:'[role="dialog"][aria-label="Go to"] button:not([aria-label])',setup:()=>preTap('main header button')}],
 ['Days day panel',{route:'/days',selector:'button',text:'Close day',setup:async()=>{await preTap('button[data-day]:not(:disabled)');await pause(1200);}}],
 ['Profile Sign out',{route:'/profile',selector:'button',text:'Sign out'}],
 ];
 const selected=args.only==='extended'?extended:args.only==='missing'?specs.filter(([name])=>['More','Try again failed post','Days month navigation','Search result','Profile Connect an agent'].includes(name)):specs.concat(extended);
 for(const [name,options]of selected){await measure(name,options);console.error(JSON.stringify({control:name,verdict:rows.at(-1).verdict}));}
 if(args.only!=='missing')for(const [control,reason]of [
 ['Capture Post populated draft','Requires the named post-merge photo fixture; empty-state Post is a separate measured row.'],
 ['Saved meals Log now offline','Requires offline fixture with verified queued-operation cleanup; online click would create an extra test post.'],
 ['Drink tile double tap','Requires tracked drink fixture and cleanup; measured sheet entry/description/photo action do not prove tile posting.'],
 ['Edit caption Save','Requires a reversible caption-edit fixture or an intercepted failure; opening its sheet is a separate measured row.'],
 ])rows.push({control,verdict:'not exercised',reason});
 const result={observedAt:new Date().toISOString(),app:base.origin,engine:bidi?'Firefox native BiDi touch actions (no CPU throttling available)':'Chromium native CDP touch actions, CPU4x',viewport:{width:390,height:844},limitations:[...(bidi?['Firefox fallback cannot satisfy requested CDP CPU4x throttle.']:[]),'CLS null means this engine did not expose layout-shift; never treat it as zero.','Visible-mutation latency includes the actual global pressed-state mutation; it is not server completion time.','Geometry, physical touch and double-tap outcomes are observed; unexercised rows are explicitly incomplete.'],rows};
 const out=args.out||'uploads/run14-controls.json';await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({out,rows:rows.length,pass:rows.filter(r=>r.verdict==='pass').length,followUp:rows.filter(r=>r.verdict==='needs follow-up').length,unexercised:rows.filter(r=>r.verdict==='not exercised').length}));
}finally{try{if(bidi){if(context)await send('browsingContext.close',{context});await send('session.end');}else await send('Emulation.setCPUThrottlingRate',{rate:1});}catch{}ws.close();}
