// Local test transport; the real app and worker remain behind this proxy.
import http from'node:http';
const upstream=new URL(process.env.APP_URL??''),port=Number(process.env.CAPTURE_FAULT_PORT??64448);
if(process.env.MFA_TEST_DISPOSABLE!=='1'||upstream.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(upstream.hostname)||!Number.isInteger(port)||port<1024||port>65535)throw Error('Disposable loopback app and test port required');
let fail=false;
http.createServer((req,res)=>{
 if(req.url==='/__capture_fault/on'||req.url==='/__capture_fault/off'){fail=req.url.endsWith('/on');req.resume();res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({fail}));return;}
 if(fail&&req.method==='PUT'&&new URL(req.url,upstream).pathname==='/api/posts'){req.resume();res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({error:"The server didn't respond.",message_code:'serverFailed'}));return;}
 const up=http.request({hostname:upstream.hostname,port:upstream.port,path:req.url,method:req.method,headers:req.headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});up.on('error',()=>res.writeHead(502).end('Local app unavailable'));req.pipe(up);
}).listen(port,'127.0.0.1',()=>console.log('Local capture failure proxy ready'));
