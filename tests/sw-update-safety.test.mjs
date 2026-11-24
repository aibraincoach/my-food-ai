import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdateSafety,hasUnsentText} from '../src/lib/sw-update-safety.ts';

test('update notification never reloads immediately; next safe point reloads once',async()=>{
 let reloads=0,blocked=false,pending=false;
 const update=createUpdateSafety({blocked:()=>blocked,pending:async()=>pending,reload:()=>reloads++});
 update.ready();assert.equal(reloads,0);
 blocked=true;await update.safePoint();assert.equal(reloads,0);
 blocked=false;pending=true;await update.safePoint();assert.equal(reloads,0);
 pending=false;await update.safePoint();await update.safePoint();assert.equal(reloads,1);
});
test('a sheet/camera/shot appearing during the durable pending check prevents reload',async()=>{
 let blocked=false,release,reloads=0;
 const update=createUpdateSafety({blocked:()=>blocked,pending:()=>new Promise(resolve=>{release=resolve;}),reload:()=>reloads++});
 update.ready();const check=update.safePoint();blocked=true;release(false);await check;assert.equal(reloads,0);
});
test('concurrent safe points coalesce; a failed durable read never reloads or retries',async()=>{
 let reads=0,reloads=0,release;
 const update=createUpdateSafety({blocked:()=>false,pending:()=>{reads++;return new Promise(resolve=>{release=resolve;});},reload:()=>reloads++});
 update.ready();const first=update.safePoint();await update.safePoint();assert.equal(reads,1);release(false);await first;assert.equal(reloads,1);
 const failed=createUpdateSafety({blocked:()=>false,pending:async()=>{throw Error('unreadable');},reload:()=>reloads++});
 failed.ready();await assert.rejects(failed.safePoint(),/unreadable/);assert.equal(reloads,1);
});

import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function pageFixture() {
 const effects=[],frames=new Map();let nextFrame=0,reloads=0,dialogs=false,sheet=false,live=false,pending=false,stored=false,fields=[];
 const worker=new EventTarget();worker.controller={};
 const window=new EventTarget();window.location={reload:()=>reloads++};
 const document=new EventTarget();document.readyState='loading';document.visibilityState='visible';
 document.documentElement={hasAttribute:()=>sheet};document.querySelector=()=>dialogs?{}:null;
 class MediaStream { getVideoTracks(){return [{readyState:'live'}];} }
 document.querySelectorAll=selector=>selector==='video'?(live?[{srcObject:new MediaStream()}]:[]):fields;
 const observers=[];
 const react={useEffect:fn=>effects.push(fn),useRef:value=>({current:value})};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/components/ServiceWorkerRegistration.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:name=>{
  if(name==='@/lib/diagnostics/recorder')return {record:()=>Promise.resolve()};
  if(name==='react')return react;if(name==='next/navigation')return {usePathname:()=>'/'};
  if(name==='@/lib/sw-update-safety')return {createUpdateSafety,hasUnsentText};
  if(name.endsWith('/upload-presence'))return {hasMemoryUploads:()=>pending};
  if(name.endsWith('/upload-store'))return {uploadStore:{hasPending:async()=>stored}};
  throw Error(name);
 },window,document,navigator:{serviceWorker:worker},MediaStream,MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}disconnect(){}},setTimeout,Event,Element:class{},requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id),console});
 exports.default();const cleanups=effects.map(fn=>fn());
 return {message(source=worker.controller){const event=new Event('message');Object.assign(event,{source,data:{type:'app-update-ready'}});worker.dispatchEvent(event);},
  set(value){({dialogs=dialogs,sheet=sheet,live=live,pending=pending,stored=stored,fields=fields}=value);},
  close(){window.dispatchEvent(new Event('entry-closed'));for(const fn of frames.values())fn();frames.clear();},
  hidden(){document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));},
  reloads:()=>reloads,dispose(){cleanups.forEach(fn=>fn?.());}};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('real page listener preserves open composer, live camera, memory shots and durable drafts',async()=>{
 const page=pageFixture();page.message();await settled();assert.equal(page.reloads(),0);
 for(const blocked of [{dialogs:true},{live:true},{pending:true},{stored:true},{sheet:true}]){
  page.set({dialogs:false,live:false,pending:false,stored:false,sheet:false,...blocked});page.hidden();page.close();await settled();assert.equal(page.reloads(),0,JSON.stringify(blocked));
 }
 page.set({dialogs:false,live:false,pending:false,stored:false,sheet:false});page.close();await settled();assert.equal(page.reloads(),1);page.hidden();await settled();assert.equal(page.reloads(),1);page.dispose();
});
test('real page listener ignores foreign messages and removes lifecycle listeners on unmount',async()=>{
 const page=pageFixture();page.message({});page.hidden();await settled();assert.equal(page.reloads(),0);page.message();page.dispose();page.hidden();page.close();await settled();assert.equal(page.reloads(),0);
});

test('real page listener waits for controlled text and applies the update after clearing',async()=>{
 const page=pageFixture(),field={tagName:'INPUT',type:'email',value:'local@example.invalid',defaultValue:'local@example.invalid',getClientRects:()=>[{}],matches:()=>false,hasAttribute:()=>false};
 page.set({fields:[field]});page.message();page.hidden();page.close();await settled();assert.equal(page.reloads(),0);
 field.value='';page.hidden();await settled();assert.equal(page.reloads(),1);page.dispose();
});

test('diagnostic states follow the existing safety decisions without changing reload timing',async()=>{
 const states=[];let blocked=true,reloads=0;
 const update=createUpdateSafety({blocked:()=>blocked,pending:async()=>false,reload:()=>reloads++,observe:state=>states.push(state)});
 update.ready();await update.safePoint();assert.deepEqual(states,['waiting','deferred']);assert.equal(reloads,0);
 blocked=false;await update.safePoint();assert.deepEqual(states,['waiting','deferred','reloading']);assert.equal(reloads,1);
});
