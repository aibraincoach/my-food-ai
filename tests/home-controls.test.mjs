import * as cardMediaModule from '../src/lib/posts/card-media.ts';
import {englishIntlServer} from './fixtures/english-intl.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file){
 const source=readFileSync(new URL(file,import.meta.url),'utf8');
 const exports={};
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,Date:class extends Date{constructor(){super();throw Error('shell read unstable current time before request boundary');}},Promise,AbortSignal,setTimeout,clearTimeout,require(name){if(name==='@/lib/posts/card-media')return cardMediaModule;
  if(name==='next-intl/server')return englishIntlServer;
  if(name==='react')return{cache:fn=>fn,Suspense:'Suspense'};
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name==='react-dom')return{preload(){}};
  if(name==='next/server')return{connection(){throw Error('shell waited on request data');}};
  if(name==='next/headers')return{cookies(){throw Error('shell waited on cookies');},headers(){throw Error('shell waited on headers');}};
  if(name==='@/lib/posts/days')return{dateInZone:()=> '2026-11-20'};
  if(name.startsWith('@/lib/'))return{};
  if(name.startsWith('@/components/')||name==='next/link')return{default:name};
  throw Error(name);
 }});
 return{source,render:exports.default};
}
function walk(node,visit,parents=[]){
 if(Array.isArray(node)){for(const child of node)walk(child,visit,parents);return;}
 if(!node?.props)return;
 visit(node,parents);
 walk(node.props.children,visit,[...parents,node]);
}

test('tab navigation streams outside the data and listener Suspense boundaries',async()=>{
 const {source,render}=load('../src/app/(tabs)/layout.tsx');
 assert.doesNotMatch(source,/^["']use client["']/,'the layout must stream its server children independently');
 const found=[];
 walk(await render({children:{type:'SlowPage',props:{}}}),(node,parents)=>{
  if(node.type==='@/components/NavigationControls'||node.type==='@/components/Sidebar'){
   found.push(node.type);
   assert.equal(parents.some(parent=>parent.type==='Suspense'),false,'navigation must not wait on a suspending sibling');
  }
 });
 assert.equal(found.length,2);
});

test('Home renders its header and an empty actionable day ring without any data read',async()=>{
 const {render}=load('../src/app/(tabs)/page.tsx');
 const tree=await render({searchParams:Promise.resolve({})});
 let header=false,rings;
 walk(tree,node=>{
  if(node.type==='header')header=true;
  if(node.type==='Suspense'&&node.props.fallback?.type==='@/components/DayRings')rings=node.props.fallback.props;
 });
 assert.equal(header,true);
 assert.ok(rings,'a blank spacer must not replace the Today action while data is pending');
 assert.equal(rings.pending,true);
 assert.equal(rings.ownerId,undefined);
 assert.equal(rings.zoneKnown,false);
 assert.equal(rings.days.length,0);
 assert.equal(rings.totals.length,0,'pending is unknown, not zero calories');
});
