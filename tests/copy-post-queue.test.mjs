import test from 'node:test';
import assert from 'node:assert/strict';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
const copy={id:'source',saved:false,eatenAt:'2026-11-03T01:00:00Z'},pause=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return{promise,resolve};};
async function until(check){for(let i=0;i<200;i++){if(check())return;await pause();}throw Error('copy queue did not settle');}
const makeDraft=()=>({setProgress(){},setSnapshotListener(){},restore(){},snapshot:async()=>null,stage:async()=>{throw Error('A copy must not stage a photo');},submit:async()=>{throw Error('A copy must not re-analyse the meal');}});
function store(){const rows=new Map();return{rows,all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id),clear:async()=>rows.clear()};}
test('copy selection is durable and visible as a new pending entry before its response',async()=>{
 const db=store(),gate=deferred();let calls=0;
 const manager=new UploadManager(db,makeDraft,async()=>{},async(url,options)=>{calls++;assert.equal(url,'/api/posts/source/log-again');const body=JSON.parse(options.body);assert.equal(body.owner_id,'owner');assert.deepEqual(db.rows.get(body.operation_id).copy,copy);return gate.promise;});
 await manager.initialize('owner');const id=await manager.postCopy(copy,'Rice');await until(()=>calls===1);assert.equal(manager.list()[0].kind,'copy');assert.equal(manager.list()[0].posted,true);assert.equal(manager.list()[0].postId,undefined);assert.equal(db.rows.get(id).posted,true);
 gate.resolve(Response.json({postId:'actual-copy'}));await until(()=>manager.list()[0].postId==='actual-copy');assert.equal(db.rows.size,0);
});
test('lost committed response retries one frozen operation without duplicating the copy',async()=>{
 const db=store(),committed=new Map(),operations=[],selection={...copy};let calls=0;
 const manager=new UploadManager(db,makeDraft,async()=>{},async(url,options)=>{const body=JSON.parse(options.body);operations.push(body.operation_id);assert.equal(url,'/api/posts/source/log-again');assert.equal(body.eaten_at,copy.eatenAt);committed.set(body.operation_id,'one-copy');if(++calls===1)throw Error('response lost after commit');return Response.json({post_id:'one-copy'});});
 await manager.initialize('owner');await manager.postCopy(selection,'Rice');selection.id='changed';selection.eatenAt='changed';await until(()=>manager.list()[0].postId==='one-copy');assert.equal(calls,2);assert.equal(committed.size,1);assert.equal(new Set(operations).size,1);
});
test('saved copy survives reload and cannot be replayed by another signed-in owner',async()=>{
 const db=store(),selection={...copy,saved:true};
 const first=new UploadManager(db,makeDraft,async()=>{},async()=>Response.json({error:'Network fixture'},{status:503}));await first.initialize('owner');const id=await first.postCopy(selection,'Saved rice');await until(()=>first.list()[0].state==='failed');assert.equal(first.list()[0].message,'Network fixture');
 const other=new UploadManager(db,makeDraft,async()=>{},async()=>{throw Error('Another owner must not send this copy');});await other.initialize('other');assert.deepEqual(other.list(),[]);
 let sent;const restored=new UploadManager(db,makeDraft,async()=>{},async(url,options)=>{assert.equal(url,'/api/saved/source/log');sent=JSON.parse(options.body);return Response.json({postId:'restored-copy'});});await restored.initialize('owner');restored.retry(id);await until(()=>restored.list()[0].postId==='restored-copy');assert.equal(sent.operation_id,id);assert.equal(sent.owner_id,'owner');assert.equal(sent.eaten_at,copy.eatenAt);
});
test('a failed durable checkpoint keeps a visible failed copy without a network mutation',async()=>{
 const db=store();db.put=async()=>{throw Error('Storage unavailable');};let calls=0;const manager=new UploadManager(db,makeDraft,async()=>{},async()=>{calls++;return Response.json({postId:'unexpected'});});await manager.initialize('owner');const id=await manager.postCopy(copy,'Rice');const failed=manager.list();assert.equal(failed.length,1);assert.equal(failed[0].operationId,id);assert.equal(failed[0].state,'failed');assert.match(failed[0].message,/could not be kept on this phone/);assert.equal(db.rows.size,0);assert.equal(calls,0);
});
test('sign-in change during persistence preserves the original selection without sending it as the new owner',async()=>{
 const db=store(),gate=deferred(),put=db.put;let writing=false,calls=0;db.put=async row=>{writing=true;await gate.promise;return put(row);};const manager=new UploadManager(db,makeDraft,async()=>{},async()=>{calls++;return Response.json({postId:'wrong-owner'});});await manager.initialize('owner');const pending=manager.postCopy(copy,'Rice');await until(()=>writing);await manager.initialize('other');gate.resolve();await assert.rejects(pending,/Sign-in changed/);assert.equal(calls,0);assert.equal([...db.rows.values()][0].ownerId,'owner');assert.deepEqual(manager.list(),[]);
});
test('cancellation after a lost commit stays durable and reload only retries DELETE',async()=>{
 const db=store(),committed=new Map();let posts=0,deletes=0;const request=async(url,options)=>{assert.equal(url,'/api/posts/source/log-again');const body=JSON.parse(options.body);if(options.method==='POST'){posts++;committed.set(body.operation_id,'committed-copy');throw Error('response lost');}deletes++;assert.equal(body.eaten_at,copy.eatenAt);throw Error('cancel acknowledgement lost');};
 const manager=new UploadManager(db,makeDraft,async()=>{},request);await manager.initialize('owner');const id=await manager.postCopy(copy,'Rice');await until(()=>manager.list()[0].state==='failed');assert.equal(committed.size,1);await manager.discardCopy(id);await until(()=>deletes===1&&manager.list()[0].state==='failed');assert.equal(db.rows.get(id).cancelRequested,true);
 const restored=new UploadManager(db,makeDraft,async()=>{},async(url,options)=>{assert.equal(url,'/api/posts/source/log-again');assert.equal(options.method,'DELETE');const body=JSON.parse(options.body);assert.equal(body.operation_id,id);assert.equal(body.owner_id,'owner');assert.equal(body.eaten_at,copy.eatenAt);return Response.json({post_id:'committed-copy'});});await restored.initialize('owner');restored.retry(id);await until(()=>!restored.list().length);assert.equal(posts,3);assert.equal(db.rows.size,0);
});
test('a cancellation requested while publication is pending is not replaced by its late success',async()=>{
 const db=store(),gate=deferred();let posts=0,deletes=0;const manager=new UploadManager(db,makeDraft,async()=>{},async(_url,options)=>{if(options.method==='POST'){posts++;return gate.promise;}deletes++;return Response.json({post_id:'late-copy'});});await manager.initialize('owner');const id=await manager.postCopy(copy,'Rice');await until(()=>posts===1);await manager.discardCopy(id);gate.resolve(Response.json({postId:'late-copy'}));await until(()=>!manager.list().length);assert.equal(deletes,1);assert.equal(db.rows.size,0);
});
