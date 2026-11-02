// Local/pure only: node --import tsx --test tests/upload-reservation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {signShotUploads} from '../src/lib/media/storage.ts';
import {reserveUpload} from '../src/lib/posts/upload-draft.ts';
import {PostUploadDraft} from '../src/lib/posts/create.ts';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const input={operationId:id,caption:'meal',eatenAt:'2026-01-01T00:00:00.000Z',shots:[{position:0,width:10,height:10,phash:'1'}],location:null,notEatenPositions:[],saveAsMeal:false,renderZone:'UTC'};
function fixture(){
 const objects=new Map(),signs=[],rpcs=[];let published=false;
 const client=actor=>({storage:{from:bucket=>({createSignedUploadUrl:async(path,options)=>{signs.push({actor,path,upsert:options?.upsert===true});if(bucket!=='media'||path.split('/')[0]!==actor)return{data:null,error:{message:'row-level security'}};if(objects.has(path)&&!options?.upsert)return{data:null,error:{message:'Resource already exists'}};return{data:{signedUrl:`https://storage.invalid/${path}`,token:'fixture'},error:null};}})}});
 const admin={rpc:async(name,args)=>{rpcs.push({name,args});if(args.p_user_id!==owner)return{data:null,error:{code:'42501',message:'Draft not found'}};return{data:{id:args.p_operation_id,published},error:null};}};
 return{objects,signs,rpcs,admin,client,publish:()=>published=true};
}
test('shared signing stays write-once for legacy/staged callers',async()=>{
 const f=fixture(),db=f.client(owner);await signShotUploads(db,owner,id,[0]);assert.ok(f.signs.every(sign=>!sign.upsert));f.objects.set(`${owner}/${id}/0.jpg`,new Blob(['original']));await assert.rejects(signShotUploads(db,owner,id,[0]),/already exists/);assert.ok(f.signs.every(sign=>!sign.upsert));
});
test('an owned active unpublished reservation explicitly enables scoped renewal of existing copies',async()=>{
 const f=fixture();for(const suffix of['0.jpg','0.feed.jpg'])f.objects.set(`${owner}/${id}/${suffix}`,new Blob(['stored']));const result=await reserveUpload(f.admin,f.client(owner),owner,input);assert.equal(result.published,false);assert.equal(result.uploads.length,1);assert.ok(f.signs.every(sign=>sign.upsert&&sign.path.startsWith(`${owner}/${id}/`)));assert.equal(f.rpcs[0].args.p_user_id,owner);
});
test('published reservations return completed without issuing any upload capability',async()=>{
 const f=fixture();f.publish();assert.deepEqual(await reserveUpload(f.admin,f.client(owner),owner,input),{postId:id,published:true,uploads:[]});assert.equal(f.signs.length,0);
});
test('an arbitrary owned ready ID or another owner rejected by the reservation cannot reach signing',async()=>{
 const f=fixture(),ready={rpc:async()=>({data:null,error:{code:'22023',message:'Draft identifier is unavailable'}})};await assert.rejects(reserveUpload(ready,f.client(owner),owner,input),error=>error.status===409);await assert.rejects(reserveUpload(f.admin,f.client(other),other,input),error=>error.status===409);assert.equal(f.signs.length,0);
});
test('malformed reservation results never turn into overwrite capabilities',async()=>{
 const f=fixture();for(const data of[{id:'other',published:false},{id},{id,published:'false'}])await assert.rejects(reserveUpload({rpc:async()=>({data,error:null})},f.client(owner),owner,input),error=>error.status===409);assert.equal(f.signs.length,0);
});
test('storage ownership remains checked even after a successful reservation',async()=>{
 const f=fixture();await assert.rejects(reserveUpload(f.admin,f.client(other),owner,input),error=>error.status===503);assert.ok(f.signs.every(sign=>sign.actor===other&&sign.path.startsWith(`${owner}/`)));
});
test('existing single-leftovers rollout fallback preserves the verified owner and guard',async()=>{
 const f=fixture(),admin={rpc:async(name,args)=>{if(name==='reserve_post_upload_with_leftovers')return{data:null,error:{code:'PGRST202',message:'reserve_post_upload_with_leftovers absent'}};f.rpcs.push({name,args});return{data:{id,published:false},error:null};}};await reserveUpload(admin,f.client(owner),owner,input);assert.equal(f.rpcs[0].name,'reserve_post_upload_with_options');assert.equal(f.rpcs[0].args.p_user_id,owner);assert.equal(f.rpcs[0].args.p_not_eaten_position,null);
});
test('expired reservations never receive renewed capabilities',async()=>{
 const f=fixture();await assert.rejects(reserveUpload({rpc:async()=>({data:null,error:{code:'22023',message:'Upload draft expired'}})},f.client(owner),owner,input),error=>error.status===410);assert.equal(f.signs.length,0);
});
test('text-only reservations do not mint photo capabilities',async()=>{
 const f=fixture();const result=await reserveUpload(f.admin,f.client(owner),owner,{...input,shots:[]});assert.deepEqual(result.uploads,[]);assert.equal(f.signs.length,0);
});
test('missing multi-leftovers support cannot fall back to an unmarked reservation',async()=>{
 const f=fixture();let calls=0;await assert.rejects(reserveUpload({rpc:async()=>{calls++;return{data:null,error:{code:'PGRST202',message:'reserve_post_upload_with_leftovers absent'}}}},f.client(owner),owner,{...input,notEatenPositions:[1,2]}),error=>error.status===409);assert.equal(calls,1);assert.equal(f.signs.length,0);
});
test('actual draft staging then submit can renew existing paths without uploading acknowledged bytes twice',async()=>{
 const f=fixture(),image={width:10,height:10,phash:'1',original:new Blob(['original']),feed:new Blob(['feed'])};let puts=0;
 const request=async(url,options)=>{if(options.method==='POST'){const body=JSON.parse(options.body),result=await reserveUpload(f.admin,f.client(owner),owner,{...input,operationId:body.operation_id,caption:body.caption,shots:body.shots});return new Response(JSON.stringify({postId:result.postId,uploads:result.uploads,completed:result.published}));}if(url==='/api/posts'){f.publish();return new Response('{}');}puts++;f.objects.set(new URL(url).pathname.slice(1),options.body);return new Response('{}');};
 const draft=new PostUploadDraft(async()=>image,request,async()=>false,()=>id),file=new File(['file'],'meal.jpg');await draft.stage('before',[file],null,null);assert.equal(f.objects.size,2);assert.equal(puts,2);await draft.submit('latest',[file],null,null,'photo');assert.equal(puts,2);assert.equal(f.rpcs.at(-1).args.p_caption,'latest');assert.ok(f.signs.every(sign=>sign.upsert));
});
