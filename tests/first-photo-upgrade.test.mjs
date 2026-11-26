import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as photo from '../src/lib/posts/feed-photo-url.ts';
const url='/p/33333333-3333-4333-8333-333333333333_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_1080.webp';
test('the first photo reader supplies exactly one 640 candidate and shared sizes',()=>{
 assert.equal(typeof photo.firstPhotoSources,'function');
 const sources=photo.firstPhotoSources(url);
 assert.deepEqual(sources,{src:url.replace('_1080','_640')});
});
test('Home preload and both first-card copies use the shared reader',()=>{
 const home=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8'),carousel=readFileSync(new URL('../src/components/Carousel.tsx',import.meta.url),'utf8');
 assert.match(home,/firstPhotoSources/);assert.match(carousel,/firstPhotoSources/);
 assert.match(home,/<FirstPhoto\b/);assert.doesNotMatch(home,/<img\b[^>]*first\.photoUrl/);
 assert.doesNotMatch(home,/imageSrcSet:feedPhotoSrcSet/);
});
function fixture({complete=true,visible=true,seed=false}={}){
 const exports={},events=new Map(),idle=[],frames=[];let intersect,decoded=0;
 const window={innerHeight:844,addEventListener:(name,fn)=>events.set(name,fn),requestIdleCallback:fn=>idle.push(fn)};
 const document={readyState:complete?'complete':'loading'};
 const image={isConnected:true,src:url.replace('_1080','_640'),srcset:'',sizes:'',closest:()=>seed?{}:null,getBoundingClientRect:()=>visible?{width:390,height:390,top:100,bottom:490}:{width:0,height:0,top:0,bottom:0},decode:async()=>{decoded++;}};
 const source=ts.transpileModule(readFileSync(new URL('../src/lib/posts/feed-photo-url.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,window,document,setTimeout,requestAnimationFrame:fn=>frames.push(fn),getComputedStyle:()=>({visibility:'visible'}),IntersectionObserver:class{constructor(fn){intersect=fn;}observe(){}disconnect(){}}});
 return{image,idle,frames,upgrade:signal=>exports.firstPhotoUpgrade(url,image,signal??new AbortController().signal),show(){visible=true;intersect();},notify(){intersect();},load(){events.get('load')?.();},decoded:()=>decoded};
}
const turn=()=>new Promise(resolve=>setImmediate(resolve));
test('the visible small photo decodes and paints two frames before the idle upgrade',async()=>{
 const f=fixture(),pending=f.upgrade();f.notify();await turn();assert.equal(f.decoded(),1);assert.equal(f.image.src,url.replace('_1080','_640'));assert.equal(f.idle.length,0);
 f.frames.shift()();assert.equal(f.idle.length,0);f.frames.shift()();await turn();assert.equal(f.idle.length,1);assert.equal(f.image.src,url.replace('_1080','_640'));
 f.idle.shift()();await pending;assert.equal(f.image.src,url);assert.match(f.image.srcset,/_1200\.webp 1200w/);assert.equal(f.decoded(),2);
});
test('the temporary hidden server seed does not upgrade',async()=>{const f=fixture({seed:true});await f.upgrade();assert.equal(f.decoded(),0);assert.equal(f.frames.length,0);assert.equal(f.image.src,url.replace('_1080','_640'));});
test('an offscreen image waits for visibility without a frame polling loop',async()=>{const f=fixture({visible:false}),pending=f.upgrade();f.notify();await turn();assert.equal(f.decoded(),0);assert.equal(f.frames.length,0);f.show();await turn();assert.equal(f.decoded(),1);f.frames.shift()();f.frames.shift()();await turn();f.idle.shift()();await pending;assert.equal(f.image.src,url);});
test('an aborted image never changes its source',async()=>{const f=fixture(),controller=new AbortController(),pending=f.upgrade(controller.signal);controller.abort();await pending;assert.equal(f.decoded(),0);assert.equal(f.image.src,url.replace('_1080','_640'));});
test('a reused image cancelled after its first frame never upgrades',async()=>{const f=fixture(),controller=new AbortController(),pending=f.upgrade(controller.signal);f.notify();await turn();controller.abort();f.frames.shift()();f.frames.shift()();await pending;assert.equal(f.idle.length,0);assert.equal(f.image.src,url.replace('_1080','_640'));});
