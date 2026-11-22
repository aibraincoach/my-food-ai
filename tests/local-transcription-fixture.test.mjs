import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('local model transcribes multipart audio and rejects missing parts', async()=>{
 const socket=net.createServer();socket.listen(0,'127.0.0.1');await once(socket,'listening');const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
 const child=spawn(process.execPath,['tests/fixtures/local-model.mjs'],{env:{...process.env,TEST_MODEL_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let logs='';child.stdout.on('data',data=>{logs+=data;});child.stderr.on('data',data=>{logs+=data;});
 try{
  await Promise.race([new Promise(resolve=>{child.stdout.on('data',()=>{if(logs.includes('Scripted isolated model ready'))resolve();});}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Fixture did not start: '+logs)),5000);timer.unref();})]);
  const url=`http://127.0.0.1:${port}/v1/asr/transcribe?sessionId=synthetic`;
  for(const missing of ['request','audio',null]){
   const body=new FormData();if(missing!=='request')body.append('request',new Blob(['{"model":"muse-voice-transcribe-1.0"}'],{type:'application/json'}));if(missing!=='audio')body.append('audio',new Blob([new Uint8Array(100)],{type:'audio/wav'}),'recording.wav');
   const response=await fetch(url,{method:'POST',body,signal:AbortSignal.timeout(3000)});
   assert.equal(response.status,missing?400:200);
   if(!missing)assert.deepEqual(await response.json(),{transcript:'A bowl of porridge'});
  }
 }finally{if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}}
});
