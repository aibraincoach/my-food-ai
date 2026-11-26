import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {imageIdentity,retainedImageUrl} from '../src/lib/media/retained-image.ts';
const source=readFileSync('src/components/Carousel.tsx','utf8'),ast=ts.createSourceFile('Carousel.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='MealPhoto');
const code=ts.transpileModule(fn.getText(ast)+'\nexports.view=MealPhoto;',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const turn=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(priority=true){
 const slots=[],effects=[],frames=new Map();let cursor=0,frameId=0,finished=0,requested=0,resolveSource,resolveMounted,rejectMounted,tree;
 const decodedSource=new Promise(resolve=>{resolveSource=resolve;}),mounted=new Promise((resolve,reject)=>{resolveMounted=resolve;rejectMounted=reject;});
 const exports={};
 const jsx=(type,props)=>{if(type==='img'&&props.ref){props.ref.current??={decode:()=>props['data-first-photo-sharp']!==undefined?mounted:Promise.resolve()};}return{type,props};};
 vm.runInNewContext(code,{exports,AbortController,requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),require:()=>({jsx,jsxs:jsx,Fragment:'fragment'}),
 useTranslations:()=>key=>key,useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},useRef:initial=>{const i=cursor++;return slots[i]??={current:initial};},useEffect:(run,deps)=>{const i=cursor++,old=slots[i];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index]))){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:run()};});}},
 imageIdentity,retainedImageUrl,registerFirstPhoto:()=>{},finishFirstPhoto:()=>{finished++;},firstPhotoUpgrade:()=>{requested++;return decodedSource;},firstPhotoSources:()=>({src:'/small.webp'}),feedPhotoSrcSet:()=>'/sharp.webp 1200w',FEED_PHOTO_SIZES:'100vw',observeNearViewport:()=>()=>{}});
 const render=()=>{cursor=0;tree=exports.view({url:'/photo.webp',priority,alt:'My meal'});while(effects.length)effects.shift()();return tree;};
 return{render,resolveSource,resolveMounted,rejectMounted,frames,finished:()=>finished,requested:()=>requested,images:()=>tree.props.children.filter(child=>child?.type==='img'),status:()=>tree.props.children.find(child=>child?.props?.role==='status'),frame(){const [id,fn]=frames.entries().next().value;frames.delete(id);fn();},dispose(){for(const slot of slots)slot?.cleanup?.();}};
}
test('the mounted sharp sibling decodes and paints before the opaque soft image is removed',async()=>{
 const f=fixture();f.render();assert.equal(f.images().length,1);assert.equal(f.requested(),1);
 f.resolveSource('/sharp.webp');await turn();f.render();let[soft,sharp]=f.images();
 assert.equal(soft.props.alt,'My meal');assert.equal(sharp.props.alt,'');assert.equal(sharp.props['aria-hidden'],true);assert.equal(sharp.props.style.opacity,0);assert.equal(sharp.props.style.transition,'none');assert.match(sharp.props.className,/absolute inset-0/);assert.match(sharp.props.className,/h-full w-full object-cover/);assert.equal(f.finished(),0);
 f.resolveMounted();await turn();assert.equal(f.frames.size,1);f.frame();assert.equal(f.frames.size,1);assert.equal(f.images()[1].props.style.opacity,0);f.frame();f.render();
 [soft,sharp]=f.images();assert.equal(soft.props.alt,'My meal');assert.equal(sharp.props.style.opacity,1);assert.equal(sharp.props['aria-hidden'],true);assert.equal(f.finished(),0);
 f.frame();f.render();assert.equal(f.images().length,1);sharp=f.images()[0];assert.equal(sharp.props.src,'/sharp.webp');assert.equal(sharp.props.alt,'My meal');assert.equal(sharp.props['aria-hidden'],undefined);assert.equal(f.finished(),1);f.dispose();
});
test('a mounted sharp decode failure leaves the soft image opaque and reports the error',async()=>{
 const f=fixture();f.render();f.resolveSource('/sharp.webp');await turn();f.render();f.rejectMounted(Error('decode failed'));await turn();f.render();
 assert.equal(f.images()[0].props.src,'/small.webp');assert.equal(f.images()[1].props.style.opacity,0);assert.equal(f.status().props.children,'sharperPhotoFailed');assert.equal(f.finished(),1);f.dispose();
});
test('unmount cancels reveal frames and does not finish an aborted attempt',async()=>{
 const f=fixture();f.render();f.resolveSource('/sharp.webp');await turn();f.render();f.resolveMounted();await turn();assert.equal(f.frames.size,1);f.dispose();assert.equal(f.frames.size,0);assert.equal(f.finished(),0);
});
test('a non-priority image retains its single asynchronous reader',()=>{
 const f=fixture(false);f.render();assert.equal(f.requested(),0);assert.equal(f.images().length,1);assert.equal(f.images()[0].props.decoding,'async');f.dispose();
});
