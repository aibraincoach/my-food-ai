import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import vm from 'node:vm';import {createTranslator} from 'next-intl';
const source=fs.readFileSync('src/app/(tabs)/page.tsx','utf8'),ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='HomeDays');assert.ok(fn);
const code=ts.transpileModule(fn.getText(ast)+'\nexports.view=HomeDays;',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
for(const locale of ['en','ja'])test(locale+': failed day reads render unavailable instead of empty meal rings',async()=>{
 const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json')),t=createTranslator({locale,messages,namespace:'feed'}),exports={};const Rings=()=>{throw Error('must not show empty rings');};
 vm.runInNewContext(code,{exports,require:()=>({jsx:(type,props)=>({type,props})}),connection:async()=>{},homeZone:async()=>({zone:'UTC',known:true}),dateInZone:()=> '2026-11-25',homeReader:async()=>{throw Error('read unavailable');},homeDeadline:read=>read,getTranslations:async()=>t,DayRings:Rings});
 const tree=await exports.view();assert.equal(tree.type,'p');assert.equal(tree.props.role,'status');assert.equal(tree.props.children,messages.feed.daySummariesFailed);assert.equal(tree.props['data-day-summaries-unavailable'],true);
});
