// Disposable GoTrue template transport; only the two reviewed local files.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.env.TEST_AUTH_TEMPLATES_PORT);
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!Number.isInteger(port)||port<1024||port>65535)throw Error('Disposable local template server required');
const files=new Map([['/confirmation.html','confirmation.html'],['/recovery.html','recovery.html']]);
http.createServer(async(request,response)=>{
 const file=request.method==='GET'?files.get(request.url):null;
 if(!file){response.writeHead(404);response.end();return;}
 try{const body=await readFile(path.join('supabase/templates',file));response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});response.end(body);}
 catch{response.writeHead(500);response.end('Local auth template could not be loaded.');}
}).listen(port,'127.0.0.1');
