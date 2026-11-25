import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/lib/media/camera-mode.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
test('a refused optional preference write keeps the chosen camera until reload, without pretending it persisted',()=>{
 let refuse=true,stored='app';const exports={};vm.runInNewContext(code,{exports,require:()=>({}),localStorage:{getItem:()=>stored,setItem:(_key,value)=>{if(refuse)throw Error('private storage');stored=value;}}});
 assert.equal(exports.readCameraMode(),'app');assert.equal(exports.writeCameraMode('phone'),false);assert.equal(exports.readCameraMode(),'phone');assert.equal(stored,'app');
 refuse=false;assert.equal(exports.writeCameraMode('app'),true);assert.equal(exports.readCameraMode(),'app');
});
