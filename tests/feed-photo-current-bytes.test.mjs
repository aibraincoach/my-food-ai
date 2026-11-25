import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import vm from 'node:vm';import ts from 'typescript';import sharp from 'sharp';import {resizeFeedPhoto} from '../src/lib/posts/feed-photo.ts';
const source=execFileSync('git',['show','1ac0b2c1cba935c05903fd1434b1b1365a96cd56:src/lib/posts/feed-photo.ts'],{encoding:'utf8'}),old={};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,{exports:old,require:name=>{assert.equal(name,'sharp');return sharp;},Buffer});
for(const [width,height]of [[1080,1080],[1440,1920]])test('current v2 output bytes match main: '+width+'x'+height,async()=>{
 const jpeg=await sharp({create:{width,height,channels:3,background:'#a44c32'}}).jpeg().toBuffer();assert.deepEqual(await resizeFeedPhoto(jpeg),await old.resizeFeedPhoto(jpeg,2));
});
