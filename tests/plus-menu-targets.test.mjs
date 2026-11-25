import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {englishIntl} from './fixtures/english-intl.mjs';
import {tokens} from '../src/lib/theme/tokens.ts';
const jsx=(type,props)=>({type,props});
function render(visible,open=true){
 const exports={};let state=0;
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/components/PlusMenu.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require(name){
  if(name==='next-intl')return englishIntl;
  if(name==='react')return{useState:()=>[state++===0?visible:{x:195,y:780},()=>{}],useRef:()=>({current:null}),useEffect(){},useLayoutEffect(){}};
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='@/lib/theme/tokens')return{tokens};
  if(name==='@/components/ui/Icon')return{Icon:'Icon'};
  throw Error(name);
 }});
 return exports.default({open,onClose(){}});
}
function entries(tree){return tree.props.children.flat(Infinity).filter(node=>node?.props?.['data-entry']);}
function centre(node){const s=node.props.style;const match=s.transform?.match(/translate\(([-.\d]+)px,([-.\d]+)px\)/);return{x:s.left+s.width/2+Number(match?.[1]??0),y:s.top+s.height/2+Number(match?.[2]??0)};}
test('all five menu targets are at their settled centres before the visual animation starts',()=>{
 const opening=entries(render(false)),settled=entries(render(true));
 assert.deepEqual(Array.from(opening,n=>n.props['data-entry']),['camera','text','drink','coffee','saved']);
 for(let i=0;i<opening.length;i++)assert.deepEqual(centre(opening[i]),centre(settled[i]),opening[i].props['data-entry']);
});
test('closed menu remains inert and cannot receive pointers',()=>{
 const tree=render(false,false);assert.equal(tree.props.inert,true);assert.equal(tree.props['aria-hidden'],true);assert.equal(tree.props.style.pointerEvents,'none');
});

test('each label has a fixed hit area outside the pointer-transparent animation',()=>{
 for(const visible of [false,true])for(const button of entries(render(visible))){
  const target=button.props.children.find(node=>node?.props&&'data-entry-label-target' in node.props);
  assert.ok(target,button.props['data-entry']);assert.equal(target.props['aria-hidden'],'true');
  assert.equal(target.props.children,button.props['aria-label']);assert.match(target.props.className,/absolute bottom-full mb-2/);
  assert.match(target.props.className,/opacity-0/);assert.doesNotMatch(target.props.className,/pointer-events-none/);
  assert.equal(target.props.style?.transform,undefined);
 }
});
