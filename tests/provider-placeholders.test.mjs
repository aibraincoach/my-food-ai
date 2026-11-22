import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {appleBrowserEligible} from '../src/lib/auth/apple-browser.ts';

const compile=path=>ts.transpileModule(readFileSync(new URL('../'+path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
function fixture(ua){
 const state=[];let cursor=0,requests=0;
 const jsx=(type,props)=>typeof type==='function'?type(props):({type,props});
 const dependencies={'next-intl':englishIntl,'next-intl/server':englishIntlServer,'next/image':{default:props=>({type:'img',props})},'react/jsx-runtime':{jsx,jsxs:jsx},react:{useState(initial){const at=cursor++;if(!(at in state))state[at]=initial;return[state[at],value=>{state[at]=value;}];}}};
 const load=path=>{const exports={};vm.runInNewContext(compile(path),{exports,fetch(){requests++;throw Error('placeholder must not request');},require(name){assert.ok(name in dependencies,name);return dependencies[name];}});return exports;};
 dependencies['@/components/ui/Button']=load('src/components/ui/Button.tsx');
 dependencies['@/components/ProviderButton']=load('src/components/ProviderButton.tsx');
 dependencies['next/headers']={headers:async()=>({get:name=>name==='user-agent'?ua:null})};
 dependencies['@/lib/auth/apple-browser']={appleBrowserEligible};
 const Providers=load('src/components/AuthProviders.tsx').default;
 return{render:async()=>{cursor=0;return Providers();},requests:()=>requests,Provider:dependencies['@/components/ProviderButton'].default};
}
const nodes=tree=>!tree?[]:Array.isArray(tree)?tree.flatMap(nodes):typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
const text=tree=>!tree?'':Array.isArray(tree)?tree.map(text).join(''):typeof tree==='object'?text(tree.props?.children):String(tree);
for(const[platform,ua,expected]of[
 ['Apple','Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 Mobile/15E148',['Apple','Google','LINE','Facebook','ChatGPT']],
 ['non-Apple','Mozilla/5.0 (X11; Linux x86_64) Chrome/130 Safari/537.36',['Google','LINE','Facebook','ChatGPT']],
])test(platform+' placeholders show Coming soon on tap without request or form submission',async()=>{
 const f=fixture(ua);let tree=await f.render();let buttons=nodes(tree).filter(n=>n.type==='button');
 assert.equal(buttons.length,expected.length);assert.equal(nodes(tree).some(n=>n.type==='form'||n.type==='a'),false);
 for(let i=0;i<expected.length;i++){
  assert.match(text(buttons[i]),new RegExp(expected[i]));assert.match(text(buttons[i]),/Coming soon/);
  assert.notEqual(buttons[i].props.disabled,true);assert.equal(buttons[i].props.type,'button');
  assert.equal(typeof buttons[i].props.onClick,'function');buttons[i].props.onClick();tree=await f.render();
  const status=nodes(tree).find(n=>n.props?.id===expected[i].toLowerCase()+'-coming-soon');
  assert.equal(status?.props.role,'status');assert.equal(text(status),'Coming soon');
  buttons=nodes(tree).filter(n=>n.type==='button');
 }
 assert.equal(f.requests(),0);
});
test('a configured provider uses the same button with its one supplied action',()=>{
 const f=fixture(''),action=async()=>{},tree=f.Provider({provider:'Google',startAction:action}),all=nodes(tree);
 assert.equal(all.find(n=>n.type==='form')?.props.action,action);assert.equal(all.find(n=>n.type==='button')?.props.type,'submit');
 assert.equal(text(tree).includes('Coming soon'),false);
});
