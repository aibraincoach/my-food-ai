import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const {restoreFiles}=await import('../src/lib/posts/upload-store.ts');
const {UploadManager,PHOTO_NOT_KEPT}=await import('../src/lib/posts/upload-manager.ts');
const fields={caption:'meal',eatenAt:null,location:null,options:{}};
const base={ownerId:'owner',createdAt:Date.now(),reservedAt:Date.now(),...fields,snapshot:null,posted:true,state:'uploading',sent:0,total:5};
const kept=()=>({name:'meal.jpg',type:'image/jpeg',lastModified:1,bytes:new TextEncoder().encode('image').buffer});

// #1093: a row saved before #684's fix holds a File. It is never read as one: it comes back with no photo, lost and failed.
test('only kept bytes are read back; a row holding a File comes back lost and failed',async()=>{
 const file=new File(['image'],'meal.jpg',{type:'image/jpeg'});
 for(const files of [[file],[new Blob(['image'],{type:'image/jpeg'})],[kept(),file]]){
  const row=restoreFiles({operationId:'old',...base,files});
  assert.deepEqual([row.files.length,row.photoLost,row.state],[0,true,'failed']);
 }
 const row=restoreFiles({operationId:'new',...base,files:[kept()]});
 assert.equal(row.files[0] instanceof File,true);assert.equal(await row.files[0].text(),'image');assert.equal(row.photoLost,undefined);assert.equal(row.state,'uploading');
});

function managerWith(row){
 const rows=new Map([[row.operationId,row]]),intents=new Map();
 const store={all:async()=>[...rows.values()].map(restoreFiles),put:async r=>rows.set(r.operationId,r),remove:async id=>rows.delete(id),clear:async()=>rows.clear(),allIntents:async()=>[...intents.values()],putIntent:async i=>intents.set(i.operationId,i),removeIntent:async id=>intents.delete(id)};
 const manager=new UploadManager(store,()=>({setProgress(){},restore(){},snapshot:async()=>null,stage:async()=>assert.fail('a lost photo must not be staged')}),async()=>{},async()=>assert.fail('a lost photo must not reach the network'),async()=>'owner');
 return manager;
}
test('an old new-meal row shows that its photo was not kept, offers no retry and is not a text post',async()=>{
 const manager=managerWith({operationId:'meal',...base,files:[new File(['image'],'meal.jpg',{type:'image/jpeg'})]});
 await manager.initialize('owner');
 const [state]=manager.list();
 assert.deepEqual([state.state,state.photoLost,state.failure,state.text],['failed',true,PHOTO_NOT_KEPT,undefined]);
 manager.retry('meal');await new Promise(resolve=>setTimeout(resolve,10));assert.equal(manager.list()[0].state,'failed');
});
test('an old leftovers row asks for a retake of that meal\'s photo',async()=>{
 const manager=managerWith({operationId:'left',...base,files:[new File(['image'],'left.jpg',{type:'image/jpeg'})],attachment:{postId:'post-1',notEaten:true}});
 await manager.initialize('owner');
 const [state]=manager.list();
 assert.deepEqual([state.state,state.photoLost,state.attachment.postId],['failed',true,'post-1']);
});
test('the chip shows the not-kept line with Remove for a lost photo that has no meal to retake for',()=>{
 const chip=readFileSync(new URL('../src/components/UploadChip.tsx',import.meta.url),'utf8');
 assert.match(chip,/upload\.photoLost\?<>\{upload\.attachment\?<button/);
 assert.match(chip,/:<p role="alert" className="text-detail text-muted">\{captureFailureText\(upload\.failure,tf\)\}<\/p>\}/);
 const store=readFileSync(new URL('../src/lib/posts/upload-store.ts',import.meta.url),'utf8');
 assert.doesNotMatch(store,/file instanceof Blob \? file/);
 assert.doesNotMatch(readFileSync(new URL('../src/lib/posts/upload-manager.ts',import.meta.url),'utf8'),/meal-\$\{index\}\.jpg/);
});
