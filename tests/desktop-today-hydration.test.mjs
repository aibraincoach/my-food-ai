import {englishIntl} from './fixtures/english-intl.mjs';
import * as formats from '../src/i18n/format.ts';
import {nutritionGaps,gapSentence,GAP_LEAD} from '../src/lib/nutrition/totals.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {dateInZone,validZone} from '../src/lib/posts/days.ts';
import {formatLocalDate,formatLocalTime} from '../src/lib/time/local.ts';
const jsx=(type,props)=>({type,props:props??{}});
const view={date:'2026-11-22',totals:{calories:100,protein_g:5,carbs_g:10,fat_g:4,missing:{}},posts:[{id:'meal',caption:'Synthetic meal',eatenAt:'2026-11-22T13:09:00Z',photoUrl:null,items:[],totals:{calories:100}}]};
function render(phase,deviceZone,zone,initial=view){
 const exports={},local={},react={useState:value=>[value,()=>{}],useEffect(){},useSyncExternalStore:(_subscribe,read,server)=>phase==='mounted'?read():server()};
 const intl={...Intl,DateTimeFormat:function(...args){const format=new Intl.DateTimeFormat(...args);const options=format.resolvedOptions();format.resolvedOptions=()=>({...options,timeZone:deviceZone});return format;}};
 const compile=file=>ts.transpileModule(fs.readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(compile('LocalTime.tsx'),{exports:local,window:{},document:{},Intl:intl,require:name=>name==='react'?react:{formatLocalDate,formatLocalTime}});
 vm.runInNewContext(compile('DesktopToday.tsx'),{exports,Intl:intl,Date,require:name=>{
  if(name==='next-intl')return englishIntl;if(name==='@/i18n/format')return formats;
  if(name==='react')return react;if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};if(name==='next/link')return{default:'a'};
  if(name==='@/lib/ui/use-desktop')return{useDesktop:()=>false};if(name==='@/components/LocalTime')return local;
  if(name==='@/lib/posts/days')return{dateInZone,validZone};if(name==='@/lib/nutrition/totals')return{formatCalories:String,formatNutrition:String,nutritionGaps,gapSentence,GAP_LEAD};throw Error(name);
 }});
 const tree=exports.default({...(initial?{initial}:{}),...(zone?{zone}:{})});const times=[];
 function walk(node){if(Array.isArray(node)){node.forEach(walk);return;}if(!node?.props)return;if(node.type==='span'&&node.props.className==='text-[12px] text-muted')times.push(node.props.children);walk(node.props.children);}
 walk(tree);return times;
}
test('no-cookie server and first client keep the same empty time span, then use the device zone',()=>{
 assert.deepEqual(render('server','America/Edmonton'),['']);
 assert.deepEqual(render('hydrate','Asia/Jakarta'),['']);
 assert.deepEqual(render('mounted','Asia/Jakarta'),['8:09 PM']);
});
test('a cookie zone is the identical snapshot even when server and device zones differ',()=>{
 const server=render('server','America/Edmonton','Asia/Jakarta'),client=render('hydrate','UTC','Asia/Jakarta');
 assert.deepEqual(server,['8:09 PM']);assert.deepEqual(client,server);assert.deepEqual(render('mounted','UTC','Asia/Jakarta'),server);
});

test('the cookie-free loading placeholder does not format an unknown zone',()=>{assert.deepEqual(render('server','America/Edmonton',undefined,null),[]);assert.deepEqual(render('hydrate','Asia/Jakarta',undefined,null),[]);});
