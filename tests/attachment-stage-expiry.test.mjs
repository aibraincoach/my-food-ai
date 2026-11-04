import test from 'node:test';
import assert from 'node:assert/strict';
import {attachPostPhoto,AttachmentStageExpired} from '../src/lib/posts/attach-photo.ts';
const expired={code:'22023',message:'Photo stage expired'};
const photo={path:'owner/stage/0.jpg',width:10,height:10};
function harness({prepared={id:'attachment',cleanup_job_id:'lease',target_path:'owner/post/1.jpg'},prepareError=null,lease={status:'queued',run_after:'2000-01-01T00:00:00Z'},leaseError=null,complete={data:null,error:expired,status:400}}={}){
 const calls=[];const db={rpc:async(name)=>{calls.push(name);return name==='prepare_post_photo_attachment'?{data:prepared,error:prepareError,status:400}:complete;},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:lease,error:leaseError,status:503})})})}),storage:{from:()=>({copy:async()=>{calls.push('copy');return{error:null}}})}};
 return{db,calls};
}
test('expired unreserved stage gives an explicit renewal signal',async()=>{
 const {db,calls}=harness({prepareError:expired});await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),AttachmentStageExpired);assert.deepEqual(calls,['prepare_post_photo_attachment']);
});
test('expired pending reservation reconciles under completion locks before allowing renewal',async()=>{
 const {db,calls}=harness();await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),AttachmentStageExpired);assert.deepEqual(calls,['prepare_post_photo_attachment','complete_post_photo_attachment']);
});
test('expired lease observation racing a committed attachment returns its existing media',async()=>{
 const {db,calls}=harness({complete:{data:'existing-media',error:null}});assert.deepEqual(await attachPostPhoto(db,'post','owner',photo,true),{mediaId:'existing-media'});assert.ok(!calls.includes('copy'));
});
test('already committed stage stays idempotent after cleanup',async()=>{
 const {db,calls}=harness({prepared:{media_id:'existing-media'}});assert.deepEqual(await attachPostPhoto(db,'post','owner',photo,true),{mediaId:'existing-media'});assert.deepEqual(calls,['prepare_post_photo_attachment']);
});
test('a failed lease read never authorizes a fresh stage',async()=>{
 const {db,calls}=harness({leaseError:{message:'network failed'}});await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),error=>!(error instanceof AttachmentStageExpired));assert.ok(!calls.includes('complete_post_photo_attachment'));assert.ok(!calls.includes('copy'));
});
test('expiry while copying is reported as renewable by the locked completion result',async()=>{
 const {db,calls}=harness({lease:{status:'queued',run_after:'2999-01-01T00:00:00Z'}});await assert.rejects(()=>attachPostPhoto(db,'post','owner',photo,true),AttachmentStageExpired);assert.equal(calls.filter(c=>c==='copy').length,2);
});
