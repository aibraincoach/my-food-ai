// Search-only deterministic interpretation; never contacts a real provider.
import http from 'node:http';
const port=Number(process.env.READING_SEARCH_MODEL_PORT??64565);
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!Number.isInteger(port)||port<1024)throw Error('Local disposable model fixture required');
http.createServer(async(req,res)=>{
 try{
  if(req.method!=='POST'||req.url!=='/v1/responses'){res.writeHead(503);res.end('Unexpected fixture request');return;}
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Body too large');}
  const body=JSON.parse(raw);if(body.text?.format?.name!=='search_query')throw Error('Only search query fixture is supported');
  const input=JSON.parse(body.input[0].content[0].text),text=input.query;
  if(typeof text!=='string'||!/^.*text1287_[a-f0-9]{8}$/.test(text))throw Error('Only uniquely tagged synthetic queries');
  const query={terms:text.startsWith('存在しない')?[text]:[],date_from:text.startsWith('存在しない')?null:'2026-11-24',date_to:text.startsWith('存在しない')?null:'2026-11-25',meal:null,big:false,rank:'recent',latest_only:false};
  res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(query)}]}],usage:{input_tokens:1,output_tokens:1}}));
 }catch{res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:'Unexpected synthetic request'}));}
}).listen(port,'127.0.0.1',()=>console.log('Loopback search interpretation fixture ready'));
