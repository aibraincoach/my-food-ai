import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import {createTranslator} from 'next-intl';
const code=ts.transpileModule(fs.readFileSync('src/components/FeedConnectionNotice.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
for(const locale of ['en','ja'])test(locale+': saved and offline Home have a visible status, fresh online Home does not',()=>{
 let online=true;const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json')),t=createTranslator({locale,messages,namespace:'feed'}),exports={};
 vm.runInNewContext(code,{exports,require:name=>name==='react'?{useSyncExternalStore:(_listen,read)=>read()}:name==='next-intl'?{useTranslations:()=>t}:{jsx:(type,props)=>({type,props})},navigator:{get onLine(){return online;}}});
 assert.equal(exports.default({cached:false}),null);
 let tree=exports.default({cached:true});assert.equal(tree.props.role,'status');assert.equal(tree.props.children,messages.feed.cachedNotice);
 online=false;tree=exports.default({cached:true});assert.equal(tree.props['data-feed-connection'],'offline');assert.equal(tree.props.children,messages.feed.offlineNotice);
 online=true;assert.equal(exports.default({cached:false}),null);
});
