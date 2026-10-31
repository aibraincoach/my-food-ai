import test from 'node:test';
import assert from 'node:assert/strict';
import {PostUploadDraft} from '../src/lib/posts/create.ts';
import {publishUpload,validUploadShots} from '../src/lib/posts/upload-draft.ts';
const id='11111111-1111-4111-8111-111111111111';
const file=new File(['photo'],'photo.jpg',{type:'image/jpeg'});
const image={width:10,height:10,phash:'1',original:new Blob(['original']),feed:new Blob(['feed'])};
const upload={position:0,originalPath:'owner/stage/0.jpg',feedPath:'owner/stage/0.feed.jpg',originalSignedUrl:'https://storage.invalid/original',feedSignedUrl:'https://storage.invalid/feed'};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

test('photo intent without a selected file never reaches the server',async()=>{
 const draft=new PostUploadDraft(async()=>image,async()=>{throw Error('must not request')},async()=>false,()=>id);
 await assert.rejects(draft.submit('meal',[],null,null,'photo'),/selected photo is not ready/);
});
test('completion failure keeps the same operation and successful uploads for retry',async()=>{
 const ids=[];let encodes=0,puts=0,completes=0;
 const request=async(url,init)=>{
  if(init.method==='POST'){ids.push(JSON.parse(init.body).operation_id);return response({postId:id,uploads:[upload]});}
  if(url==='/api/posts')return ++completes===1?response({},503):response({ok:true});
  puts++;return response({});
 };
 const draft=new PostUploadDraft(async()=>{encodes++;return image},request,async()=>false,()=>id);
 await assert.rejects(draft.submit('meal',[file],null,null,'photo'),/could not be completed/);
 assert.deepEqual(await draft.submit('meal',[file],null,null,'photo'),{postId:id});
 assert.deepEqual(ids,[id,id]);assert.equal(encodes,1);assert.equal(puts,2);assert.equal(completes,2);
});
test('lost upload response is reconciled through exact byte verification',async()=>{
 let verified=0,completed=0;
 const request=async(url,init)=>{
  if(init.method==='POST')return response({postId:id,uploads:[upload]});
  if(url==='/api/posts'){completed++;return response({ok:true});}
  throw Error('response lost');
 };
 const draft=new PostUploadDraft(async()=>image,request,async()=>{verified++;return true},()=>id);
 assert.deepEqual(await draft.submit('meal',[file],null,null,'photo'),{postId:id});assert.equal(verified,2);assert.equal(completed,1);
});
test('an incomplete derivative cannot publish and retry uploads only the missing copy',async()=>{
 let originals=0,feeds=0,completed=0;
 const request=async(url,init)=>{
  if(init.method==='POST')return response({postId:id,uploads:[upload]});
  if(url==='/api/posts'){completed++;return response({ok:true});}
  if(url===upload.originalSignedUrl){originals++;return response({});}
  return ++feeds===1?response({},503):response({});
 };
 const draft=new PostUploadDraft(async()=>image,request,async()=>false,()=>id);
 await assert.rejects(draft.submit('meal',[file],null,null,'photo'),/upload failed/);assert.equal(completed,0);
 await draft.submit('meal',[file],null,null,'photo');assert.equal(originals,1);assert.equal(feeds,2);assert.equal(completed,1);
});
test('a lost publication response returns the already published post on retry',async()=>{
 let reserves=0,puts=0;
 const request=async(url,init)=>{
  if(init.method==='POST')return ++reserves===1?response({postId:id,uploads:[upload]}):response({postId:id,uploads:[],completed:true});
  if(url==='/api/posts')throw Error('response lost');puts++;return response({});
 };
 const draft=new PostUploadDraft(async()=>image,request,async()=>false,()=>id);
 await assert.rejects(draft.submit('meal',[file],null,null,'photo'),/response lost/);
 assert.deepEqual(await draft.submit('meal',[file],null,null,'photo'),{postId:id});assert.equal(puts,2);
});
test('shot manifests are bounded, ordered and valid before reservation',()=>{
 assert.equal(validUploadShots([{position:0,width:10,height:10,phash:'-1'}]),true);
 for(const value of [null,{},[{position:1,width:10,height:10}],[{position:0,width:0,height:10}],[{position:0,width:10,height:10,phash:'x'}]])assert.equal(validUploadShots(value),false);
});
test('publication service delegates only an owner-scoped atomic RPC and propagates failure',async()=>{
 const calls=[];const db={async rpc(name,args){calls.push([name,args]);return {data:id,error:null}}};
 assert.equal(await publishUpload(db,'owner',id),id);assert.deepEqual(calls,[['publish_uploaded_post',{p_operation_id:id,p_user_id:'owner'}]]);
 await assert.rejects(publishUpload({rpc:async()=>({data:null,error:{message:'missing'}})},'owner',id),/could not be completed/);
});
test('an expired stage keeps the selected file but starts a fresh operation on explicit retry',async()=>{
 let reserves=0,uuids=0;const ids=[];
 const second='22222222-2222-4222-8222-222222222222';
 const request=async(url,init)=>{
  if(init.method==='POST'){const parsed=JSON.parse(init.body);ids.push(parsed.operation_id);return ++reserves===1?response({error:'The upload draft expired. Your photos were kept; try again.'},410):response({postId:second,uploads:[upload]});}
  return response({ok:true});
 };
 const draft=new PostUploadDraft(async()=>image,request,async()=>false,()=>++uuids===1?id:second);
 await assert.rejects(draft.submit('meal',[file],null,null,'photo'),/expired/);
 assert.deepEqual(await draft.submit('meal',[file],null,null,'photo'),{postId:second});assert.deepEqual(ids,[id,second]);
});
