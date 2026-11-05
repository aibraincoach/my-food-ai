// node --import tsx --env-file=.env.local --test tests/upload-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveUpload} from '../src/lib/posts/upload-draft.ts';
import {signShotUploads} from '../src/lib/media/storage.ts';
import {PostUploadDraft} from '../src/lib/posts/create.ts';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
import {admin,user,checked} from './db/helpers.mjs';
import {randomUUID} from 'node:crypto';
const file=new File(['image'],'meal.jpg',{type:'image/jpeg'});
const fields={caption:'meal',eatenAt:null,location:null,options:{}};
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await pause();}throw Error('state did not settle');}
function withIntents(store,rows){const intents=new Map();return Object.assign(store,{intents,allIntents:async()=>[...intents.values()],putIntent:async intent=>{intents.set(intent.operationId,structuredClone(intent));},removeIntent:async id=>intents.delete(id),remove:async id=>{intents.delete(id);rows.delete(id);},clear:async()=>{intents.clear();rows.clear();}});}
function harness(makeDraft){const rows=new Map();const store=withIntents({all:async()=>[...rows.values()],put:async row=>{rows.set(row.operationId,structuredClone(row));},remove:async id=>{rows.delete(id);},clear:async()=>rows.clear()},rows);const manager=new UploadManager(store,makeDraft,async()=>{});return{manager,store,rows};}
test('posting before PUT completion waits; three failures never publish; online retries safely',async()=>{
 let release,attempts=0,published=0,shouldFail=true;const gate=new Promise(resolve=>release=resolve);
 const draft={setProgress(){},snapshot:async()=>null,stage:async()=>{attempts++;await gate;if(shouldFail)throw Error('dropped');},submit:async()=>{published++;return{postId:'post'};}};
 const{manager}=harness(()=>draft);await manager.initialize('owner');const id=manager.stage([file],fields);manager.post(id);await pause();assert.equal(published,0);release();await until(()=>manager.list()[0]?.state==='failed');assert.equal(attempts,3);assert.equal(published,0);shouldFail=false;manager.online();await until(()=>published===1);assert.equal(published,1);
});
test('a reload restores the persisted photo and failed draft, then explicit retry can publish',async()=>{
 let publishes=0;const bad={setProgress(){},snapshot:async()=>null,stage:async()=>{throw Error('offline')},submit:async()=>{throw Error('must not publish')}};
 const {manager,store}=harness(()=>bad);await manager.initialize('owner');const id=manager.stage([file],fields);manager.post(id);await until(()=>manager.list()[0]?.state==='failed');
 const good={setProgress(){},restore(){},snapshot:async()=>({id:'published',images:[],completed:[]}),stage:async()=>{},submit:async()=>{publishes++;return{postId:'published'}}};const restored=new UploadManager(store,()=>good,async()=>{});await restored.initialize('owner');assert.equal(restored.list()[0].state,'failed');assert.equal(restored.list()[0].posted,true);restored.retry(id);await until(()=>publishes===1);await until(()=>restored.list()[0].postId==='published');assert.equal((await store.all()).length,0);
});
test('another signed-in owner cannot restore the first owner\'s photos',async()=>{const{manager,store}=harness(()=>({setProgress(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>({postId:'post'})}));await manager.initialize('owner');manager.stage([file],fields);await pause();const other=new UploadManager(store);await other.initialize('other');assert.deepEqual(other.list(),[]);});
test('deleting a draft waits for a pending checkpoint so it cannot reappear after reload',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve),rows=new Map();const store=withIntents({all:async()=>[],put:async row=>{await gate;rows.set(row.operationId,row);},remove:async id=>rows.delete(id),clear:async()=>rows.clear()},rows);
 const draft={setProgress(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>{throw Error('must not publish')}};const manager=new UploadManager(store,()=>draft,async()=>{});await manager.initialize('owner');const id=manager.stage([file],fields);await pause();const removed=manager.remove(id);release();await removed;await pause();assert.equal(rows.size,0);assert.deepEqual(manager.list(),[]);
});
test('an old ambiguous publication retries the same reservation instead of duplicating the meal',async()=>{
 let factories=0,restored=null;const draft={setProgress(){},restore(value){restored=value;},snapshot:async()=>({id:'original-id',images:[],completed:[]}),stage:async()=>{},submit:async()=>({postId:'original-id'})};
 const{manager,store}=harness(()=>{factories++;return draft;});await store.put({operationId:'logical-id',ownerId:'owner',createdAt:0,reservedAt:0,caption:'meal',eatenAt:null,location:null,options:{},files:[file],snapshot:{id:'original-id',images:[],completed:[]},posted:true,publishStarted:true,state:'failed',sent:1,total:1});await manager.initialize('owner');manager.retry('logical-id');await until(()=>manager.list()[0]?.postId==='original-id');assert.equal(factories,1);assert.equal(restored.id,'original-id');
});
test('a checkpoint for fewer photos cannot silently omit a selected photo after reload',async()=>{
 const image={width:10,height:10,phash:'1',original:new Blob(['original']),feed:new Blob(['feed'])};let encoded=0,manifest;
 const request=async(url,init)=>{if(init.method==='POST'){manifest=JSON.parse(init.body);return new Response(JSON.stringify({postId:'fresh',uploads:manifest.shots.map(shot=>({position:shot.position,originalPath:`owner/fresh/${shot.position}.jpg`,feedPath:`owner/fresh/${shot.position}.feed.jpg`,originalSignedUrl:`https://storage.invalid/${shot.position}/original`,feedSignedUrl:`https://storage.invalid/${shot.position}/feed`}))}),{status:200});}return new Response('{}',{status:200});};
 const draft=new PostUploadDraft(async()=>{encoded++;return image},request,async()=>false,()=> 'fresh');draft.restore({id:'old',images:[image],completed:[]});await draft.stage('meal',[file,new File(['second'],'second.jpg')],null,null);assert.equal(encoded,2);assert.equal(manifest.shots.length,2);assert.equal(manifest.operation_id,'fresh');
});
test('caption edits during a PUT do not restart staging and publication uses the latest text',async()=>{
 let release,stages=0,caption='';const gate=new Promise(resolve=>release=resolve);
 const draft={setProgress(){},snapshot:async()=>({id:'posted',images:[],completed:[]}),stage:async()=>{stages++;await gate;},submit:async value=>{caption=value;return{postId:'posted'}}};
 const{manager}=harness(()=>draft);await manager.initialize('owner');const id=manager.stage([file],fields);await pause();for(let i=0;i<100;i++)manager.update(id,{caption:`caption ${i}`});manager.post(id);release();await until(()=>manager.list()[0]?.postId==='posted');assert.equal(stages,1);assert.equal(caption,'caption 99');
});
test('changing the photo manifest during staging starts one fresh pass after the previous pass settles',async()=>{
 let release,passes=0;const gate=new Promise(resolve=>release=resolve);const sizes=[];
 const make=()=>({setProgress(){},snapshot:async()=>null,stage:async(_caption,files)=>{sizes.push(files.length);if(++passes===1)await gate;},submit:async()=>({postId:'posted'})});
 const{manager}=harness(make);await manager.initialize('owner');const id=manager.stage([file],fields);await pause();manager.stage([file,new File(['second'],'second.jpg')],fields,id);release();await until(()=>manager.list()[0]?.state==='uploaded');assert.deepEqual(sizes,[1,2]);
});
test('two-shot reservation refuses publication with only one stored object (22023)',async()=>{
 const db=admin(),{user:owner,client}=await user(1),id=randomUUID();const base=`${owner.id}/${id}`;
 const shots=[0,1].map(position=>({position,width:10,height:10,phash:'1'}));
 try{
  checked(await db.rpc('reserve_post_upload_with_leftovers',{p_operation_id:id,p_user_id:owner.id,p_caption:'upload guard test',p_eaten_at:new Date().toISOString(),p_shots:shots,p_location:null,p_save_as_meal:false,p_render_zone:'UTC',p_not_eaten_positions:[]}));
  checked(await db.storage.from('media').upload(`${base}/0.jpg`,new Blob(['test-object'],{type:'image/jpeg'})));
  // Staging must be able to refresh metadata/capabilities after an earlier PUT succeeded.
  const renewed=await reserveUpload(db,client,owner.id,{operationId:id,caption:'upload guard test',eatenAt:new Date().toISOString(),shots,location:null,notEatenPositions:[],saveAsMeal:false,renderZone:'UTC'});assert.equal(renewed.uploads.length,2);
  const {client:other}=await user(2);await assert.rejects(signShotUploads(other,owner.id,id,[0]),/row.level security/i);
  const result=await db.rpc('publish_uploaded_post',{p_operation_id:id,p_user_id:owner.id});assert.equal(result.error?.code,'22023');assert.match(result.error.message,/incomplete/i);
  const post=checked(await db.from('posts').select('status').eq('id',id).maybeSingle());assert.equal(post,null);
 }finally{await db.storage.from('media').remove([`${base}/0.jpg`]);await db.from('jobs').delete().contains('payload',{deleted_post_id:id});await db.from('post_upload_drafts').delete().eq('id',id);}
});

test('posting acknowledges a delayed durable flag while the upload runs',async()=>{
 const {manager,store}=harness(()=>({setProgress(){},snapshot:async()=>null,stage:async()=>new Promise(()=>{}),submit:async()=>({postId:'posted'})}));
 await manager.initialize('owner');const id=manager.stage([file],fields);await pause();
 const original=store.putIntent;let intentSaved=false;store.putIntent=async intent=>{await new Promise(resolve=>setTimeout(resolve,50));await original(intent);intentSaved=true;};
 store.put=async()=>new Promise(()=>{});
 let resolved=false;const ack=manager.post(id).then(result=>{resolved=true;assert.equal(intentSaved,true);return result;});await pause();assert.equal(resolved,false);assert.equal(manager.list()[0].state,'uploading');assert.equal(await ack,true);
});
test('publish intent survives a slow draft write and still publishes after reload',async()=>{
 let publishes=0;const draft={setProgress(){},restore(){},snapshot:async()=>({id:'posted',images:[],completed:[]}),stage:async()=>{},submit:async()=>{publishes++;return{postId:'posted'}}};
 const {store,rows}=harness(()=>draft);const id=randomUUID(),now=Date.now();
 await store.putIntent({operationId:id,ownerId:'owner',createdAt:now,postId:null,notEaten:false});
 await store.put({operationId:id,ownerId:'owner',createdAt:now,reservedAt:now,...fields,files:[file],snapshot:null,posted:false,state:'uploading',sent:0,total:file.size});
 assert.equal(rows.get(id).posted,false);
 const restored=new UploadManager(store,()=>draft,async()=>{});await restored.initialize('owner');assert.equal(restored.list()[0].posted,true);
 await until(()=>publishes===1);assert.equal(restored.list()[0].postId,'posted');
});
test('posting reports a rejected durable flag without stopping the upload',async()=>{
 const {manager,store}=harness(()=>({setProgress(){},snapshot:async()=>null,stage:async()=>new Promise(()=>{}),submit:async()=>({postId:'posted'})}));
 await manager.initialize('owner');const id=manager.stage([file],fields);await pause();store.putIntent=async()=>{throw Error('disk failed')};assert.equal(await manager.post(id),false);assert.equal(manager.list()[0].posted,true);assert.equal(manager.list()[0].state,'uploading');
});

test('retrying after a completed background post reuses its operation without publishing twice',async()=>{
 let publishes=0;const draft={setProgress(){},snapshot:async()=>({id:'published',images:[],completed:[]}),stage:async()=>{},submit:async()=>{publishes++;return{postId:'published'}}};
 const{manager}=harness(()=>draft);await manager.initialize('owner');const id=manager.stage([file],fields);await manager.post(id);await until(()=>manager.list()[0]?.postId==='published');assert.equal(manager.stage([file],fields,id),id);assert.equal(await manager.post(id),true);await pause();assert.equal(publishes,1);assert.equal(manager.list()[0].postId,'published');
});

test('an uninitialized post waits for its owner-bound checkpoint and can recover after reload',async()=>{
 let authenticate;const auth=new Promise(resolve=>authenticate=resolve),rows=new Map();
 const store=withIntents({all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id),clear:async()=>rows.clear()},rows);
 const makeDraft=()=>({setProgress(){},restore(){},snapshot:async()=>null,stage:async()=>new Promise(()=>{}),submit:async()=>{throw Error('must stay pending')}});
 const manager=new UploadManager(store,makeDraft,async()=>{},fetch,()=>auth);
 const id=manager.stage([file],fields);let resolved=false;
 const ack=manager.post(id).then(result=>{resolved=true;return result;});
 // Even a successful ownerless write is not proof that initialize can recover it.
 manager.update(id,{caption:'kept meal'});await until(()=>rows.has(id));assert.equal(rows.get(id).ownerId,'');assert.equal(resolved,false);
 authenticate('owner');assert.equal(await ack,true);const saved=rows.get(id);assert.equal(saved.ownerId,'owner');assert.equal(saved.posted,true);
 const restored=new UploadManager(store,makeDraft,async()=>{});await restored.initialize('owner');assert.equal(restored.list()[0].operationId,id);assert.equal(restored.list()[0].posted,true);assert.equal(restored.list()[0].caption,'kept meal');
});
test('a post checkpoint cannot acknowledge an entry deleted or switched to another account while writing',async()=>{
 for(const change of ['remove','account']){
  let release;const gate=new Promise(resolve=>release=resolve),rows=new Map();
  const store=withIntents({all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id),clear:async()=>rows.clear()},rows);
  const originalIntent=store.putIntent;store.putIntent=async intent=>{await gate;return originalIntent(intent);};
  const draft={setProgress(){},snapshot:async()=>null,stage:async()=>new Promise(()=>{}),submit:async()=>{throw Error('must stay pending')}};
  const manager=new UploadManager(store,()=>draft,async()=>{});await manager.initialize('owner');const id=manager.stage([file],fields);await pause();const ack=manager.post(id);await pause();
  const changed=change==='remove'?manager.remove(id):manager.initialize('other');release();await changed;assert.equal(await ack,false);assert.deepEqual(manager.list(),[]);
 }
});
test('a late authentication response cannot revive an operation after its manager was cleared',async()=>{
 let authenticate;const auth=new Promise(resolve=>authenticate=resolve),rows=new Map();const store=withIntents({all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,row),remove:async id=>rows.delete(id),clear:async()=>rows.clear()},rows);
 const draft={setProgress(){},snapshot:async()=>null,stage:async()=>{throw Error('must not stage')},submit:async()=>{throw Error('must not publish')}};
 const manager=new UploadManager(store,()=>draft,async()=>{},fetch,()=>auth);const id=manager.stage([file],fields);const ack=manager.post(id);await manager.clear();authenticate('owner');assert.equal(await ack,false);await pause();assert.deepEqual(manager.list(),[]);assert.equal(rows.size,0);
});

function attachHarness(media,{uniqueStages=false}={}){
 const rows=new Map(),calls=[];
 const store=withIntents({all:async()=>[...rows.values()],put:async row=>{await pause();rows.set(row.operationId,structuredClone(row));},remove:async id=>{rows.delete(id);},clear:async()=>rows.clear()},rows);
 const request=async(url,init)=>{
  const path=typeof url==='string'?url:url.url;calls.push(path);
  if(path.endsWith('/api/media/sign-upload')){const stage=uniqueStages?'stage-'+calls.filter(c=>c.endsWith('/api/media/sign-upload')).length:'stage';return Response.json({uploads:[{position:0,originalPath:`owner/${stage}/0.jpg`,feedPath:`owner/${stage}/0.feed.jpg`,originalSignedUrl:'https://storage.invalid/o',feedSignedUrl:'https://storage.invalid/f'}]});}
  if(path.startsWith('https://storage.invalid/'))return new Response(null,{status:200});
  if(path.endsWith('/media'))return media(init);
  throw Error('unexpected '+path);
 };
 const encode=async()=>({original:new Blob(['o']),feed:new Blob(['f']),phash:'1',width:10,height:10});
 const makeDraft=()=>({setProgress(){},restore(){},snapshot:async()=>null,stage:async()=>{throw Error('attachments never stage a draft')},submit:async()=>{throw Error('attachments never submit a draft')}});
 const make=()=>new UploadManager(store,makeDraft,async()=>{},request,async()=>'owner',encode);
 return{manager:make(),make,store,rows,calls};
}
test('an attachment is durable before the sheet may close, then uploads and attaches in the background',async()=>{
 const {manager,store,rows,calls}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));
 await manager.initialize('owner');const id=await manager.postAttachment(file,{postId:'post-1',notEaten:true});
 assert.equal(store.intents.get(id).postId,'post-1');assert.equal(store.intents.get(id).notEaten,true);
 assert.equal(calls.filter(c=>c.endsWith('/media')).length,0);
 await until(()=>manager.list()[0]?.postId==='post-1');
 assert.deepEqual(calls,['/api/media/sign-upload','https://storage.invalid/o','https://storage.invalid/f','/api/posts/post-1/media']);
 assert.equal((await store.all()).length,0);assert.equal((await store.allIntents()).length,0);
});
test('two overlapping attachment entries keep distinct operation ids',async()=>{
 const {manager}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));
 await manager.initialize('owner');
 const first=manager.postAttachment(file,{postId:'post-1',notEaten:true});
 const second=manager.postAttachment(new File(['other'],'other.jpg',{type:'image/jpeg'}),{postId:'post-1',notEaten:false});
 const [a,b]=await Promise.all([first,second]);assert.notEqual(a,b);assert.equal(manager.list().length,2);
});
test('a lost photo write after publish intent leaves retake state on reload',async()=>{
 const {manager,make,store}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));
 await manager.initialize('owner');const put=store.put;store.put=async()=>{throw Error('disk full');};
 const id=await manager.postAttachment(file,{postId:'post-1',notEaten:true});assert.ok(store.intents.has(id));
 const restored=make();await restored.initialize('owner');assert.equal(restored.list().length,1);
 assert.equal(restored.list()[0].photoLost,true);assert.match(restored.list()[0].message,/not kept/);
 store.put=put;
});
test('online and explicit retry skip photo-lost attachments without network work',async()=>{
 const {manager,make,store,calls}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));
 await manager.initialize('owner');const put=store.put;store.put=async()=>{throw Error('disk full');};
 await manager.postAttachment(file,{postId:'post-1',notEaten:true});
 const restored=make();await restored.initialize('owner');assert.equal(restored.list()[0].photoLost,true);
 const before=calls.length;
 restored.online();restored.retry(restored.list()[0].operationId);
 assert.equal(restored.list()[0].state,'failed');assert.equal(restored.list()[0].photoLost,true);assert.equal(calls.length,before);
 store.put=put;
});
test('a failed attachment keeps the photo and retries from the chip',async()=>{
 let succeed=false;
 const {manager,rows,calls}=attachHarness(()=>succeed?Response.json({post_id:'post-1'},{status:201}):Response.json({error:'The photo could not be attached.'},{status:503}));
 await manager.initialize('owner');const id=await manager.postAttachment(file,{postId:'post-1',notEaten:true});
 await until(()=>manager.list()[0]?.state==='failed');
 assert.equal(manager.list()[0].message,'The photo could not be attached.');assert.equal(manager.list()[0].attachment.postId,'post-1');assert.equal(rows.get(id).files[0].size,file.size);
 succeed=true;manager.retry(id);await until(()=>manager.list()[0]?.postId==='post-1');
 assert.equal(calls.filter(c=>c==='/api/media/sign-upload').length,1);
});
test('an attachment is not a feed card',async()=>{
 const {manager}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));
 await manager.initialize('owner');await manager.postAttachment(file,{postId:'post-1',notEaten:false});
 assert.ok(manager.list()[0].attachment);assert.equal(manager.list()[0].kind,undefined);
 await until(()=>manager.list()[0]?.postId==='post-1');
});
test('reloading a failed attachment reuses its durable stage after an ambiguous response',async()=>{
 let succeed=false;const photos=[];
 const {manager,make,calls,rows}=attachHarness(init=>{photos.push(JSON.parse(init.body).photo);if(!succeed)throw Error('response lost');return Response.json({post_id:'post-1'},{status:201});});
 await manager.initialize('owner');const id=await manager.postAttachment(file,{postId:'post-1',notEaten:true});await until(()=>rows.get(id)?.state==='failed');
 const restored=make();await restored.initialize('owner');assert.equal(restored.list()[0].state,'failed');succeed=true;restored.retry(id);await until(()=>restored.list()[0]?.postId==='post-1');
 assert.equal(calls.filter(c=>c==='/api/media/sign-upload').length,1);assert.ok(photos.every(photo=>photo.path==='owner/stage/0.jpg'));
});
test('a rejected publish intent leaves only the sheet owning a retry',async()=>{
 const {manager,store,calls,rows}=attachHarness(()=>Response.json({post_id:'post-1'},{status:201}));await manager.initialize('owner');const putIntent=store.putIntent;store.putIntent=async()=>{throw Error('intent write lost');};
 await assert.rejects(()=>manager.postAttachment(file,{postId:'post-1',notEaten:true}),/could not be kept/);
 assert.deepEqual(calls,[]);assert.deepEqual(manager.list(),[]);assert.equal(rows.size,0);assert.equal(store.intents.size,0);
 store.putIntent=putIntent;await manager.postAttachment(file,{postId:'post-1',notEaten:true});await until(()=>manager.list()[0]?.postId==='post-1');
 assert.equal(manager.list().length,1);assert.equal(calls.filter(c=>c.endsWith('/media')).length,1);
});

test('a persisted expired stage is reconciled before renewal and its kept photo uploads after reload',async()=>{
 const old={path:'owner/old-stage/0.jpg',width:10,height:10};const attempts=[];
 const {manager,rows,calls}=attachHarness(init=>{const photo=JSON.parse(init.body).photo;attempts.push(photo.path);return photo.path===old.path?Response.json({code:'attachment_stage_expired',error:'Expired'},{status:409}):Response.json({post_id:'post-1'},{status:201});},{uniqueStages:true});
 rows.set('old-operation',{operationId:'old-operation',ownerId:'owner',createdAt:0,reservedAt:0,caption:'Leftovers',eatenAt:null,location:null,options:{},files:[file],snapshot:null,posted:true,state:'failed',sent:0,total:file.size,attachment:{postId:'post-1',notEaten:true},attachmentPhoto:old});
 await manager.initialize('owner');manager.retry('old-operation');await until(()=>manager.list()[0]?.postId==='post-1');
 assert.deepEqual(attempts,[old.path,'owner/stage-1/0.jpg']);assert.equal(calls[0],'/api/posts/post-1/media');assert.equal(calls.filter(c=>c.endsWith('/api/media/sign-upload')).length,1);assert.equal(rows.size,0);
});
test('an old committed attachment with a lost response is not renewed merely because time passed',async()=>{
 const attempts=[];const old={path:'owner/committed-stage/0.jpg',width:10,height:10};
 const {manager,rows,calls}=attachHarness(init=>{attempts.push(JSON.parse(init.body).photo.path);return Response.json({post_id:'post-1'},{status:201});});
 rows.set('committed-operation',{operationId:'committed-operation',ownerId:'owner',createdAt:0,reservedAt:0,caption:'Leftovers',eatenAt:null,location:null,options:{},files:[file],snapshot:null,posted:true,state:'failed',sent:0,total:file.size,attachment:{postId:'post-1',notEaten:true},attachmentPhoto:old});
 await manager.initialize('owner');manager.retry('committed-operation');await until(()=>manager.list()[0]?.postId==='post-1');
 assert.deepEqual(attempts,[old.path]);assert.equal(calls.filter(c=>c.endsWith('/api/media/sign-upload')).length,0);
});
