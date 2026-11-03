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
function worker({stores=new Map(),mediaPut}={}) {
 const handlers=new Map(),lifetimes=[];let fetched=0,fetcher=async()=>new Response(`image-${++fetched}`,{status:200});
 const keyOf=key=>typeof key==='string'?key:key.url;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {
  async match(key){return store.get(keyOf(key))?.clone();},async put(key,response){if(name===MEDIA)await mediaPut?.();store.set(keyOf(key),response.clone());},
  async keys(){return [...store.keys()].map(key=>new Request(new URL(key,'https://app.example')));},async delete(key){return store.delete(keyOf(key));}
 };},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 const self={location:{origin:'https://app.example'},addEventListener:(name,fn)=>handlers.set(name,fn),skipWaiting(){},clients:{async claim(){}},registration:{}};
 vm.runInNewContext(source,{self,caches,fetch:request=>fetcher(request),URL,Request,Response,Headers,Promise,Date,setTimeout,clearTimeout});
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
 for(const invalid of [resized.replace('app.example','foreign.example'),resized+'?token=capability',resized+'?width=50',resized+'/',resized.replace('/v1.webp','/v2.webp'),resized.replace(FIRST,'not-a-post'),resized.replace(SECOND,'not-a-media'),resized.replace(OWNER,'not-an-owner'),resized.replace('/feed/','/feed/extra/')])assert.equal(await w.request(invalid),null,invalid);
 assert.equal(await w.request(resized,{method:'POST'}),null);
 assert.equal(w.stores.get(MEDIA).size,1);
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
 const w=worker();await w.caches.open('my-food-ai-shell-v1');await w.caches.open('mfa-media-v1');await w.caches.open('my-food-ai-shell-v2');await w.caches.open(MEDIA);
 await w.event('activate');assert.deepEqual([...w.stores.keys()].sort(),[CONTROL,MEDIA,'my-food-ai-shell-v2'].sort());
});
test('signed-in navigation HTML is never added to a shared cache',async()=>{
 const w=worker();w.setFetch(async()=>new Response('private HTML'));assert.equal(await(await w.navigate('https://app.example/')).text(),'private HTML');
 assert.equal(w.stores.get(CONTROL).size,0);assert.equal(w.stores.has('my-food-ai-shell-v2'),false);
});
test('install stores only anonymous shell responses with credentials omitted',async()=>{
 const w=worker(),requests=[];w.setFetch(async request=>{requests.push(request);return new Response('anonymous');});await w.event('install');
 assert.equal(requests.length,2);assert.ok(requests.every(request=>request.credentials==='omit'));assert.equal(w.stores.get('my-food-ai-shell-v2').size,2);
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
