import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const directory=new URL('./fixtures/',import.meta.url);
export async function startFakeMeta(){
 let control=null;const calls=[];
 const server=http.createServer(async(request,response)=>{
  try{
   const chunks=[];let size=0;for await(const chunk of request){size+=chunk.length;if(size>32*1024*1024){response.writeHead(413).end();return;}chunks.push(chunk);}
   const path=new URL(request.url,'http://localhost').pathname;
   const json=()=>JSON.parse(Buffer.concat(chunks).toString()||'{}');
   if(path==='/__control'&&request.method==='POST'){
    const next=json();if(![400,429,503].includes(next.status)||!Number.isInteger(next.times??1)||(next.times??1)<1){response.writeHead(400).end();return;}
    control={status:next.status,times:next.times??1,retryAfter:next.retryAfter};response.writeHead(204).end();return;
   }
   calls.push({path,method:request.method});
   if(control?.times>0){control.times--;response.writeHead(control.status,{'Content-Type':'application/json',...(control.retryAfter===undefined?{}:{'retry-after':String(control.retryAfter)})}).end(JSON.stringify({error:{message:'Forced fixture failure',type:'fixture_error'}}));return;}
   if(path==='/v1/models'&&request.method==='GET'){response.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({data:[{id:'sam-3.1'},{id:'muse-spark-1.3'}]}));return;}
   let filename;
   if(path==='/v1/responses'&&request.method==='POST'){
    const body=json();
    if(body.model==='sam-3.1')filename='sam.sse';
    else if(body.model==='muse-spark-1.3'&&['identify','correct','same_meal','search_query','wording'].includes(body.text?.format?.name))filename=`spark-${body.text.format.name}.json`;
   }else if(path==='/v1/asr/transcribe'&&request.method==='POST')filename='transcribe.json';
   if(!filename){response.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({error:{message:'Unknown fixture request'}}));return;}
   response.writeHead(200,{'Content-Type':filename.endsWith('.sse')?'text/event-stream':'application/json'}).end(await readFile(new URL(filename,directory)));
  }catch{response.writeHead(500,{'Content-Type':'application/json'}).end(JSON.stringify({error:{message:'Fixture unavailable'}}));}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 return {origin,baseURL:`${origin}/v1`,calls,close:()=>new Promise(resolve=>server.close(resolve))};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const fake=await startFakeMeta();console.log(fake.baseURL);}
