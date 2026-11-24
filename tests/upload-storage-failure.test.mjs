import {showFailure} from './fixtures/capture-wording.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
const PHOTO_STORAGE_FAILED="This photo couldn't be saved, but it is still on this screen—tap Try again.";
import {PhotoUploadError} from '../src/lib/media/put-with-progress.ts';
import {pendingUploadLine} from '../src/lib/posts/pending-upload-line.ts';
const file=new File(['photo'],'photo.jpg',{type:'image/jpeg'}),snapshot={id:'snapshot',images:[{original:new Blob(['original']),feed:new Blob(['feed']),phash:'1',width:4,height:3}],completed:[]};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('a snapshot write failure is visible, keeps the photo, never retries on a timer or online, and Try again alone resumes',async()=>{
 const rows=new Map();let fail=true,writes=0,snapshotWrites=0,delays=0,network=0,listener;
 const store={all:async()=>[],allIntents:async()=>[],putIntent:async()=>{},remove:async id=>rows.delete(id),clear:async()=>rows.clear(),put:async row=>{writes++;if(row.snapshot){snapshotWrites++;if(fail)throw new DOMException('Error preparing Blob/File data to be stored in object store','UnknownError');}rows.set(row.operationId,structuredClone(row));}};
 const draft={setProgress(){},setSnapshotListener(fn){listener=fn;},restore(){},stage:async()=>{await listener(snapshot);},snapshot:async()=>snapshot,submit:async()=>{network++;return{postId:'published'};}};
 const manager=new UploadManager(store,()=>draft,async()=>{delays++;},async()=>{network++;throw Error('No network expected');},async()=>'owner');await manager.initialize('owner');const id=manager.stage([file],{caption:'my meal',eatenAt:null,location:null,options:{}});await manager.post(id);for(let i=0;i<8;i++)await flush();
 const state=manager.list()[0];assert.equal(state.state,'failed');assert.equal(showFailure(state.failure),PHOTO_STORAGE_FAILED);assert.equal(showFailure(pendingUploadLine(state)),PHOTO_STORAGE_FAILED);assert.equal(await manager.newest()?.files?.[0]?.text(),undefined,'posted upload stays out of the unposted composer');assert.ok(state.previewUrl.startsWith('blob:'));assert.equal(await rows.get(id).files[0].text(),'photo');assert.equal(await manager.entries.get(id).data.files[0].text(),'photo');assert.equal(delays,0);assert.equal(network,0);assert.equal(snapshotWrites,1,'no quiet final-snapshot write retry');
 const before=writes;manager.stage([file],{caption:'updated caption',eatenAt:null,location:null,options:{}},id);for(let i=0;i<3;i++)await flush();assert.equal(manager.list()[0].state,'failed','a composer staging refresh cannot dismiss a storage failure');assert.equal(writes,before,'staging refresh cannot retry storage');manager.online();for(let i=0;i<3;i++)await flush();assert.equal(writes,before,'online never retries a storage failure');assert.equal(network,0);
 fail=false;manager.retry(id);for(let i=0;i<8;i++)await flush();assert.equal(network,1,'one explicit retry can finish');assert.equal(manager.list()[0].postId,'published');
});
test('the error after a network failure is reported if saving its final snapshot fails',async()=>{
 let listener;const store={all:async()=>[],allIntents:async()=>[],putIntent:async()=>{},remove:async()=>{},clear:async()=>{},put:async row=>{if(row.state==='failed')throw new DOMException('Quota exceeded','QuotaExceededError');}};
 const draft={setProgress(){},setSnapshotListener(fn){listener=fn;},restore(){},stage:async()=>{await listener(snapshot);throw Error('network failed');},snapshot:async()=>snapshot};
 const manager=new UploadManager(store,()=>draft,async()=>{},async()=>{},async()=>'owner');await manager.initialize('owner');manager.stage([file],{caption:'my meal',eatenAt:null,location:null,options:{}});for(let i=0;i<10;i++)await flush();assert.equal(showFailure(manager.list()[0].failure),PHOTO_STORAGE_FAILED);assert.equal(manager.list()[0].state,'failed');
});

for(const [transport,code,sentence]of[
 ['no_response','serverFailed',"The server didn't respond."],
 ['dropped','the_connection_dropped','The connection dropped.'],
 ['too_large','the_photo_is_too_large','The photo is too large.'],
])test(transport+' photo failure stores the code for its existing visible sentence',async()=>{
 const rows=new Map(),store={all:async()=>[],allIntents:async()=>[],putIntent:async()=>{},put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id),clear:async()=>rows.clear()};
 const draft={setProgress(){},setSnapshotListener(){},restore(){},stage:async()=>{},snapshot:async()=>snapshot,submit:async()=>{throw new PhotoUploadError(transport);}};
 const manager=new UploadManager(store,()=>draft,async()=>{},async()=>{},async()=>'owner');await manager.initialize('owner');const id=manager.stage([file],{caption:'kept meal',eatenAt:null,location:null,options:{}});await manager.post(id);for(let i=0;i<15;i++)await flush();
 assert.equal(manager.list()[0].state,'failed');assert.deepEqual(rows.get(id).failure,{code});assert.equal(Object.hasOwn(rows.get(id),'message'),false);assert.equal(showFailure(manager.list()[0].failure),sentence);assert.equal(await rows.get(id).files[0].text(),'photo');
});
