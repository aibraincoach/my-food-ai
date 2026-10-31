import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {tsImport} from 'tsx/esm/api';

test('identify can finish a real response beyond the ordinary thirty-second timeout without a second request',{timeout:45000},async()=>{
 let requests=0;const timers=new Set();const server=http.createServer((_request,response)=>{requests++;const timer=setTimeout(()=>{timers.delete(timer);response.writeHead(200,{'content-type':'application/json'});response.end(JSON.stringify({status:'completed',output:[]}))},35000);timers.add(timer);response.on('close',()=>{clearTimeout(timer);timers.delete(timer)})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const old={base:process.env.MODEL_API_BASE_URL,key:process.env.MODEL_API_KEY};
 process.env.MODEL_API_BASE_URL=`http://127.0.0.1:${server.address().port}/v1`;process.env.MODEL_API_KEY='fixture-only';
 try{const{createResponse,TIMEOUT_MS,IDENTIFY_TIMEOUT_MS}=await tsImport('../src/lib/meta/client.ts',import.meta.url);assert.equal(TIMEOUT_MS,30000);assert.equal(IDENTIFY_TIMEOUT_MS,60000);const start=performance.now();const result=await createResponse({model:'fixture',text:{format:{name:'identify'}}});assert.equal(result.status,'completed');assert.equal(requests,1);assert.ok(performance.now()-start>TIMEOUT_MS)}
 finally{for(const timer of timers)clearTimeout(timer);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));if(old.base===undefined)delete process.env.MODEL_API_BASE_URL;else process.env.MODEL_API_BASE_URL=old.base;if(old.key===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=old.key}
});
