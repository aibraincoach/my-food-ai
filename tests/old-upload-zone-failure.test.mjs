import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import {createTranslator} from 'next-intl';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';import {PostUploadDraft} from '../src/lib/posts/create.ts';import {captureFailureText} from '../src/lib/posts/capture-failure.ts';import {renderFailureMessage} from '../src/i18n/failure-code.ts';
const loaded={};const code=ts.transpileModule(fs.readFileSync('src/components/UploadingPost.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
const pause=()=>new Promise(r=>setImmediate(r));
test('an operation retained before C1 shows the real 400 refusal, retains its photo and offers Try again',async()=>{
 const file=new File(['retained photo'],'meal.jpg',{type:'image/jpeg'}),image={original:new Blob(['encoded']),feed:new Blob(['encoded']),width:10,height:10,phash:'1'},id='11111111-1111-4111-8111-111111111111';
 const row={operationId:id,ownerId:'owner',createdAt:Date.now(),reservedAt:Date.now(),caption:'retained meal',eatenAt:null,location:null,options:{},files:[file],snapshot:{id,images:[image],completed:[]},posted:true,state:'failed',sent:0,total:file.size};const rows=new Map([[id,row]]);let requests=0;
 const store={all:async()=>[...rows.values()],allIntents:async()=>[],put:async value=>rows.set(id,value),remove:async()=>{throw Error('must retain failed draft')},clear:async()=>{}};
 const request=async(_url,init)=>{requests++;assert.equal(JSON.parse(init.body).time_zone,undefined);return Response.json({message_code:'captureZoneRequired'},{status:400});};
 const manager=new UploadManager(store,()=>new PostUploadDraft(async()=>image,request,async()=>false,()=>id),async()=>{throw Error('must not automatically retry the 400')},request,async()=>'owner');
 await manager.initialize('owner');manager.retry(id);for(let i=0;i<100&&!manager.list()[0]?.failure;i++)await pause();
 const upload=manager.list()[0];assert.equal(upload.state,'failed');assert.equal(upload.failure.code,'captureZoneRequired');assert.equal(requests,1);assert.equal(await rows.get(id).files[0].text(),'retained photo');
 const children=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(children):[node,...children(node.props?.children)];
 for(const locale of ['en','ja']){
  const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json')),t=ns=>createTranslator({locale,messages,namespace:ns}),translators={api:t('api'),capture:t('capture')};const tf=(key,values)=>renderFailureMessage(key,values,translators),exports={};
  vm.runInNewContext(code,{exports,require:name=>name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:name==='next-intl'?{useTranslations:t}:name==='@/i18n/failure-messages'?{useFailureMessages:()=>tf}:name==='@/lib/posts/capture-failure'?{captureFailureText}:name==='react'?{useState:()=>[false,()=>{}]}:{default:()=>null,uploadManager:{}}});
  const tree=exports.UploadMedia({upload,post:{id:'post',status:'queued',slides:[]}}),nodes=children(tree);assert.ok(nodes.some(n=>n.type==='p'&&n.props.children===messages.api.captureZoneRequired));assert.ok(nodes.some(n=>n.type==='button'&&n.props.children===messages.capture.try_again));
 }
});
