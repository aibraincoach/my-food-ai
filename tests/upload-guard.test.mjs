// node --import tsx --env-file=.env.local --test tests/upload-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {signShotUploads} from '../src/lib/media/storage.ts';
import {PostUploadDraft} from '../src/lib/posts/create.ts';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
import {admin,user,checked} from './db/helpers.mjs';
import {randomUUID} from 'node:crypto';
const file=new File(['image'],'meal.jpg',{type:'image/jpeg'});
const fields={caption:'meal',eatenAt:null,location:null,options:{}};
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await pause();}throw Error('state did not settle');}
function harness(makeDraft){const rows=new Map();const store={all:async()=>[...rows.values()],put:async row=>{rows.set(row.operationId,structuredClone(row));},remove:async id=>{rows.delete(id);},clear:async()=>rows.clear()};const manager=new UploadManager(store,makeDraft,async()=>{});return{manager,store,rows};}
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
 let release;const gate=new Promise(resolve=>release=resolve),rows=new Map();const store={all:async()=>[],put:async row=>{await gate;rows.set(row.operationId,row);},remove:async id=>rows.delete(id),clear:async()=>rows.clear()};
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
  const renewed=await signShotUploads(client,owner.id,id,[0,1]);assert.equal(renewed.length,2);
  const {client:other}=await user(2);await assert.rejects(signShotUploads(other,owner.id,id,[0]),/row.level security/i);
  const result=await db.rpc('publish_uploaded_post',{p_operation_id:id,p_user_id:owner.id});assert.equal(result.error?.code,'22023');assert.match(result.error.message,/incomplete/i);
  const post=checked(await db.from('posts').select('status').eq('id',id).maybeSingle());assert.equal(post,null);
 }finally{await db.storage.from('media').remove([`${base}/0.jpg`]);await db.from('jobs').delete().contains('payload',{deleted_post_id:id});await db.from('post_upload_drafts').delete().eq('id',id);}
});
