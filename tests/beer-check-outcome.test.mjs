import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/run17-checks.mjs',import.meta.url),'utf8');
test('a vanished answer meal never counts as answered',()=>{
  const body=source.slice(source.indexOf('   receipt.samples=samples;'),source.indexOf('  }finally{tickStop'));
  const context={receipt:{},process:{},settled:{feed:{card:true},post:{status:'ready',question:{}}},samples:[{label:'answer-0',post:null}],still:{id:'second',status:'ready',question:null}};
  vm.runInNewContext(body,context);
  assert.equal(context.receipt.pass,false);
  assert.equal(context.process.exitCode,1);
  assert.match(context.receipt.error,/answer/i);
});
async function cleanup({remaining=[],removeError=false}={}){
  const calls=[],receipt={},process={},ledger={posts:[{id:'fixture'}],cleanup:[]};
  const admin={from(table){let operation;const q={delete(){operation='delete';calls.push([table,operation]);return q;},select(){operation='select';calls.push([table,operation]);return q;},eq(){return q;},maybeSingle(){return q;},then(resolve){resolve({data:operation==='select'?remaining:[],error:removeError&&operation==='delete'?{message:'delete refused'}:null});}};return q;},storage:{from(){return{remove:async()=>({data:[],error:null})};}}};
  const body=source.slice(source.indexOf(' for(const entry of ledger.posts)'),source.indexOf("    if(mode==='beer')try"));
  const checked=r=>{if(r.error)throw Error('Owned fixture database operation failed');return r.data;};
  await vm.runInNewContext('(async()=>{'+body+'})()',{admin,ledger,receipt,process,user:{id:'owner'},checked,storedPaths:async()=>[],pause:async()=>{},save:async()=>{}});
  return {calls,receipt,process,ledger};
}
test('cleanup deletes fixture failure rows and reads all rows back before claiming absence',async()=>{
  const r=await cleanup();
  for(const table of ['posts','post_upload_drafts','upload_failures']){
    assert.ok(r.calls.some(([t,op])=>t===table&&op==='delete'),table+' delete');
    assert.ok(r.calls.some(([t,op])=>t===table&&op==='select'),table+' read-back');
  }
  assert.equal(r.ledger.cleanup[0].absent,true);
});
test('a remaining row makes cleanup visibly fail with nonzero exit',async()=>{
  const r=await cleanup({remaining:[{id:'fixture'}]});
  assert.equal(r.process.exitCode,1);
  assert.notEqual(r.ledger.cleanup[0].absent,true);
  assert.equal(r.receipt.pass,false);
  assert.match(r.receipt.cleanupErrors[0],/fixture.*remaining/i);
});
test('a failed delete makes cleanup visibly fail with nonzero exit',async()=>{
  const r=await cleanup({removeError:true});
  assert.equal(r.process.exitCode,1);
  assert.equal(r.receipt.pass,false);
  assert.match(r.receipt.cleanupErrors[0],/fixture/);
});
