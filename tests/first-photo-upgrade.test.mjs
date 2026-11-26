import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as photo from '../src/lib/posts/feed-photo-url.ts';
const url='/p/33333333-3333-4333-8333-333333333333_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_1080.webp';
test('the first photo reader supplies exactly one fixed 320 first-frame candidate',()=>{
 assert.equal(typeof photo.firstPhotoSources,'function');
 const sources=photo.firstPhotoSources(url);
 assert.deepEqual(sources,{src:url.replace('_1080','_320')});
});
test('Home preload and both first-card copies use the shared reader',()=>{
 const home=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8'),carousel=readFileSync(new URL('../src/components/Carousel.tsx',import.meta.url),'utf8');
 assert.match(carousel,/firstPhotoSources/);assert.doesNotMatch(home,/preloadFirstPhoto|react-dom/);
 assert.match(home,/<FirstPhoto\b/);assert.doesNotMatch(home,/<img\b[^>]*first\.photoUrl/);
 assert.doesNotMatch(home,/imageSrcSet:feedPhotoSrcSet/);
});
function fixture({visible=true,seed=false}={}){
 const exports={},events=new Map(),idle=[],frames=[],copies=[];let intersect,decoded=0,resolveSharp,rejectSharp;
 const sharpReady=new Promise((resolve,reject)=>{resolveSharp=resolve;rejectSharp=reject;});
 const window={innerHeight:844,addEventListener:(name,fn)=>events.set(name,fn),requestIdleCallback:fn=>idle.push(fn)};
 const serverImages=[];const document={readyState:'complete',baseURI:'https://example.test/',querySelectorAll:()=>serverImages};
 const image={isConnected:true,src:url.replace('_1080','_320'),srcset:'',sizes:'',closest:()=>seed?{}:null,getBoundingClientRect:()=>visible?{width:390,height:390,top:100,bottom:490}:{width:0,height:0,top:0,bottom:0},decode:async()=>{decoded++;}};
 const source=ts.transpileModule(readFileSync(new URL('../src/lib/posts/feed-photo-url.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,window,document,URL,setTimeout,Image:class{constructor(){copies.push(this);}get currentSrc(){return new URL(this.src.replace('_1080','_1200'),document.baseURI).href;}decode(){return sharpReady;}},requestAnimationFrame:fn=>frames.push(fn),getComputedStyle:()=>({visibility:'visible'}),IntersectionObserver:class{constructor(fn){intersect=fn;}observe(){}disconnect(){}}});
 return{image,idle,frames,copies,serverImages,resolveSharp,rejectSharp,settled:exports.firstPhotoSettled,register:exports.registerFirstPhoto,without:exports.settleWithoutFirstPhoto,finish:exports.finishFirstPhoto,upgrade:signal=>exports.firstPhotoUpgrade(url,image,signal??new AbortController().signal),show(){visible=true;intersect();},notify(){intersect();},decoded:()=>decoded};
}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
async function finishFrames(f){for(let n=0;n<4;n++){await turn();while(f.frames.length)f.frames.shift()();}}
async function paint(f){f.notify();await finishFrames(f);}
test('sharp fetch keeps its trigger and returns its decoded candidate after the visible small frame',async()=>{
 const f=fixture(),pending=f.upgrade();assert.equal(f.idle.length,1);f.idle.shift()();await turn();assert.equal(f.copies.length,1);assert.equal(f.copies[0].src,url);assert.equal(f.copies[0].crossOrigin,'anonymous');
 f.resolveSharp();await turn();assert.equal(f.image.src,url.replace('_1080','_320'),'sharp ready cannot bypass the first paint');
 f.notify();await turn();assert.equal(f.decoded(),1);assert.equal(f.image.src,url.replace('_1080','_320'));f.frames.shift()();assert.equal(f.image.src,url.replace('_1080','_320'));f.frames.shift()();await finishFrames(f);assert.equal(await pending,'https://example.test/'+url.slice(1).replace('_1080','_1200'));assert.equal(f.image.src,url.replace('_1080','_320'));assert.equal(f.image.srcset,'');assert.equal(f.decoded(),1);
});
test('the temporary hidden server seed does not fetch or upgrade',async()=>{const f=fixture({seed:true});await f.upgrade();assert.equal(f.decoded(),0);assert.equal(f.frames.length,0);assert.equal(f.idle.length,0);});
test('an offscreen first photo fetches sharp on schedule but waits for its visible first frame',async()=>{const f=fixture({visible:false}),pending=f.upgrade();f.idle.shift()();await turn();f.resolveSharp();f.notify();await turn();assert.equal(f.decoded(),0);assert.equal(f.frames.length,0);f.show();await turn();f.frames.shift()();f.frames.shift()();await finishFrames(f);assert.equal(await pending,'https://example.test/'+url.slice(1).replace('_1080','_1200'));assert.equal(f.image.src,url.replace('_1080','_320'));});
test('an aborted image never changes its source',async()=>{const f=fixture(),controller=new AbortController(),pending=f.upgrade(controller.signal);controller.abort();await pending;assert.equal(f.decoded(),0);assert.equal(f.image.src,url.replace('_1080','_320'));});
test('a reused image cancelled after its first frame never swaps',async()=>{const f=fixture(),controller=new AbortController(),pending=f.upgrade(controller.signal);f.idle.shift()();await turn();f.resolveSharp();f.notify();await turn();controller.abort();f.frames.shift()();f.frames.shift()();await finishFrames(f);await pending;assert.equal(f.image.src,url.replace('_1080','_320'));});
test('a failed sharp decode leaves the painted small frame and reports the failure',async()=>{const f=fixture(),pending=f.upgrade();f.idle.shift()();await turn();const rejected=assert.rejects(pending,/sharp failed/);f.rejectSharp(Error('sharp failed'));await paint(f);await rejected;assert.equal(f.image.src,url.replace('_1080','_320'));});

test('first-photo settlement waits for MealPhoto to finish painting the returned candidate',async()=>{
 const f=fixture();f.register();let done=false;void f.settled.then(()=>{done=true;});
 const pending=f.upgrade();f.idle.shift()();await turn();f.resolveSharp();await turn();assert.equal(done,false);
 await paint(f);await pending;await turn();assert.equal(done,false);f.finish();await turn();assert.equal(done,true);assert.equal(f.image.src,url.replace('_1080','_320'));
});
test('a page without a registered priority photo settles at load',async()=>{
 const f=fixture();f.without();await f.settled;
});
test('a registered priority photo does not settle as a no-photo page',async()=>{
 const f=fixture();f.register();let done=false;void f.settled.then(()=>{done=true;});f.without();await turn();assert.equal(done,false);
 const c=new AbortController();c.abort();await f.upgrade(c.signal);await turn();assert.equal(done,false);
});
test('a real failure settles but an aborted attempt does not settle the first-photo sequence',async()=>{
 const f=fixture();f.register();const pending=f.upgrade();f.idle.shift()();await turn();
 const failed=assert.rejects(pending,/sharp failed/);f.rejectSharp(Error('sharp failed'));await paint(f);await failed;await f.settled;
 const g=fixture();g.register();let done=false;void g.settled.then(()=>{done=true;});const c=new AbortController(),aborted=g.upgrade(c.signal);c.abort();await aborted;await turn();assert.equal(done,false);
});

test('a differently selected decoded candidate never replaces the small frame',async()=>{
 const f=fixture(),pending=f.upgrade();f.idle.shift()();await turn();
 Object.defineProperty(f.copies[0],'currentSrc',{value:'https://example.test/unrelated.webp'});f.resolveSharp();
 const rejected=assert.rejects(pending,/candidate does not match/);await paint(f);await rejected;await f.settled;
 assert.equal(f.image.src,url.replace('_1080','_320'));
});

test('server markup protects a priority photo before hydration registers it',async()=>{
 const f=fixture();f.serverImages.push({closest:()=>null});assert.equal(f.without(),false);let done=false;void f.settled.then(()=>{done=true;});await turn();assert.equal(done,false);
 const seed=fixture();seed.serverImages.push({closest:()=>({})});assert.equal(seed.without(),true);await seed.settled;
});
