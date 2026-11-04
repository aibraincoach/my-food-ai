// node --test tests/sw-media-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const OWNER='10000000-0000-4000-8000-000000000001',OTHER='20000000-0000-4000-8000-000000000002';
const FIRST='30000000-0000-4000-8000-000000000003',SECOND='40000000-0000-4000-8000-000000000004';
const MEDIA='mfa-media-v2',CONTROL='mfa-media-control-v1';
const image=`https://storage.example/storage/v1/object/sign/media/${OWNER}/post/photo.feed.jpg`;
const resized=`https://app.example/api/media/feed/${OWNER}/${FIRST}/${SECOND}/v1.webp`;
function worker({stores=new Map(),mediaPut,setTimer=setTimeout,active=false,build="test-build",windows=[]}={}) {
 const handlers=new Map(),lifetimes=[];let fetched=0,fetcher=async()=>new Response(`image-${++fetched}`,{status:200});
 const keyOf=key=>typeof key==='string'?key:key.url;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {
  async match(key){return store.get(keyOf(key))?.clone();},async put(key,response){if(name===MEDIA)await mediaPut?.();store.set(keyOf(key),response.clone());},
  async keys(){return [...store.keys()].map(key=>new Request(new URL(key,'https://app.example')));},async delete(key){return store.delete(keyOf(key));}
 };},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 const self={location:{origin:'https://app.example'},addEventListener:(name,fn)=>handlers.set(name,fn),skipWaiting(){},clients:{async claim(){},async matchAll(){return windows;}},registration:{active:active?{}:null}};
 vm.runInNewContext(source,{self,caches,fetch:(request,init)=>fetcher(request,init),URL,Request,Response,Headers,Promise,Date,setTimeout:setTimer,clearTimeout,importScripts(){self.BUILD=build;}});
 const waitUntil=value=>lifetimes.push(Promise.resolve(value));
 const flush=async()=>{while(lifetimes.length)await Promise.all(lifetimes.splice(0));};
 const event=async(name,data={})=>{let pending;handlers.get(name)({...data,waitUntil(value){pending=value;}});await pending;};
 return{stores,caches,flush,setFetch:fn=>{fetcher=fn;},fetches:()=>fetched,
  authenticate:(epoch=FIRST,{userId=OWNER,transition='INITIAL_SESSION',clientId='client-a',blocked=[]}={})=>event('message',{source:{id:clientId},data:{type:'media-session',epoch,userId,transition,blocked,locked:false}}),
  clear:()=>event('message',{data:{type:'clear-media',epoch:FIRST,blocked:[FIRST],locked:false}}),
  async request(url,options={}, {clientId='client-a',settle=true}={}){let reply;handlers.get('fetch')({clientId,request:new Request(url,options),waitUntil,respondWith(value){reply=value;}});const response=reply?await reply:null;if(settle)await flush();return response;},
  async navigate(url,{clientId='old-document',resultingClientId='new-document'}={}){let reply;handlers.get('fetch')({clientId,resultingClientId,request:{url,method:'GET',mode:'navigate'},waitUntil,respondWith(value){reply=value;}});return reply?await reply:null;},event
 };
}
test('authenticated feed photos reuse bytes across signatures; cards bypass the cache',async()=>{
 const w=worker();await w.authenticate();assert.equal(await(await w.request(image+'?token=one')).text(),'image-1');
 assert.equal(await(await w.request(image+'?token=two')).text(),'image-1');assert.equal(w.fetches(),1);
 assert.equal(await w.request(image.replace('.feed.jpg','.png')),null);assert.equal(await w.request(image,{method:'POST'}),null);assert.equal(w.stores.get(MEDIA).size,1);
});
test('immutable resized feed photos match only the exact same-origin UUID route without query aliases',async()=>{
 const w=worker();await w.authenticate();
 assert.equal(await(await w.request(resized)).text(),'image-1');
 assert.equal(await(await w.request(resized)).text(),'image-1');assert.equal(w.fetches(),1);
 for(const invalid of [resized.replace('app.example','foreign.example'),resized+'?token=capability',resized+'?width=50',resized+'/',resized.replace('/v1.webp','/v3.webp'),resized.replace(FIRST,'not-a-post'),resized.replace(SECOND,'not-a-media'),resized.replace(OWNER,'not-an-owner'),resized.replace('/feed/','/feed/extra/')])assert.equal(await w.request(invalid),null,invalid);
 assert.equal(await w.request(resized,{method:'POST'}),null);
 assert.equal(await(await w.request(resized.replace('/v1.webp','/v2.webp'))).text(),'image-2');
 assert.equal(await(await w.request(resized)).text(),'image-1');
 assert.equal(w.stores.get(MEDIA).size,2,'immutable versions never alias each other');
});
test('resized routes cannot borrow another owner or revive a durable logged-out epoch',async()=>{
 const stores=new Map(),w=worker({stores});await w.authenticate();await w.request(resized);
 await w.request(resized.replace(OWNER,OTHER),{}, {settle:false});assert.equal(stores.get(MEDIA).size,1);
 await w.clear();await w.flush();assert.equal(stores.has(MEDIA),false);
 const restarted=worker({stores});await restarted.authenticate(FIRST,{transition:'SIGNED_IN'});await restarted.request(resized);assert.equal(stores.has(MEDIA),false);
 await restarted.authenticate(SECOND);await restarted.request(resized);assert.equal(stores.has(MEDIA),false);
 await restarted.authenticate(SECOND,{transition:'SIGNED_IN',clientId:'new-client'});
 await restarted.request(resized,{}, {clientId:'new-client'});assert.equal(stores.get(MEDIA).size,1);
});
test('a resize finishing after logout cannot persist bytes into a new session',async()=>{
 const w=worker();await w.authenticate();let finish;
 w.setFetch(()=>new Promise(resolve=>{finish=resolve;}));
 const pending=w.request(resized,{}, {settle:false});while(!finish)await new Promise(resolve=>setImmediate(resolve));
 await w.clear();await w.authenticate(SECOND,{transition:'SIGNED_IN',clientId:'new-client'});
 finish(new Response('late-private-resize'));assert.equal(await(await pending).text(),'late-private-resize');await w.flush();
 assert.equal(w.stores.has(MEDIA),false);
});
test('first resized SSR image binds after hydration and validated navigation reuses it',async()=>{
 const w=worker();await w.request(resized,{}, {settle:false});await w.authenticate();await w.flush();
 w.setFetch(async request=>request.mode==='navigate'?new Response('HTML',{headers:{'x-mfa-media-user':OWNER,'x-mfa-media-session':FIRST}}):new Response('unexpected resize'));
 await w.navigate('https://app.example/');assert.equal(await(await w.request(resized,{}, {clientId:'new-document'})).text(),'image-1');
});
test('only successful readable images are cached and entries stay bounded',async()=>{
 const w=worker();await w.authenticate();w.setFetch(async()=>new Response('denied',{status:403}));await w.request(image);assert.equal(w.stores.get(MEDIA)?.size??0,0);
 w.setFetch(async()=>new Response('ok'));
 for(let i=0;i<302;i++)await w.request(image.replace('photo.feed.jpg',i+'.feed.jpg'));
 assert.equal(w.stores.get(MEDIA).size,300);assert.equal(w.stores.get(MEDIA).has(image.replace('photo.feed.jpg','0.feed.jpg')),false);
});
test('logout rejects requests starting after acknowledgement and cannot be undone by the old session',async()=>{
 const w=worker();await w.authenticate();await w.request(image);await w.clear();
 await w.request(image);assert.equal(w.stores.has(MEDIA),false,'new requests from the logging-out page remain uncached');
 await w.authenticate(FIRST,{transition:'SIGNED_IN'});await w.request(image);assert.equal(w.stores.has(MEDIA),false,'repeated SIGNED_IN for the old UUID is not a new login');
 await w.authenticate(FIRST);await w.request(image);assert.equal(w.stores.has(MEDIA),false,'INITIAL_SESSION cannot revive a logged-out identity');
});
test('logout tombstones survive a service-worker restart; only a new explicit epoch reenables caching',async()=>{
 const stores=new Map(),before=worker({stores});await before.authenticate();await before.request(image);await before.clear();
 const after=worker({stores});await after.authenticate();await after.request(image);assert.equal(stores.has(MEDIA),false);
 await after.authenticate(SECOND);await after.request(image);assert.equal(stores.has(MEDIA),false,'an initial registration alone cannot reenble a disabled worker');
 await after.authenticate(SECOND,{transition:'SIGNED_IN',clientId:'client-b'});await after.request(image,{}, {clientId:'client-b'});assert.equal(stores.get(MEDIA).size,1);
 const count=after.fetches();await after.request(image.replace('photo.feed.jpg','old-tab.feed.jpg'));assert.equal(after.fetches(),count+1);assert.equal(stores.get(MEDIA).size,1,'an old tab cannot borrow another client\'s new authorization');
});
test('requests started before or after logout cannot recreate private bytes when they finish late',async()=>{
 for(const afterClear of [false,true]){
  const w=worker();await w.authenticate();if(afterClear)await w.clear();let finish;w.setFetch(()=>new Promise(resolve=>{finish=resolve;}));
  const pending=w.request(image,{}, {settle:false});while(!finish)await new Promise(resolve=>setImmediate(resolve));
  if(!afterClear)await w.clear();
  await w.authenticate(SECOND,{transition:'SIGNED_IN',clientId:'client-b'});
  finish(new Response('old-session-private'));await pending;await w.flush();assert.equal(w.stores.has(MEDIA),false);
 }
});
test('network delivery does not wait for stalled Cache.put or eviction',async()=>{
 for(const photo of [image,resized]){
 let release,started;const began=new Promise(resolve=>{started=resolve;});
 const w=worker({mediaPut:()=>new Promise(resolve=>{release=resolve;started();})});await w.authenticate();
 const delivered=w.request(photo,{}, {settle:false});let timer;
 try{
  const response=await Promise.race([delivered,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('network response blocked on disk persistence')),300);})]);
  assert.equal(await response.text(),'image-1');await began;assert.equal(w.stores.get(MEDIA).size,0);
 }finally{clearTimeout(timer);release?.();await w.flush();}
 assert.equal(w.stores.get(MEDIA).size,1);
 }
});
test('the first SSR image can be persisted after hydration registers its authenticated client',async()=>{
 const w=worker();const response=await w.request(image,{}, {settle:false});assert.equal(await response.text(),'image-1');
 await w.authenticate();await w.flush();assert.equal(w.stores.get(MEDIA).size,1);
 await w.request(image+'?token=renewed');assert.equal(w.fetches(),1,'the second visit already has cached bytes');
});
test('unknown session IDs and foreign-owner paths never authorize cached private media',async()=>{
 const w=worker();await w.authenticate('not-a-session');await w.event('message',{data:{type:'clear-media',epoch:null,blocked:[],locked:true}});await w.request(image);assert.equal(w.stores.has(MEDIA),false);
 const valid=worker();await valid.authenticate();await valid.request(image.replace(OWNER,OTHER));assert.equal(valid.stores.get(MEDIA)?.size??0,0);
});
test('opaque images remain uncached while readable CORS responses can be retained',async()=>{
 const w=worker();await w.authenticate();w.setFetch(async()=>new Proxy(new Response('opaque'),{get(target,key){if(key==='type')return'opaque';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}}));
 await w.request(image);assert.equal(w.stores.get(MEDIA)?.size??0,0);
 w.setFetch(async request=>{assert.equal(request.mode,'cors');return new Response('readable',{headers:{'Access-Control-Allow-Origin':'*'}});});
 await w.request(image,{mode:'cors',credentials:'omit'});assert.equal(w.stores.get(MEDIA).size,1);
});
test('activation retains privacy metadata and retires the old authorization-free media cache',async()=>{
 const w=worker();await w.caches.open('my-food-ai-shell-v1');await w.caches.open('my-food-ai-shell-v3');await w.caches.open('mfa-media-v1');await w.caches.open('my-food-ai-shell-v4');await w.caches.open(MEDIA);
 await w.event('activate');assert.deepEqual([...w.stores.keys()].sort(),[CONTROL,MEDIA,'my-food-ai-shell-v4'].sort());
});
test('signed-in navigation HTML is never added to a shared cache',async()=>{
 const w=worker();w.setFetch(async()=>new Response('private HTML'));assert.equal(await(await w.navigate('https://app.example/')).text(),'private HTML');
 assert.equal(w.stores.get(CONTROL).size,0);assert.equal(w.stores.has('my-food-ai-shell-v4'),false);
});
test('install stores only anonymous shell responses with credentials omitted',async()=>{
 const w=worker(),requests=[];w.setFetch(async request=>{requests.push(request);return new Response('anonymous');});await w.event('install');
 assert.equal(requests.length,3);assert.ok(requests.every(request=>request.credentials==='omit'));assert.equal(w.stores.get('my-food-ai-shell-v4').size,3);
});

test('validated navigation UUID headers authorize the second visit before JavaScript registration',async()=>{
 const w=worker();await w.authenticate();await w.request(image);
 w.setFetch(async request=>request.mode==='navigate'?new Response('private HTML',{headers:{'x-mfa-media-user':OWNER,'x-mfa-media-session':FIRST}}):new Response('unexpected network image'));
 await w.navigate('https://app.example/');const response=await w.request(image+'?token=renewed',{}, {clientId:'new-document'});
 assert.equal(await response.text(),'image-1','the warm SSR priority image must already come from its authenticated cache');
});
test('a validated new navigation epoch can cache its first response after logout without reviving the old epoch',async()=>{
 const w=worker();await w.authenticate();await w.clear();
 w.setFetch(async request=>request.mode==='navigate'?new Response('new login',{headers:{'x-mfa-media-user':OWNER,'x-mfa-media-session':SECOND}}):new Response('new-session-image'));
 await w.navigate('https://app.example/');await w.request(image,{}, {clientId:'new-document'});assert.equal(w.stores.get(MEDIA).size,1);
});


test('logout and unbound clients bypass the browser HTTP cache as well as Cache API',async()=>{
 for(const photo of [image,resized]) {
  const w=worker();await w.authenticate();let signedIn=true,networkReads=0,httpCached;
  w.setFetch(async(request,init)=>{
   if(init?.cache!=="no-store"&&httpCached)return httpCached.clone();
   networkReads++;
   if(!signedIn)return new Response(null,{status:401});
   const response=new Response('private meal',{headers:{'Cache-Control':'private, max-age=31536000, immutable'}});
   if(init?.cache!=="no-store")httpCached=response.clone();
   return response;
  });
  assert.equal(await(await w.request(photo)).text(),'private meal');assert.equal(networkReads,1);
  await w.clear();signedIn=false;
  assert.equal((await w.request(photo)).status,401,'logged-out client must reach origin even with a fresh private HTTP entry');
  assert.equal(networkReads,2);
 }
});

test('a different client cannot borrow a warm browser HTTP response from an active session',async()=>{
 const w=worker();await w.authenticate();let mode;
 w.setFetch(async(request,init)=>{mode=init?.cache;return new Response('origin checked');});
 await w.request(resized,{}, {clientId:'unbound-client',settle:false});
 assert.equal(mode,'no-store');
 await w.clear();await w.flush();
});


test('install warms only anonymous same-origin immutable shell assets, including Flight references',async()=>{
 const w=worker(),requests=[];
 w.setFetch(async request=>{
  requests.push(request);
  const path=new URL(request.url).pathname;
  if(path==='/shell')return new Response(`<script src="/_next/static/chunks/shell.js"></script><link href="/_next/static/immutable/chunks/shell.css">\\"static/chunks/flight.js\\"<script src="https://foreign.example/_next/static/chunks/foreign.js"></script><script src="/_next/static/chunks/private.js"></script><script src="/api/private.js"></script>`);
  return new Response(path,{headers:path.endsWith('/private.js')?{'Cache-Control':'private, immutable'}:{'Cache-Control':'public, max-age=31536000, immutable'}});
 });
 await w.event('install');
 assert.ok(requests.every(r=>r.credentials==='omit'));
 const shell='https://app.example/_next/static/chunks/shell.js',flight='https://app.example/_next/static/chunks/flight.js';
 assert.ok(w.stores.get('my-food-ai-shell-v4').has(shell));assert.ok(w.stores.get('my-food-ai-shell-v4').has(flight));
 assert.equal(requests.some(r=>new URL(r.url).origin!=='https://app.example'),false);
 assert.equal(requests.some(r=>new URL(r.url).pathname==='/api/private.js'),false);
 assert.equal(w.stores.get('my-food-ai-shell-v4').has('https://app.example/_next/static/chunks/private.js'),false);
 w.setFetch(async()=>{throw Error('Public shell bundle should already be cached');});
 assert.equal(await(await w.request(shell)).text(),'/_next/static/chunks/shell.js');
 await w.clear();assert.equal(await(await w.request(flight)).text(),'/_next/static/chunks/flight.js','logout clears private data while public code remains available');
});


test('cached public shell stays available to an active session and never stores the late private response',async()=>{
 const timers=[],w=worker({setTimer:fn=>{timers.push(fn);return 1;}});await w.authenticate();
 await(await w.caches.open('my-food-ai-shell-v4')).put('/shell',new Response('public shell'));
 let release;w.setFetch(()=>new Promise(resolve=>{release=resolve;}));
 const pending=w.navigate('https://app.example/');timers.forEach(fn=>fn());
 assert.equal(await(await pending).text(),'public shell');
 release(new Response('late private feed',{headers:{'x-mfa-media-user':OWNER,'x-mfa-media-session':FIRST}}));await w.flush();
 assert.equal(await(await(await w.caches.open('my-food-ai-shell-v4')).match('/shell')).text(),'public shell');
});

test('logout while navigation waits prevents serving the cached shell after its fallback timer',async()=>{
 const timers=[],w=worker({setTimer:fn=>{timers.push(fn);return 1;}});await w.authenticate();
 await(await w.caches.open('my-food-ai-shell-v4')).put('/shell',new Response('public shell'));
 let release,result;w.setFetch(()=>new Promise(resolve=>{release=resolve;}));
 const pending=w.navigate('https://app.example/').then(response=>{result=response;return response;});
 await w.clear();timers.forEach(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(result,undefined,'signed-out navigation must wait for its origin response');
 release(new Response('signed-out page'));assert.equal(await(await pending).text(),'signed-out page');await w.flush();
});


test('density-specific copies remain distinct and owner-scoped in the private cache',async()=>{
 const w=worker();await w.authenticate();
 for(const variant of ['v2-1040.webp','v2-1560.webp']){
  const url=resized.replace('v1.webp',variant);
  const first=await(await w.request(url)).text();assert.equal(await(await w.request(url)).text(),first);
 }
 assert.equal(w.stores.get(MEDIA).size,2);assert.equal(w.fetches(),2);
 const foreign=worker();await foreign.authenticate();
 await foreign.request(resized.replace('v1.webp','v2-1560.webp').replace(OWNER,OTHER),{}, {settle:false});
 await foreign.clear();await foreign.flush();assert.equal(foreign.stores.has(MEDIA),false);
});

// A service-worker process can disappear after install has completed. Reusing
// only its durable caches models activate starting in a fresh worker process.
test('an updated worker reloads same-origin windows after an install-to-activate restart',async()=>{
 const stores=new Map(),navigated=[];
 const installer=worker({stores,active:true});await installer.event('install');
 const windows=['https://app.example/','https://app.example/posts/meal','https://other.example/'].map(url=>({url,async navigate(target){navigated.push(target);}}));
 const restarted=worker({stores,active:true,windows});await restarted.event('activate');
 assert.deepEqual(navigated,['https://app.example/','https://app.example/posts/meal']);
});
test('a first install never reloads windows even if its worker restarts before activate',async()=>{
 const stores=new Map(),navigated=[];
 const installer=worker({stores});await installer.event('install');
 const restarted=worker({stores,active:true,windows:[{url:'https://app.example/',async navigate(url){navigated.push(url);}}]});
 await restarted.event('activate');assert.deepEqual(navigated,[]);
});
