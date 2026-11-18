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
 assert.deepEqual(sources,{src:url.replace('_1080','_640'),srcSet:url.replace('_1080','_640')+' 1x',sizes:'(min-width: 1024px) 520px, 100vw'});
});
test('Home preload and both first-card copies use the shared reader',()=>{
 const home=readFileSync(new URL('../src/app/(tabs)/page.tsx',import.meta.url),'utf8'),carousel=readFileSync(new URL('../src/components/Carousel.tsx',import.meta.url),'utf8');
 assert.match(home,/firstPhotoSources/);assert.match(carousel,/firstPhotoSources/);
 assert.match(home,/<FirstPhoto\b/);assert.doesNotMatch(home,/<img\b[^>]*first\.photoUrl/);
 assert.doesNotMatch(home,/imageSrcSet:feedPhotoSrcSet/);
});
function fixture(complete=false){
 const exports={},events=new Map(),idle=[],images=[];let ready='loading',rejectDecode,resolveDecode;
 const decoded=new Promise((resolve,reject)=>{resolveDecode=resolve;rejectDecode=reject;});
 class Image{constructor(){images.push(this);}decode(){return decoded;}}
 const window={addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:(name,fn)=>{if(events.get(name)===fn)events.delete(name);},requestIdleCallback:(fn,options)=>{idle.push({fn,options});return idle.length;}};
 const document={get readyState(){return complete?'complete':ready;}};
 const source=ts.transpileModule(readFileSync(new URL('../src/lib/posts/feed-photo-url.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,window,document,Image,setTimeout});
 assert.equal(typeof exports.firstPhotoUpgrade,'function');
 return {upgrade:exports.firstPhotoUpgrade,idle,images,load(){ready='complete';events.get('load')?.();},resolveDecode,rejectDecode,decoded};
}
test('both mounted copies share bounded load/idle scheduling and wait for decode',async()=>{
 const f=fixture(),controller=new AbortController();
 const image=()=>({isConnected:true,crossOrigin:'anonymous',src:url.replace('_1080','_640'),decode:()=>f.decoded});
 const first=image(),second=image(),a=f.upgrade(url,first,controller.signal),b=f.upgrade(url,second,controller.signal);
 assert.equal(f.idle.length,0);assert.equal(first.src,url.replace('_1080','_640'));
 f.load();assert.equal(f.idle.length,1);assert.equal(f.idle[0].options.timeout,3000);f.idle[0].fn();await Promise.resolve();
 assert.equal(f.images.length,0);assert.equal(first.src,url);assert.equal(second.src,url);assert.match(first.srcset,/_1200\.webp 1200w/);
 let complete=false;void a.then(()=>{complete=true;});await Promise.resolve();assert.equal(complete,false);
 f.resolveDecode();await Promise.all([a,b]);assert.equal(complete,true);
});
test('decode failure rejects once without downloading another image',async()=>{
 const f=fixture(true),image={isConnected:true,decode:()=>f.decoded},p=f.upgrade(url,image,new AbortController().signal);
 f.idle[0].fn();await Promise.resolve();f.rejectDecode(Error('decode failed'));await assert.rejects(p,/decode failed/);assert.equal(f.images.length,0);assert.equal(f.idle.length,1);
});
test('an old photo cancelled before the idle gate cannot change a reused image',async()=>{
 const f=fixture(true),controller=new AbortController(),image={isConnected:true,src:'new-photo',decode(){throw Error('cancelled photo decoded');}};
 const p=f.upgrade(url,image,controller.signal);controller.abort();f.idle[0].fn();await p;assert.equal(image.src,'new-photo');
});

test('the upgrade decodes the mounted image instead of downloading an off-DOM copy',async()=>{
 const f=fixture(true),controller=new AbortController(),mounted={isConnected:true,src:url.replace('_1080','_640'),decode:()=>Promise.resolve()};
 const pending=f.upgrade(url,mounted,controller.signal);f.idle[0].fn();await Promise.resolve();
 assert.equal(f.images.length,0,'a detached image would be downloaded again when mounted with cache disabled');
 await pending;assert.equal(mounted.src,url);assert.match(mounted.srcset,/_1200\.webp 1200w/);
});
