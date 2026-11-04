import test from 'node:test';import assert from 'node:assert/strict';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
const food={fdc_id:123,query:'croissant',eaten_at:'2026-11-03T01:00:00Z'},pause=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return{promise,resolve};};
async function until(check){for(let i=0;i<200;i++){if(check())return;await pause();}throw Error('queue did not settle');}
const makeDraft=()=>({setProgress(){},setSnapshotListener(){},restore(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>{throw Error('Food must not use photo publication');}});
function store(){const rows=new Map(),intents=new Map();return{rows,intents,all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,structuredClone(row)),allIntents:async()=>[...intents.values()],putIntent:async intent=>intents.set(intent.operationId,structuredClone(intent)),removeIntent:async id=>intents.delete(id),remove:async id=>{rows.delete(id);intents.delete(id);},clear:async()=>{rows.clear();intents.clear();}};}
test('selection becomes durable and visible pending before the server replies, then uses the acknowledged post ID',async()=>{
 const db=store(),gate=deferred();let called=0;
 const manager=new UploadManager(db,makeDraft,async()=>{},async(_url,options)=>{called++;const body=JSON.parse(options.body);assert.equal(db.rows.get(body.operation_id).food.fdc_id,123);assert.equal(body.owner_id,'owner');return gate.promise;});
 await manager.initialize('owner');const id=await manager.postFood(food,'Croissant');await until(()=>called===1);
 assert.equal(manager.list()[0].posted,true);assert.equal(manager.list()[0].kind,'food');assert.equal(manager.list()[0].postId,undefined);assert.equal(db.rows.get(id).posted,true);
 gate.resolve(Response.json({post_id:'server-post'},{status:201}));await until(()=>manager.list()[0].postId==='server-post');assert.equal(db.rows.size,0);
});
test('a committed response lost in transit retries the same operation without a duplicate save',async()=>{
 const db=store(),committed=new Map(),ids=[];let calls=0;
 const request=async(_url,options)=>{const body=JSON.parse(options.body);ids.push(body.operation_id);committed.set(body.operation_id,'one-post');if(++calls===1)throw Error('response dropped after commit');return Response.json({post_id:committed.get(body.operation_id)},{status:201});};
 const manager=new UploadManager(db,makeDraft,async()=>{},request);await manager.initialize('owner');await manager.postFood(food,'Croissant');await until(()=>manager.list()[0].postId==='one-post');
 assert.equal(calls,2);assert.equal(committed.size,1);assert.equal(new Set(ids).size,1);
});
test('failed input survives reload, stays private to its owner and explicit retry retains the original operation',async()=>{
 const db=store(),bad=new UploadManager(db,makeDraft,async()=>{},async()=>Response.json({error:'Offline fixture'},{status:503}));
 await bad.initialize('owner');const id=await bad.postFood(food,'Croissant');await until(()=>bad.list()[0].state==='failed');assert.equal(db.rows.get(id).food.query,'croissant');assert.equal(bad.list()[0].message,'Offline fixture');
 const other=new UploadManager(db,makeDraft,async()=>{},async()=>{throw Error('must not send another owner selection');});await other.initialize('other');assert.deepEqual(other.list(),[]);
 let body;const restored=new UploadManager(db,makeDraft,async()=>{},async(_url,options)=>{body=JSON.parse(options.body);return Response.json({post_id:'retried-post'},{status:201});});await restored.initialize('owner');assert.equal(restored.list()[0].state,'failed');restored.retry(id);await until(()=>restored.list()[0].postId==='retried-post');assert.equal(body.operation_id,id);assert.equal(body.owner_id,'owner');assert.equal(body.fdc_id,123);
});
test('a staged barcode photo reuses acknowledged bytes rather than a second pack upload',async()=>{
 const db=store(),file=new File(['pack'],'pack.jpg',{type:'image/jpeg'}),image={original:new Blob(['original']),feed:new Blob(['feed']),width:390,height:390,phash:'1'};let puts=0,body;
 const draft={...makeDraft(),snapshot:async()=>({id:'staged-upload',images:[image],completed:['original','feed']}),stage:async()=>{if(!puts)puts=2;}};
 const manager=new UploadManager(db,()=>draft,async()=>{},async(_url,options)=>{body=JSON.parse(options.body);return Response.json({post_id:'barcode-post'},{status:201});});await manager.initialize('owner');
 const id=manager.stage([file],{caption:'',eatenAt:food.eaten_at,location:null,options:{}});await until(()=>manager.list()[0].state==='uploaded');const queued=await manager.postFood({gtin:'00016000275683',amount:100,unit:'g',eaten_at:food.eaten_at},'Pack',[file],id);
 await until(()=>manager.list()[0].postId==='barcode-post');assert.equal(queued,id);assert.equal(puts,2);assert.equal(body.photo.path,'owner/staged-upload/0.jpg');assert.equal(body.photo.width,390);assert.equal(body.operation_id,id);
});
test('an account switch during the durable checkpoint cannot send the prior account selection',async()=>{
 const db=store(),gate=deferred(),put=db.put;let pending=false,sent=0;db.put=async row=>{pending=true;await gate.promise;return put(row);};
 const manager=new UploadManager(db,makeDraft,async()=>{},async()=>{sent++;return Response.json({post_id:'wrong-owner'});});await manager.initialize('owner');
 const posting=manager.postFood(food,'Private selection');await until(()=>pending);await manager.initialize('other');gate.resolve();
 await assert.rejects(posting,/Sign-in changed/);assert.equal(sent,0);assert.deepEqual(manager.list(),[]);assert.equal([...db.rows.values()][0].ownerId,'owner');
});
test('failed removal is durable and reload retries cancellation rather than posting the selection again',async()=>{
 const db=store();let deletes=0,posts=0;
 const request=async(_url,options)=>{if(options.method==='DELETE'){deletes++;throw Error('cancel response dropped');}posts++;return Response.json({error:'Offline fixture'},{status:503});};
 const manager=new UploadManager(db,makeDraft,async()=>{},request);await manager.initialize('owner');const id=await manager.postFood(food,'Kept selection');await until(()=>manager.list()[0].state==='failed');assert.equal(posts,3);
 await manager.discardFood(id);await until(()=>deletes===1&&manager.list()[0].state==='failed');assert.equal(db.rows.get(id).cancelRequested,true);
 const restored=new UploadManager(db,makeDraft,async()=>{},async(_url,options)=>{assert.equal(options.method,'DELETE');const body=JSON.parse(options.body);assert.equal(body.operation_id,id);assert.equal(body.owner_id,'owner');return Response.json({post_id:'unacknowledged-post'},{status:200});});
 await restored.initialize('owner');restored.retry(id);await until(()=>restored.list().length===0);assert.equal(db.rows.size,0);assert.equal(posts,3);
});
test('a verified label keeps its prepared photo and chosen servings without reuploading',async()=>{
 const db=store(),gate=deferred(),file=new File(['label'],'label.jpg',{type:'image/jpeg'});let body;
 const draft={...makeDraft(),stage:async()=>{throw Error('Prepared label must not be uploaded again');}};
 const manager=new UploadManager(db,()=>draft,async()=>{},async(_url,options)=>{body=JSON.parse(options.body);return gate.promise;});await manager.initialize('owner');
 const input={label_reading_id:'verified-reading',servings:0.5,name:'Cereal',gtin:'00016000275683',eaten_at:food.eaten_at,photo:{path:'owner/prepared/0.jpg',width:390,height:390}};
 const id=await manager.postFood(input,'Cereal',[file]);await until(()=>Boolean(body));assert.equal(body.label_reading_id,input.label_reading_id);assert.equal(body.servings,0.5);assert.deepEqual(body.photo,input.photo);assert.equal(db.rows.get(id).files.length,1);assert.equal(manager.list()[0].total,0);
 gate.resolve(Response.json({post_id:'label-post'},{status:201}));await until(()=>manager.list()[0].postId==='label-post');
});
