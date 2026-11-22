// Scripted Meta and USDA responses for local integration tests; no provider calls.
import http from'node:http';import{readFile}from'node:fs/promises';import{startFakeMeta}from'../fake-meta/server.mjs';
const estimateCases={'estimate-coffee':['Kopi talua','coffee',35],'estimate-coffee-unknown':['Kopi talua','coffee',null],'estimate-barley-zero':['Barley tea','tea',0],'estimate-ginger-zero':['Lemon ginger tea','tea',0],'estimate-decaf-zero':['Decaf coffee','coffee',0],'estimate-other-zero':['Orange juice','other drink',0],'estimate-coffee-missing':['Kopi talua','coffee',undefined]};
const fixture=JSON.parse(await readFile(new URL('../fake-meta/fixtures/spark-identify.json',import.meta.url),'utf8'));const fake=await startFakeMeta();let mode=null,calls=[];
http.createServer(async(req,res)=>{const parts=[];for await(const chunk of req)parts.push(chunk);const bytes=Buffer.concat(parts);const json=()=>JSON.parse(bytes.toString()||'{}');const url=new URL(req.url,'http://localhost');const send=(status,data)=>res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(data));
// Exercise the real /api/transcribe route with one server-side stand-in in both browsers.
if(url.pathname==='/v1/asr/transcribe'&&req.method==='POST'){
 try{
  const form=await new Request('http://localhost'+req.url,{method:'POST',headers:req.headers,body:bytes}).formData();
  const request=form.get('request'),audio=form.get('audio');
  if(!request||!(audio instanceof Blob)||!audio.size)return send(400,{error:'Scripted transcription needs request and audio parts'});
  calls.push({name:'transcribe',path:url.pathname,audioBytes:audio.size,audioType:audio.type});
  return send(200,{transcript:'A bowl of porridge'});
 }catch{return send(400,{error:'Scripted transcription needs multipart form data'});}
}
if(url.pathname.startsWith('/fdc/v1/')){if(mode==='fdc-429'){res.writeHead(429,{'Content-Type':'application/json','Retry-After':'120'}).end(JSON.stringify({error:'Scripted USDA rate limit'}));return;}const query=url.searchParams.get('query')??json().query??'';const code=query.replace(/\D/g,'').replace(/^0+/,'');const corn=code==='16000275683',pringles=code==='38000138416',croissant=query.replaceAll('+','').toLowerCase()==='croissant';return send(200,{totalPages:1,foods:corn||pringles||croissant?[{fdcId:corn?9900460:croissant?9900462:9900461,description:corn?'Scripted corn puffs':croissant?'Croissant':'Scripted Pringles',dataType:'Branded',brandOwner:'Scripted fixture',gtinUpc:corn?'016000275683':'00038000138416',servingSize:corn?27:28,servingSizeUnit:'g',foodNutrients:[{nutrientId:1008,value:400},{nutrientId:1003,value:3},{nutrientId:1004,value:5},{nutrientId:1005,value:80},{nutrientId:1079,value:1},{nutrientId:2000,value:12},{nutrientId:1093,value:500}]}]:[]});}
if(url.pathname.endsWith('/__fixture')){mode=json().mode;calls=[];return send(200,{});}if(url.pathname.endsWith('/__calls'))return send(200,calls);
const body=json(),name=body.text?.format?.name;calls.push({name,path:url.pathname});
// #987: force an unfamiliar coffee through empty local USDA searches to an estimate.
if(estimateCases[mode]&&(name==='identify'||name==='nutrition_estimate')){
 const [drinkName,drink,caffeine]=estimateCases[mode];
 const response=structuredClone(fixture),payload=name==='identify'?{items:[{confidence:1,name:drinkName,portion_grams:200,portion_text:'200 ml',region_index:null}],needs_input:null,summary:drinkName+'.',nutrition_label:false}:{food:true,basis:drinkName==='Kopi talua'?'coffee with egg yolk and sugar':'scripted '+drinkName.toLowerCase(),calories:60,protein_g:1.5,carbs_g:8,fat_g:2.5,fibre_g:0,sugar_g:8,sodium_mg:10,caffeine_mg:caffeine,drink};
 for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(payload);
 return send(200,response);
}
if(name==='search_query'&&body.text?.format?.schema?.properties?.id){const data=JSON.parse(body.input[0].content[0].text);const result=structuredClone(fixture);for(const output of result.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify({id:data.candidates?.[0]?.id??null,query:null,query_food:null,reason:'Scripted candidate chosen'});return send(200,result);}
if(mode==='meta-refusal'&&name==='identify')return send(200,{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'Scripted refusal'}]}],usage:{input_tokens:1,output_tokens:1}});
// #615: a caption that disagrees with the photo. The beer is named from the caption and the model asks one question.
if(mode==='beer-question'&&name==='identify'){const response=structuredClone(fixture);const meal={items:[{confidence:0.6,name:'Bintang beer',portion_grams:568,portion_text:'1 pint, from the caption',region_index:null}],needs_input:{question:'The photo does not look like a beer. Was this a pint of Bintang beer?',short:'Clarification needed',options:['Yes, a pint of beer','No, something else']},summary:'A pint of beer, from the caption.',nutrition_label:false};for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);return send(200,response);}
if(mode==='voice-porridge'&&name==='identify'){
 const response=structuredClone(fixture),meal={items:[{confidence:1,name:'Porridge',portion_grams:100,portion_text:'100 g, scripted fixture',region_index:null}],needs_input:null,summary:'Scripted porridge.',nutrition_label:false};
 for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);
 return send(200,response);
}
if(mode&&name==='identify'){const response=structuredClone(fixture),water=mode==='water',unknown=mode==='cola-unknown';const meal={items:[{confidence:1,name:mode==='fdc-429'?'USDA rate-limit fixture '+crypto.randomUUID():water?'Water':'Coca cola',portion_grams:unknown?null:water?300:330,portion_text:water?'300 ml, estimated from the photo':'330 ml, read from the can',region_index:null}],needs_input:null,summary:water?'Water in a glass.':'Cola in a can.',nutrition_label:false};for(const output of response.output)for(const text of output.content??[])if(text.type==='output_text')text.text=JSON.stringify(meal);return send(200,response);}
const up=http.request(new URL(req.url,fake.origin),{method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});up.on('error',()=>send(502,{}));up.end(bytes);
}).listen(Number(process.env.TEST_MODEL_PORT||60165),'127.0.0.1',()=>console.log('Scripted isolated model ready'));
