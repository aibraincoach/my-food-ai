import test,{beforeEach,afterEach}from'node:test';import assert from'node:assert/strict';
import{IDBFactory,IDBObjectStore}from'fake-indexeddb';
import{uploadStore}from'../src/lib/posts/upload-store.ts';
const nav=Object.getOwnPropertyDescriptor(globalThis,'navigator');let writes=[];const put=IDBObjectStore.prototype.put;
const draft=(id='one')=>({operationId:id,ownerId:'owner',createdAt:1,reservedAt:1,caption:'caption',eatenAt:null,location:null,options:{},files:[new File(['raw GPS selection'],'meal.jpg',{type:'image/jpeg',lastModified:17})],snapshot:null,posted:false,state:'uploading',sent:0,total:17});
const shot=()=>{const original=new Blob(['encoded'],{type:'image/jpeg'});return{original,feed:original,width:10,height:8,phash:'1'};};
const open=(version)=>new Promise((resolve,reject)=>{const r=indexedDB.open('mfa-uploads',version);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function raw(){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(['drafts','photos','intents'],'readonly'),data={version:db.version};for(const name of ['drafts','photos','intents']){const r=tx.objectStore(name).getAll();r.onsuccess=()=>data[name]=r.result;}tx.oncomplete=()=>resolve(data);tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function seed(version,row){await new Promise((resolve,reject)=>{const r=indexedDB.open('mfa-uploads',version);r.onupgradeneeded=()=>{r.result.createObjectStore('drafts',{keyPath:'operationId'});r.result.createObjectStore('intents',{keyPath:'operationId'});r.transaction.objectStore('drafts').put(row);};r.onsuccess=()=>{r.result.close();resolve();};r.onerror=()=>reject(r.error);});}
beforeEach(()=>{globalThis.indexedDB=new IDBFactory();Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});writes=[];IDBObjectStore.prototype.put=function(value,...args){writes.push({store:this.name,value:structuredClone(value)});return put.call(this,value,...args);};});
afterEach(()=>{IDBObjectStore.prototype.put=put;if(nav)Object.defineProperty(globalThis,'navigator',nav);else delete globalThis.navigator;});
test('snapshot keeps one byte record for a shared JPEG, with references only in drafts',async()=>{
 const row=draft('dedup'),image=shot();let sourceReads=0,encodedReads=0;row.files[0].arrayBuffer=async()=>{sourceReads++;throw Error('raw selection must not be retained');};const read=image.original.arrayBuffer.bind(image.original);image.original.arrayBuffer=()=>{encodedReads++;return read();};row.snapshot={id:'snapshot',images:[image],completed:['original']};
 await uploadStore.put(row);const kept=await raw();assert.equal(kept.version,4);assert.equal(kept.photos.length,1);assert.equal(kept.photos[0].bytes.byteLength,7);assert.equal(sourceReads,0);assert.equal(encodedReads,1);assert.equal(kept.drafts[0].files[0].bytes,undefined);assert.equal(kept.drafts[0].snapshot.images[0].original.bytes,undefined);assert.equal(kept.drafts[0].snapshot.images[0].feed.key,kept.drafts[0].snapshot.images[0].original.key);
 const [restored]=await uploadStore.all();assert.equal(await restored.files[0].text(),'encoded');assert.equal(restored.files[0].name,'meal.jpg');assert.equal(restored.files[0].lastModified,17);assert.equal(restored.snapshot.images[0].original,restored.snapshot.images[0].feed);assert.deepEqual(restored.snapshot.completed,['original']);assert.equal(await row.files[0].text(),'encoded','caller normalizes only after commit');
});
test('caption, progress and acknowledgment updates neither read nor write photo bytes again',async()=>{
 const row=draft('metadata'),image=shot();let reads=0;const read=image.original.arrayBuffer.bind(image.original);image.original.arrayBuffer=()=>{reads++;return read();};row.snapshot={id:'snapshot',images:[image],completed:[]};await uploadStore.put(row);const photoWrites=writes.filter(w=>w.store==='photos').length;
 for(const caption of ['c','ca','cap']){row.caption=caption;row.sent++;row.snapshot={...row.snapshot,completed:['one']};await uploadStore.put(row);}
 assert.equal(reads,1);assert.equal(writes.filter(w=>w.store==='photos').length,photoWrites);assert.equal(writes.filter(w=>w.store==='drafts').length,4);assert.equal((await uploadStore.all())[0].caption,'cap');
});
for(const version of [2,3])test(`version ${version} opens as empty working version4 stores, without recovering old drafts`,async()=>{
 const row=draft('discard-'+version);row.files=[{name:'old.jpg',type:'image/jpeg',lastModified:1,bytes:new Uint8Array([1,2,3]).buffer}];row.message='Old wording';await seed(version,row);
 const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction('intents','readwrite');tx.objectStore('intents').put({operationId:row.operationId,ownerId:'owner',createdAt:1});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 assert.deepEqual(await uploadStore.all(),[]);const kept=await raw();assert.equal(kept.version,4);assert.deepEqual([kept.drafts,kept.photos,kept.intents],[[],[],[]]);assert.equal(await uploadStore.hasPending(),false);
 const fresh=draft('fresh-'+version);await uploadStore.put(fresh);assert.equal((await uploadStore.all())[0].operationId,fresh.operationId);assert.equal((await raw()).photos.length,1);
});
test('a current draft with a missing photo record is visibly lost and keeps its caption',async()=>{
 const row=draft('missing');await uploadStore.put(row);const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').clear();tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
 const [restored]=await uploadStore.all();assert.deepEqual([restored.files.length,restored.snapshot,restored.photoLost,restored.state,restored.caption],[0,null,true,'failed','caption']);
});
test('remove and clear leave no photo records or publish intents',async()=>{
 for(const id of ['remove','clear']){const row=draft(id);row.snapshot={id:'stage',images:[shot()],completed:[]};await uploadStore.put(row);await uploadStore.putIntent({operationId:id,ownerId:'owner',createdAt:1,postId:null,notEaten:false});}
 await uploadStore.remove('remove');let kept=await raw();assert.equal(kept.photos.length,1);assert.deepEqual(kept.intents.map(i=>i.operationId),['clear']);await uploadStore.clear();kept=await raw();assert.deepEqual([kept.photos.length,kept.drafts.length,kept.intents.length],[0,0,0]);
});
test('insufficient estimate refuses all new bytes before either object store is written',async()=>{
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{storage:{estimate:async()=>({quota:1000,usage:999})}}});await assert.rejects(uploadStore.put(draft('quota')),e=>e.name==='QuotaExceededError');assert.equal(writes.length,0);assert.deepEqual((await uploadStore.all()),[]);
});
test('without estimate support the same transaction remains allowed',async()=>{await uploadStore.put(draft('no-estimate'));assert.equal((await uploadStore.all()).length,1);});
test('a photo write abort leaves no metadata, then an explicit retry writes the bytes',async()=>{
 let fail=true;const spy=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==='photos'&&fail)throw new DOMException('Injected full storage','QuotaExceededError');return spy.call(this,value,...args);};const row=draft('retry');await assert.rejects(uploadStore.put(row),e=>e.name==='QuotaExceededError');assert.equal((await raw()).drafts.length,0);assert.equal(await row.files[0].text(),'raw GPS selection','failed write keeps current selection');fail=false;await uploadStore.put(row);assert.equal((await uploadStore.all()).length,1);assert.equal((await raw()).photos.length,1);
});
test('same operation cannot replace another owner’s photo set',async()=>{const row=draft('owner');await uploadStore.put(row);await assert.rejects(uploadStore.put({...row,ownerId:'other'}),/owner/i);assert.equal((await uploadStore.all())[0].ownerId,'owner');});

test('durable normalization preserves selection identity, staged acknowledgments and caption edits',async()=>{
 const {UploadManager}=await import('../src/lib/posts/upload-manager.ts'),{PostUploadDraft}=await import('../src/lib/posts/create.ts');const source=new File(['raw GPS selection'],'meal.jpg',{type:'image/jpeg',lastModified:17}),image=shot();let encodes=0,puts=0;const operations=[];
 const upload={position:0,originalPath:'owner/prepared/0.jpg',feedPath:'owner/prepared/0.feed.jpg',originalSignedUrl:'https://storage.invalid/original',feedSignedUrl:'https://storage.invalid/feed'};
 const response=body=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
 const request=async(url,init)=>{if(init.method==='POST'){operations.push(JSON.parse(init.body).operation_id);return response({postId:'prepared',uploads:[upload]});}if(init.method==='PUT'&&url!=='/api/posts')puts++;return response({ok:true});};
 const manager=new UploadManager(uploadStore,()=>new PostUploadDraft(async()=>{encodes++;return image;},request,async()=>false,()=>'prepared'),async()=>{},request,async()=>'owner');await manager.initialize('owner');const fields={caption:'first',eatenAt:null,location:null,options:{}};const id=manager.stage([source],fields);
 const wait=async condition=>{for(let i=0;i<100&&!condition();i++)await new Promise(r=>setTimeout(r,5));assert.ok(condition(),JSON.stringify(manager.list()));};
 await wait(()=>manager.list()[0]?.state==='uploaded');await manager.entries.get(id).active;assert.equal(await manager.entries.get(id).data.files[0].text(),'encoded');assert.equal(manager.entries.get(id).selectedFiles[0],source);
 const byteWrites=writes.filter(w=>w.store==='photos').length;manager.update(id,{caption:'caption edit'});manager.stage([source],{...fields,caption:'caption edit'},id);await wait(()=>manager.list()[0]?.state==='uploaded');await manager.entries.get(id).writing;
 assert.equal(encodes,1);assert.equal(puts,2);assert.ok(operations.every(op=>op==='prepared'));assert.equal(writes.filter(w=>w.store==='photos').length,byteWrites);assert.equal(manager.entries.get(id).version,0);assert.equal((await uploadStore.all())[0].caption,'caption edit');
 await manager.post(id);await wait(()=>Boolean(manager.list()[0]?.postId));assert.equal((await raw()).photos.length,0);assert.equal((await raw()).intents.length,0);
});
