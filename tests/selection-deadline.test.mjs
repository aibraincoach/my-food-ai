import test from 'node:test';
import assert from 'node:assert/strict';
import {UploadManager} from '../src/lib/posts/upload-manager.ts';
import {JSON_REQUEST_LIMIT_MS} from '../src/lib/media/pack-photo-upload.ts';
const turn=()=>new Promise(resolve=>setImmediate(resolve));
async function until(check){for(let i=0;i<100;i++){if(check())return;await turn();}throw Error('Selection did not settle');}
const draft=()=>({setProgress(){},setSnapshotListener(){},restore(){},snapshot:async()=>null,stage:async()=>{},submit:async()=>{throw Error('Selection must not use ordinary analysis');}});
function store(){const rows=new Map();return{rows,all:async()=>[...rows.values()],allIntents:async()=>[],put:async row=>rows.set(row.operationId,structuredClone(row)),remove:async id=>rows.delete(id)};}
const food={fdc_id:1,grams:100,eaten_at:'2026-11-22T00:00:00Z'},drink={tile:0,ml:300,eaten_at:food.eaten_at,time_zone:'UTC'},copy={id:'source',saved:false,eatenAt:food.eaten_at};
for(const kind of ['food','drink','copy'])for(const removing of [false,true]){
 test(`${kind} ${removing?'removal':'save'} times out once, keeps its selection and explicitly retries the same operation`,async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  t.mock.method(AbortSignal,'timeout',ms=>{assert.equal(ms,JSON_REQUEST_LIMIT_MS);const controller=new AbortController();setTimeout(()=>controller.abort(new DOMException('Timed out','TimeoutError')),ms);return controller.signal;});
  const db=store(),bodies=[],commits=new Map();let hung=false,recover=false,delays=0;
  const request=async(_url,options)=>{
   const body=JSON.parse(options.body);bodies.push({method:options.method,body});
   if(!removing||options.method==='DELETE'){
    if(!recover){hung=true;commits.set(body.operation_id,'one-meal');return new Promise((_resolve,reject)=>{options.signal?.addEventListener('abort',()=>reject(options.signal.reason),{once:true});});}
   }
   return Response.json({post_id:'one-meal',postId:'one-meal'});
  };
  const manager=new UploadManager(db,draft,async()=>{delays++;},request);
  await manager.initialize('owner');
  const id=kind==='food'?await manager.postFood(food,'Rice'):kind==='drink'?await manager.postDrink(drink,'Water'):await manager.postCopy(copy,'Copied rice');
  if(removing){
   // post above normally completes; the fixture below instead restores the pending selection for removal.
   await until(()=>manager.list()[0]?.postId==='one-meal');
   const data={operationId:id,ownerId:'owner',createdAt:Date.now(),reservedAt:Date.now(),caption:'Kept selection',eatenAt:food.eaten_at,location:null,options:{},files:[],snapshot:null,posted:true,state:'failed',sent:0,total:0,[kind]:kind==='food'?food:kind==='drink'?drink:copy};
   await db.put(data);
   const restored=new UploadManager(db,draft,async()=>{delays++;},request);
   await restored.initialize('owner');
   if(kind==='drink')await restored.discardDrink(id);else await restored.discardFood(id);
   await check(restored);
  }else await check(manager);
  async function check(active){
   await until(()=>hung);t.mock.timers.tick(JSON_REQUEST_LIMIT_MS);await turn();await turn();
   assert.equal(active.list()[0].state,'failed','deadline must produce a visible failed entry');
   assert.equal(db.rows.get(id)[kind][kind==='drink'?'ml':kind==='copy'?'id':'fdc_id'],kind==='drink'?300:kind==='copy'?'source':1);
   assert.equal(db.rows.get(id).operationId,id);assert.equal(delays,0,'no quiet automatic retries');
   const before=bodies.length;recover=true;active.retry(id);
   await until(()=>removing?active.list().length===0:active.list()[0]?.postId==='one-meal');
   assert.equal(bodies.length,before+1);assert.equal(bodies.at(-1).body.operation_id,id);assert.equal(commits.size,1);
   assert.equal(db.rows.size,0);
  }
 });
}
