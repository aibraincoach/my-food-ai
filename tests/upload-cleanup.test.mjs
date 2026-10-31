import test from 'node:test';
import assert from 'node:assert/strict';
import cleanupModule from '../src/lib/worker/jobs/media_cleanup.ts';
const cleanup=typeof cleanupModule==='function'?cleanupModule:cleanupModule.default;
const owner='11111111-1111-4111-8111-111111111111',stage='22222222-2222-4222-8222-222222222222',prefix=`${owner}/${stage}`;
const job={id:'cleanup',post_id:null,payload:{owner_id:owner,deleted_post_id:stage,paths:[`${prefix}/0.jpg`,`${prefix}/0.feed.jpg`]}};
function fixture({claimed=false,removeFailure=false}={}){
 const removed=[],deletes=[],lists=[];
 const db={from(table){
  if(table==='post_media')return{select(){return this},like(){return this},async limit(){return{data:claimed?[{id:'claimed'}]:[],error:null}}};
  if(table==='post_upload_drafts'){const filters=[];const chain={eq(k,v){filters.push([k,v]);return chain},then(resolve){deletes.push(filters);return Promise.resolve({error:null}).then(resolve)}};return{delete(){return chain}};}
  throw Error('Unexpected table');
 },storage:{from(){return{
  async list(path){lists.push(path);if(path===prefix)return{data:[...Array.from({length:4},(_,i)=>[{id:`o${i}`,name:`${i}.jpg`},{id:`f${i}`,name:`${i}.feed.jpg`}]).flat(),{id:null,name:'cards'}],error:null};if(path===`${prefix}/cards`)return{data:[{id:'card',name:'old.png'}],error:null};throw Error('Unexpected prefix')},
  async remove(paths){if(removeFailure)return{error:{message:'down'}};removed.push(...paths);return{error:null}}
 };}}};return{db,removed,deletes,lists};
}
test('shot-zero cleanup payload discovers and removes every copy of a four-photo stage',async()=>{
 const f=fixture();await cleanup(f.db,job);for(let i=0;i<4;i++){assert.ok(f.removed.includes(`${prefix}/${i}.jpg`));assert.ok(f.removed.includes(`${prefix}/${i}.feed.jpg`));}assert.ok(f.removed.includes(`${prefix}/cards/old.png`));assert.equal(f.removed.length,9);assert.deepEqual(f.deletes,[[['id',stage],['user_id',owner],['published',false]]]);
});
test('a claimed photo prevents all object and draft cleanup, including pack photos',async()=>{
 const f=fixture({claimed:true});await cleanup(f.db,job);assert.deepEqual(f.removed,[]);assert.deepEqual(f.deletes,[]);assert.deepEqual(f.lists,[]);
});
test('a storage deletion failure keeps retry metadata intact',async()=>{
 const f=fixture({removeFailure:true});await assert.rejects(cleanup(f.db,job),/could not be removed/);assert.deepEqual(f.deletes,[]);
});

test('a failed later listing page deletes no paths and retains draft metadata for retry',async()=>{
 const f=fixture();
 f.db.storage.from=()=>({
  async list(path,{offset}){assert.equal(path,prefix);if(offset===0)return{data:Array.from({length:100},(_,i)=>({id:String(i),name:`${i}.jpg`})),error:null};return{data:null,error:{message:'listing unavailable'}};},
  async remove(paths){f.removed.push(...paths);return{error:null};}
 });
 await assert.rejects(cleanup(f.db,job),/could not be listed/);
 assert.deepEqual(f.removed,[]);assert.deepEqual(f.deletes,[]);
});
