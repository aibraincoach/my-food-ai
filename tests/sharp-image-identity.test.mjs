import * as readingFormat from '../src/i18n/format.ts';
import {servingsMessageValues} from '../src/i18n/servings.ts';
import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {feedPhotoSrcSet,firstPhotoSources,FEED_PHOTO_SIZES} from '../src/lib/posts/feed-photo-url.ts';
import {imageIdentity,retainedImageUrl} from '../src/lib/media/retained-image.ts';
import {photoBoxStyle,desktopPhotoVars} from '../src/lib/media/photo-box.ts';
const first='/api/media/feed/owner/post/first/v2.webp',second='/api/media/feed/owner/post/second/v2.webp';
function component(file,name){
 const slots=[],images=[];let cursor=0,effects=[],lastTree;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;return slots[i]??=( {current:initial});},useEffect(run,deps){const i=cursor++,old=slots[i];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index]))){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:run()};});}},useLayoutEffect(){cursor++;}};
 const source=readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8')+`\nexport {${name}};`;
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,exports={};
 vm.runInNewContext(compiled,{exports,Image:class{constructor(){images.push(this);}},require(dependency){
 if(dependency==='next-intl')return englishIntl;
 if(dependency==='next-intl/server')return englishIntlServer;
 if(dependency==='@/i18n/format')return readingFormat;
 if(dependency==='@/i18n/servings')return {servingsMessageValues};

  if(dependency==='react')return hooks;
  if(dependency==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(dependency==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet,firstPhotoSources,FEED_PHOTO_SIZES,registerFirstPhoto:()=>{},firstPhotoUpgrade:()=>new Promise(()=>{})};
  if(dependency==='@/lib/media/retained-image')return{imageIdentity,retainedImageUrl};
  if(dependency==='@/lib/media/photo-box')return{photoBoxStyle,desktopPhotoVars};
  return{};
 }});
 return{images,get tree(){return lastTree;},render(props){cursor=0;effects=[];const tree=exports[name](props);lastTree=tree;for(const effect of effects)effect();const find=node=>!node?undefined:node.type==='img'?node.props:Array.isArray(node)?node.map(find).find(Boolean):find(node.props?.children);return find(tree);}};
}
for(const [file,name,props]of[
 ['PostOpenFrame.tsx','Photo',url=>({post:{photoUrl:url,slides:[],caption:'Meal'},square:true})],
])test(`${name}: a failed density candidate affects that image only across mounted rerenders`,()=>{
 const view=component(file,name);
 let image=view.render(props(first));assert.equal(image.srcSet,feedPhotoSrcSet(first));
 image.onError();image=view.render(props(first));assert.equal(image.srcSet,undefined);
 image=view.render(props(second));assert.equal(image.src,second);assert.equal(image.srcSet,feedPhotoSrcSet(second));
 image=view.render(props(first));assert.equal(image.srcSet,undefined,'the failed identity remains on its fallback');
});
test('DetailImage uses the cacheable copy even with outlines, and never preloads a signed original',()=>{
 const view=component('OutlineOverlay.tsx','DetailImage');
 const props=url=>({photo:{id:'photo',url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal',sizes:'390px',sharp:true});
 let image=view.render(props(first));
 assert.equal(view.images.length,0,'outlines must not create an original-image request');
 assert.equal(image.src,first);assert.equal(image.srcSet,feedPhotoSrcSet(first));assert.equal(image.sizes,'390px');
 image=view.render(props(second));assert.equal(image.src,second);assert.equal(image.srcSet,feedPhotoSrcSet(second));
 assert.equal(view.images.length,0);
});
test('DetailImage failure is visible and never retries another density or signed route',()=>{
 const view=component('OutlineOverlay.tsx','DetailImage');
 const props=url=>({photo:{url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal',sizes:'390px'});
 let image=view.render(props(first));image.onError();image=view.render(props(first));
 assert.equal(image.src,first);assert.equal(image.srcSet,feedPhotoSrcSet(first),'failure does not change the request');
 assert.match(JSON.stringify(view.tree),/Meal photo could not be loaded/);
 image=view.render(props(second));assert.equal(image.src,second);assert.doesNotMatch(JSON.stringify(view.tree),/Meal photo could not be loaded/);
 assert.equal(view.images.length,0);
});

test('the first card shows a failed photo visibly without changing to an older source path',()=>{
 const view=component('Carousel.tsx','MealPhoto'),props=url=>({url,priority:true,alt:'Meal'});
 let image=view.render(props(first));assert.equal(image.srcSet,firstPhotoSources(first).srcSet);
 image.onError();image=view.render(props(first));assert.equal(image.srcSet,firstPhotoSources(first).srcSet,'no density retry');
 assert.match(JSON.stringify(view.tree),/Meal photo could not be loaded/);
 image=view.render(props(second));assert.equal(image.src,second);assert.equal(image.srcSet,firstPhotoSources(second).srcSet);
 assert.doesNotMatch(JSON.stringify(view.tree),/Meal photo could not be loaded/,'an old error does not label another photo');
});
