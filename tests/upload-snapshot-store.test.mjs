import test from 'node:test';import assert from 'node:assert/strict';
const rows=new Map();let last;
// Small transaction double: stores the exact structured-clone input, refuses
// all Blob/File instances, and completes only after request success.
globalThis.indexedDB={open(){const request={};queueMicrotask(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction(){const tx={};tx.objectStore=()=>({put(value){const req={};queueMicrotask(()=>{try{last=structuredClone(value);function check(v){if(v instanceof Blob)throw new DOMException('Blob refused','UnknownError');if(v&&typeof v==='object'&&!(v instanceof ArrayBuffer))for(const x of Object.values(v))check(x);}check(last);rows.set(value.operationId,last);req.result=value.operationId;req.onsuccess?.();tx.oncomplete?.();}catch(error){req.error=error;req.onerror?.();}});return req;},getAll(){const req={};queueMicrotask(()=>{req.result=[...rows.values()].map(v=>structuredClone(v));req.onsuccess?.();tx.oncomplete?.();});return req;}});return tx;}};request.onsuccess?.();});return request;}};
const {uploadStore,restoreFiles}=await import('../src/lib/posts/upload-store.ts');
const file=new File(['photo'],'photo.jpg',{type:'image/jpeg',lastModified:17}),image={original:new Blob(['original'],{type:'image/jpeg'}),feed:new Blob(['feed'],{type:'image/jpeg'}),width:4,height:3,phash:'1'};
const row={operationId:'roundtrip',ownerId:'owner',createdAt:1,reservedAt:1,caption:'photo',eatenAt:null,location:null,options:{},files:[file],snapshot:{id:'shot',images:[image],completed:['original']},posted:false,state:'uploading',sent:0,total:5};
test('every selected and encoded photo persists as bytes and restores equal File/Blob data',async()=>{
 await uploadStore.put(row);assert.ok(last.files[0].bytes instanceof ArrayBuffer);assert.ok(last.snapshot.images[0].original.bytes instanceof ArrayBuffer);assert.ok(last.snapshot.images[0].feed.bytes instanceof ArrayBuffer);
 const [restored]=await uploadStore.all();assert.equal(await restored.files[0].text(),'photo');assert.equal(restored.files[0].name,'photo.jpg');assert.equal(restored.files[0].lastModified,17);assert.equal(await restored.snapshot.images[0].original.text(),'original');assert.equal(restored.snapshot.images[0].feed.type,'image/jpeg');assert.equal(await restored.snapshot.images[0].feed.text(),'feed');assert.deepEqual(restored.snapshot.completed,['original']);assert.equal(restored.snapshot.id,'shot');
});
test('an old Blob snapshot is unreadable while kept original files remain usable',async()=>{
 const old=structuredClone({...row,files:[{name:file.name,type:file.type,lastModified:17,bytes:await file.arrayBuffer()}]});const restored=restoreFiles(old);assert.equal(restored.snapshot,null);assert.equal(await restored.files[0].text(),'photo');assert.equal(restored.photoLost,undefined);
});
