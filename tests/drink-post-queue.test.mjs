import test from'node:test';import assert from'node:assert/strict';import{UploadManager}from'../src/lib/posts/upload-manager.ts';
const pause=()=>new Promise(r=>setImmediate(r)),tile={tile:0,ml:300,eaten_at:'2026-11-03T12:00:00Z',time_zone:'Asia/Jakarta'};
const gate=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{resolve,promise};};
async function until(f){for(let i=0;i<200;i++){if(f())return;await pause();}throw Error('Queue did not settle');}
function store(){const rows=new Map();return{rows,all:async()=>[...rows.values()],put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id),clear:async()=>rows.clear()};}
const draft=()=>({setProgress(){},setSnapshotListener(){},restore(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>{throw Error('Drink must not publish ordinary analysis');}});
test('a tile is durable and pending before backend; two identical taps are separate intents',async()=>{
 const db=store(),held=gate(),bodies=[];const m=new UploadManager(db,draft,async()=>{},async(url,o)=>{assert.match(url,/api\/intake\/post/);const b=JSON.parse(o.body);assert.equal(db.rows.get(b.operation_id).drink.ml,300);assert.equal(b.owner_id,'owner');bodies.push(b);return held.promise.then(()=>Response.json({post_id:'post-'+b.operation_id},{status:201}));});await m.initialize('owner');
 const ids=await Promise.all([m.postDrink(tile,'Water300ml'),m.postDrink(tile,'Water300ml')]);await until(()=>bodies.length===2);assert.equal(new Set(ids).size,2);assert.ok(m.list().every(r=>r.kind==='drink'&&!r.postId));held.resolve();await until(()=>m.list().every(r=>r.postId));assert.equal(db.rows.size,0);
});
test('tile failure survives reload and account isolation, retry keeps operation and eaten-at',async()=>{
 const db=store(),bad=new UploadManager(db,draft,async()=>{},async()=>Response.json({error:'Offline'},{status:503}));await bad.initialize('owner');const id=await bad.postDrink(tile,'Water');await until(()=>bad.list()[0].state==='failed');
 const other=new UploadManager(db,draft,async()=>{},async()=>{throw Error('Other owner must not send');});await other.initialize('other');assert.deepEqual(other.list(),[]);
 let body;const restored=new UploadManager(db,draft,async()=>{},async(_u,o)=>{body=JSON.parse(o.body);return Response.json({post_id:'ready'},{status:201});});await restored.initialize('owner');restored.retry(id);await until(()=>restored.list()[0].postId==='ready');assert.equal(body.operation_id,id);assert.equal(body.eaten_at,tile.eaten_at);
});
test('confirmed photo drinks retain chosen portions and uploaded bytes without identify or restage',async()=>{
 const db=store(),file=new File(['photo'],'photo.jpg'),snapshot={id:'upload',images:[],completed:['both']};let stages=0,body;
 const prepared={...draft(),snapshot:async()=>snapshot,stage:async()=>{stages++;}};const m=new UploadManager(db,()=>prepared,async()=>{},async(url,o)=>{assert.equal(url,'/api/drinks/post');body=JSON.parse(o.body);return Response.json({post_id:'upload'},{status:201});});await m.initialize('owner');
 const id=m.stage([file],{caption:'',eatenAt:tile.eaten_at,location:null,options:{}});await until(()=>m.list()[0].state==='uploaded');await m.postPhotoDrinks({upload_id:'upload',caption:'',eaten_at:tile.eaten_at,location:null,save_as_meal:false,readings:[{reading_id:'reading',selections:[{index:0,ml:165}]}]},'Cola165ml',id);await until(()=>m.list()[0].postId==='upload');assert.equal(stages,1);assert.equal(body.readings[0].selections[0].ml,165);assert.equal(body.owner_id,'owner');assert.equal(body.operation_id,id);
});
test('unknown photo commit removal survives a dropped cancel response and reload',async()=>{
 const db=store(),file=new File(['photo'],'photo.jpg'),snapshot={id:'upload',images:[],completed:[]};let posts=0,deletes=0;
 const prepared={...draft(),snapshot:async()=>snapshot};const bad=new UploadManager(db,()=>prepared,async()=>{},async(_u,o)=>{if(o.method==='DELETE'){deletes++;throw Error('lost cancel response');}posts++;return Response.json({error:'lost commit response'},{status:503});});await bad.initialize('owner');const id=bad.stage([file],{caption:'',eatenAt:tile.eaten_at,location:null,options:{}});await until(()=>bad.list()[0].state==='uploaded');await bad.postPhotoDrinks({upload_id:'upload',caption:'',eaten_at:tile.eaten_at,location:null,save_as_meal:false,readings:[{reading_id:'reading',selections:[{index:0,ml:150}]}]},'Water150ml',id);await until(()=>bad.list()[0].state==='failed');await bad.discardDrink(id);await until(()=>deletes===1&&bad.list()[0].state==='failed');
 const restored=new UploadManager(db,draft,async()=>{},async(url,o)=>{assert.equal(url,'/api/drinks/post');assert.equal(o.method,'DELETE');assert.equal(JSON.parse(o.body).upload_id,'upload');return Response.json({post_id:'upload'});});await restored.initialize('owner');restored.retry(id);await until(()=>restored.list().length===0);assert.equal(posts,3);assert.equal(db.rows.size,0);
});
