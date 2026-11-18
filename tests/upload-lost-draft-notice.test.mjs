import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {restoreFiles}=await import('../src/lib/posts/upload-store.ts');
const {UploadManager}=await import('../src/lib/posts/upload-manager.ts');
const row=(patch={})=>({operationId:'draft',ownerId:'owner',createdAt:1,reservedAt:1,caption:'Saved caption',eatenAt:null,location:null,options:{},files:[new File(['photo'],'old.jpg')],snapshot:null,posted:false,state:'uploading',sent:0,total:5,...patch});
function fixture(initial=[row()]){
 const rows=new Map(initial.map(r=>[r.operationId,r]));let fail=false,hold=null,writes=0;
 const store={all:async()=>[...rows.values()].map(r=>restoreFiles(structuredClone(r))),allIntents:async()=>[],putIntent:async()=>{},put:async r=>{writes++;if(hold)await hold;if(fail)throw Error('Storage failed');rows.set(r.operationId,structuredClone(r));},remove:async id=>rows.delete(id),clear:async()=>rows.clear()};
 const manager=()=>new UploadManager(store,()=>({setProgress(){},setSnapshotListener(){},restore(){},stage:()=>assert.fail('No staging')}),async()=>{},async()=>assert.fail('No network'),async()=>'owner');
 return {rows,manager,get writes(){return writes;},set fail(v){fail=v;},set hold(v){hold=v;}};
}
test('an old unposted photo draft reports a notice and keeps its caption without network work',async()=>{
 const f=fixture(),m=f.manager();await m.initialize('owner');const s=m.list()[0];assert.equal(s.lostNotice,true);assert.equal(s.state,'failed');assert.equal(s.caption,'Saved caption');assert.equal(m.newest().files.length,0);assert.equal(f.writes,0);
});
test('OK waits for durable storage before notifying and stays acknowledged after reload',async()=>{
 const f=fixture(),m=f.manager();await m.initialize('owner');let release;f.hold=new Promise(r=>{release=r;});let notified=0;m.subscribe(()=>notified++);const pending=m.acknowledgeLost('draft');await new Promise(r=>setImmediate(r));assert.equal(m.list()[0].lostNotice,true);assert.equal(notified,0);release();await pending;assert.equal(notified,1);assert.equal(f.rows.get('draft').lostNoticeSeen,true);const restored=f.manager();await restored.initialize('owner');assert.equal(restored.list()[0].lostNotice,false);assert.equal(restored.newest().caption,'Saved caption');assert.equal(restored.newest().posted,false);
});
test('a failed OK write keeps the notice, including after reload, and never retries',async()=>{
 const f=fixture(),m=f.manager();await m.initialize('owner');f.fail=true;await assert.rejects(m.acknowledgeLost('draft'),/Storage failed/);assert.equal(m.list()[0].lostNotice,true);assert.equal(f.writes,1);assert.equal(f.rows.get('draft').lostNoticeSeen,undefined);const restored=f.manager();await restored.initialize('owner');assert.equal(restored.list()[0].lostNotice,true);
});
test('owner B never sees or acknowledges owner A’s draft notice',async()=>{
 const f=fixture(),m=f.manager();await m.initialize('owner');await m.initialize('other');assert.deepEqual(m.list(),[]);await m.acknowledgeLost('draft');assert.equal(f.writes,0);assert.equal(f.rows.get('draft').lostNoticeSeen,undefined);
});
test('posted new-meal and leftovers rows never show the unposted-draft notice',async()=>{
 const f=fixture([row({operationId:'meal',posted:true}),row({operationId:'left',posted:true,attachment:{postId:'post',notEaten:true}})]),m=f.manager();await m.initialize('owner');assert.deepEqual(m.list().map(s=>s.lostNotice),[false,false]);
});
test('Home renders one inline notice in the main Feed with OK and a visible save failure',()=>{
 const source=readFileSync(new URL('../src/components/Feed.tsx',import.meta.url),'utf8');assert.match(source,/!fallbackOnly[\s\S]*?<LostDraftNotice/);assert.match(source,/data-lost-draft-notice/);assert.match(source,/An unposted photo couldn’t be recovered, but your caption is saved\./);assert.match(source,/An unposted photo couldn’t be recovered\./);assert.match(source,/>OK<\/button>/);assert.match(source,/This could not be saved\. Try again\./);assert.match(source,/await uploadManager\.acknowledgeLost/);assert.doesNotMatch(source.slice(source.indexOf('function LostDraftNotice')),/setTimeout|setInterval|fixed/);
});

test('the empty-feed notice is a full-width sibling above the centered empty-state row',()=>{
 const source=readFileSync(new URL('../src/components/Feed.tsx',import.meta.url),'utf8');
 const branch=source.slice(source.indexOf('if (!visibleState.posts.length) return'),source.indexOf('const firstPhotoId='));
 assert.match(branch,/className="flex w-full flex-1 flex-col">\s*\{lostNotice\}\s*<div className="flex flex-1 items-center justify-center"/);
 assert.match(branch,/Post your first meal/);
});
