import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {tsImport} from 'tsx/esm/api';

test('raw and SDK calls retry a real HTTP body stall inside one 30-second attempt', {timeout:45000}, async()=>{
 const counts=new Map();
 const server=http.createServer((request,response)=>{
  const count=(counts.get(request.url)??0)+1;counts.set(request.url,count);
  response.writeHead(200,{'content-type':'application/json'});
  if(count===1){response.flushHeaders();response.write('{');return;}
  response.end(JSON.stringify(request.url==='/v1/models'?{data:[]}:{status:'completed',output:[]}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const previous={base:process.env.MODEL_API_BASE_URL,key:process.env.MODEL_API_KEY};
 process.env.MODEL_API_BASE_URL=`http://127.0.0.1:${server.address().port}/v1`;process.env.MODEL_API_KEY='fixture';
 try{
  const {createResponse,createMetaClient}=await tsImport('../src/lib/meta/client.ts',import.meta.url);
  const [raw,sdk]=await Promise.all([createResponse({model:'fixture'}),createMetaClient().models.list()]);
  assert.equal(raw.status,'completed');assert.deepEqual(sdk.data,[]);
  assert.equal(counts.get('/v1/responses'),2);assert.equal(counts.get('/v1/models'),2);
 }finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  if(previous.base===undefined)delete process.env.MODEL_API_BASE_URL;else process.env.MODEL_API_BASE_URL=previous.base;
  if(previous.key===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=previous.key;
 }
});
