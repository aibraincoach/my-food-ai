import {englishIntl} from './fixtures/english-intl.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
function fixture(){
 const state=[],effects=[],listeners=new Map(),timers=new Map(),loads=[];let index=0,dirty=true,tree,reloads=0;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const hooks={useState(initial){const i=index++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],v=>{state[i]=typeof v==='function'?v(state[i]):v;dirty=true}]},useCallback(fn,deps){const i=index++;if(!same(state[i]?.deps,deps))state[i]={fn,deps};return state[i].fn},useEffect(fn,deps){const i=index++;if(!same(state[i]?.deps,deps)){const old=state[i];state[i]={deps,cleanup:old?.cleanup};effects.push(()=>{old?.cleanup?.();state[i].cleanup=fn()})}}};
 const jsx=(type,props)=>({type,props:props??{}}),exports={};
 const source=readFileSync(new URL('../src/components/NavigationControls.tsx',import.meta.url),'utf8').replace(/const loadCaptureSheet=[^\n]+;/,'const loadCaptureSheet=()=>globalThis.__loadComposer();');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const window={setTimeout(fn,ms){timers.set(timers.size+1,{fn,ms});return timers.size},clearTimeout(id){timers.delete(id)},addEventListener(n,fn){listeners.set(n,fn)},removeEventListener(n,fn){if(listeners.get(n)===fn)listeners.delete(n)},dispatchEvent(event){listeners.get(event.type)?.(event)},location:{reload(){reloads++}}};
 vm.runInNewContext(code,{exports,window,matchMedia:()=>({matches:false}),__loadComposer:()=>new Promise((resolve,reject)=>loads.push({resolve,reject})),require(n){if(n==='next-intl')return englishIntl;if(n==='react')return hooks;if(n==='react/jsx-runtime')return{jsx,jsxs:jsx,Fragment:'fragment'};if(n==='next/navigation')return{useRouter:()=>({push(){}})};if(n==='@/components/ui/Sheet')return{Sheet:'sheet'};return{default:n}}});
 function render(){index=0;dirty=false;tree=exports.default();while(effects.length)effects.shift()();return tree}
 async function flush(){for(let i=0;i<5;i++){await new Promise(r=>setImmediate(r));if(dirty)render()}}
 function nodes(root=tree){if(!root||typeof root!=='object')return[];return[root,...[root.props?.children].flat(Infinity).filter(x=>x!=null&&x!==false).flatMap(x=>nodes(x))]}
 render();return{loads,timers,flush,render,nodes,open(entry='text'){window.dispatchEvent({type:'open-entry',detail:{entry}});render()},close(){window.dispatchEvent({type:'close-sheets'});render()},toggleMenu(){nodes().find(n=>n.type==='@/components/BottomBar').props.onPlus();render()},hide(){window.dispatchEvent({type:'pagehide'});render()},get menuOpen(){return nodes().find(n=>n.type==='@/components/PlusMenu').props.open},get reloads(){return reloads}};
}
test('entry opens a pending sheet before the composer file arrives',()=>{
 const f=fixture();f.open();assert.equal(f.loads.length,1);assert.ok(f.nodes().some(x=>x.type==='sheet'&&x.props.open),'the pending entry stays visible');assert.ok(f.nodes().some(x=>x.props.children==='Opening composer…'));
});
test('a failed file stays visible and only a pressed retry loads again',async()=>{
 const f=fixture();f.open();f.loads[0].reject(Error('file failed'));await f.flush();
 assert.ok(f.nodes().some(x=>x.props.role==='alert'&&x.props.children==='Couldn’t open composer.'));
 assert.equal(f.loads.length,1);for(const timer of f.timers.values())timer.fn();await f.flush();assert.equal(f.loads.length,1,'no timer may retry an open failed entry');
 const retry=f.nodes().find(x=>x.type==='button'&&x.props.children==='Try again');assert.ok(retry);retry.props.onClick();f.render();assert.equal(f.loads.length,2);
 function Composer(){}f.loads[1].resolve(Composer);await f.flush();assert.ok(f.nodes().some(x=>x.type===Composer));assert.equal(f.nodes().some(x=>x.type==='sheet'&&x.props.open),false);
});
test('failed background prefetch is not a loaded composer',async()=>{
 const f=fixture();for(const timer of f.timers.values())timer.fn();assert.equal(f.loads.length,1);f.loads[0].reject(Error('prefetch failed'));await f.flush();f.open();assert.equal(f.loads.length,2);assert.ok(f.nodes().some(x=>x.props.children==='Opening composer…'));
});
test('reloading after a missing old file requires an explicit press',async()=>{
 const f=fixture();f.open();f.loads[0].reject(Error('missing old file'));await f.flush();assert.equal(f.reloads,0);const button=f.nodes().find(x=>x.type==='button'&&x.props.children==='Reload app');assert.ok(button);button.props.onClick();assert.equal(f.reloads,1);
});
test('a new explicit entry request after failure starts a new load',async()=>{
 const f=fixture();f.open();f.loads[0].reject(Error('failed'));await f.flush();f.open('camera');assert.equal(f.loads.length,2);assert.ok(f.nodes().some(x=>x.props.children==='Opening composer…'));
});

test('pagehide closes the plus menu without closing an open capture entry',()=>{
 const f=fixture();assert.equal(f.menuOpen,false);f.toggleMenu();assert.equal(f.menuOpen,true);f.hide();assert.equal(f.menuOpen,false);
 f.open('camera');f.hide();assert.ok(f.nodes().some(n=>n.type==='sheet'&&n.props.open),'capture draft stays open');
});
