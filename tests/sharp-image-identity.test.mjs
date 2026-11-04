import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {feedPhotoSrcSet} from '../src/lib/posts/feed-photo-url.ts';
import {imageIdentity,retainedImageUrl} from '../src/lib/media/retained-image.ts';
const first='/api/media/feed/owner/post/first/v2.webp',second='/api/media/feed/owner/post/second/v2.webp';
function component(file,name){
 const slots=[],images=[];let cursor=0,effects=[];
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;return slots[i]??=( {current:initial});},useEffect(run,deps){const i=cursor++,old=slots[i];if(!old||deps.some((value,index)=>!Object.is(value,old.deps[index]))){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:run()};});}},useLayoutEffect(){cursor++;}};
 const source=readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8')+`\nexport {${name}};`;
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,exports={};
 vm.runInNewContext(compiled,{exports,Image:class{constructor(){images.push(this);}},require(dependency){
  if(dependency==='react')return hooks;
  if(dependency==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(dependency==='@/lib/posts/feed-photo-url')return{feedPhotoSrcSet};
  if(dependency==='@/lib/media/retained-image')return{imageIdentity,retainedImageUrl};
  return{};
 }});
 return{images,render(props){cursor=0;effects=[];const tree=exports[name](props);for(const effect of effects)effect();const find=node=>!node?undefined:node.type==='img'?node.props:Array.isArray(node)?node.map(find).find(Boolean):find(node.props?.children);return find(tree);}};
}
for(const [file,name,props]of[
 ['Carousel.tsx','MealPhoto',url=>({url,priority:true,alt:'Meal'})],
 ['PostOpenFrame.tsx','Photo',url=>({post:{photoUrl:url,slides:[],caption:'Meal'},square:true})],
 ['OutlineOverlay.tsx','DetailImage',url=>({photo:{url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal'})],
])test(`${name}: a failed density candidate affects that image only across mounted rerenders`,()=>{
 const view=component(file,name);
 let image=view.render(props(first));assert.equal(image.srcSet,feedPhotoSrcSet(first));
 image.onError();image=view.render(props(first));assert.equal(image.srcSet,undefined);
 image=view.render(props(second));assert.equal(image.src,second);assert.equal(image.srcSet,feedPhotoSrcSet(second));
 image=view.render(props(first));assert.equal(image.srcSet,undefined,'the failed identity remains on its fallback');
});
test('DetailImage switches from a loaded original to the new photo preview immediately',()=>{
 const view=component('OutlineOverlay.tsx','DetailImage');
 const props=url=>({photo:{url:url.replace('/v2.webp','/original.jpg'),previewUrl:url},alt:'Meal'});
 view.render(props(first));view.images[0].onload();
 let image=view.render(props(first));assert.equal(image.src,props(first).photo.url);
 image=view.render(props(second));assert.equal(image.src,second);assert.equal(image.srcSet,feedPhotoSrcSet(second));
 view.images[0].onload();image=view.render(props(second));assert.equal(image.src,second,'late callback for the old photo cannot replace the new preview');
 view.images[1].onload();image=view.render(props(second));assert.equal(image.src,props(second).photo.url);assert.equal(image.srcSet,undefined);
});
