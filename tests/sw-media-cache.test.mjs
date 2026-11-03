// node --test tests/sw-media-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function worker() {
 const handlers=new Map(),stores=new Map(); let fetched=0,fetcher=async()=>new Response(`image-${++fetched}`,{status:200});
 const keyOf=key=>typeof key==='string'?key:key.url;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {
  async match(key){return store.get(keyOf(key))?.clone();},async put(key,response){store.set(keyOf(key),response.clone());},
  async keys(){return [...store.keys()].map(key=>new Request(key));},async delete(key){return store.delete(keyOf(key));}
 };},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 const self={location:{origin:'https://app.example'},addEventListener:(name,fn)=>handlers.set(name,fn),skipWaiting(){},clients:{async claim(){}},registration:{}};
 vm.runInNewContext(source,{self,caches,fetch:request=>fetcher(request),URL,Request,Response,Headers,Promise});
 return {stores,caches,setFetch:fn=>{fetcher=fn;},fetches:()=>fetched,
  async request(url,options={}){let reply;handlers.get('fetch')({request:new Request(url,options),respondWith(value){reply=value;}});return reply?await reply:null;},
  async navigate(url){let reply;handlers.get("fetch")({request:{url,method:"GET",mode:"navigate"},respondWith(value){reply=value;}});return reply?await reply:null;},
  async event(name,data={}){let done;handlers.get(name)({...data,waitUntil(value){done=value;}});await done;}
 };
}
const image='https://storage.example/storage/v1/object/sign/media/owner/post/photo.feed.jpg';
test('feed photos share bytes across renewed signatures; cards and arbitrary requests bypass the cache',async()=>{
 const w=worker();assert.equal(await (await w.request(image+'?token=one')).text(),'image-1');
 assert.equal(await (await w.request(image+'?token=two')).text(),'image-1');assert.equal(w.fetches(),1);
 assert.equal(await w.request(image.replace('.feed.jpg','.png')+'?token=one'),null);
 assert.equal(await w.request(image,{method:'POST'}),null);
 assert.equal(w.stores.get('mfa-media-v1').size,1);
});
test('only successful images are cached and storage remains bounded',async()=>{
 const w=worker();w.setFetch(async()=>new Response('denied',{status:403}));await w.request(image);assert.equal(w.stores.get('mfa-media-v1').size,0);
 w.setFetch(async()=>new Response('ok'));
 for(let i=0;i<302;i++)await w.request(image.replace('photo.feed.jpg',i+'.feed.jpg'));
 assert.equal(w.stores.get('mfa-media-v1').size,300);
 assert.equal(w.stores.get('mfa-media-v1').has(image.replace('photo.feed.jpg','0.feed.jpg')),false);
});
test('sign-out invalidates in-flight images so late responses cannot restore private media',async()=>{
 const w=worker();let finish;w.setFetch(()=>new Promise(resolve=>{finish=resolve;}));
 const pending=w.request(image);
 while(!finish)await new Promise(resolve=>setImmediate(resolve));
 await w.event('message',{data:{type:'clear-media'}});
 finish(new Response('private'));await pending;
 assert.equal(w.stores.has('mfa-media-v1'),false);
});
test('activation removes old shell caches and claims clients',async()=>{
 const w=worker();await w.caches.open('my-food-ai-shell-v1');await w.caches.open('my-food-ai-shell-v2');await w.caches.open('mfa-media-v1');
 await w.event('activate');assert.deepEqual([...w.stores.keys()].sort(),['mfa-media-v1','my-food-ai-shell-v2']);
});

test('authenticated navigations never write their response into a shared cache',async()=>{
 const w=worker();w.setFetch(async()=>new Response('private signed-in HTML'));
 assert.equal(await (await w.navigate('https://app.example/')).text(),'private signed-in HTML');
 assert.equal(w.stores.size,0);
});
test('install caches only credential-free anonymous shell reads',async()=>{
 const w=worker();const requests=[];w.setFetch(async request=>{requests.push(request);return new Response('anonymous');});
 await w.event('install');assert.equal(requests.length,2);
 assert.ok(requests.every(request=>request.credentials==='omit'));
 assert.equal(w.stores.get('my-food-ai-shell-v2').size,2);
});
