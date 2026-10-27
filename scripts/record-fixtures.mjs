#!/usr/bin/env node
// Run once with node --env-file=.env.local scripts/record-fixtures.mjs.
// Sends the three committed plates; writes responses only, never image inputs/keys.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),dir=new URL('tests/fake-meta/fixtures/',root);
await mkdir(dir,{recursive:true});
if(!process.env.MODEL_API_KEY||!process.env.FDC_API_KEY)throw new Error('MODEL_API_KEY and FDC_API_KEY are required to record.');
const base='https://api.meta.ai/v1';
const photo=async n=>({type:'input_image',image_url:`data:image/jpeg;base64,${(await readFile(new URL(`scripts/fixtures/plate${n}.jpg`,root))).toString('base64')}`});
async function call(path,body,headers={}){
 const response=await fetch(base+path,{method:'POST',headers:{Authorization:`Bearer ${process.env.MODEL_API_KEY}`,...headers},body,signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw new Error(`Recording request failed: ${response.status}`);return response;
}
const sam=await call('/responses',JSON.stringify({model:'sam-3.1',stream:true,input:[{type:'message',role:'user',content:[{type:'input_text',text:'food item'},await photo(1)]}],metadata:{mask_encoding:'one_bit',include_confidence:'true'}}),{'Content-Type':'application/json'});
await writeFile(new URL('sam.sse',dir),await sam.text());console.log('Recorded sam stream');
const identify=JSON.parse(await readFile(new URL('src/lib/prompts/spark/identify.schema.json',root),'utf8'));
const correct=JSON.parse(await readFile(new URL('src/lib/prompts/spark/correct.schema.json',root),'utf8'));
for(const schema of [identify,correct]){schema.properties.needs_input={type:'null'};schema.required.push('needs_input');}
const nullable={anyOf:[{type:'string'},{type:'null'}]};
const formats={
 identify:{schema:identify,instructions:'Identify foods and grams from the photograph. region_index must be null. Give a plain factual summary with no advice. needs_input null.',content:[await photo(2)]},
 correct:{schema:correct,instructions:'Return the complete meal list after changing the rice to 75 grams. keep and region_index must be null for every item. Give one plain reply saying what changed, no advice. needs_input null.',content:[await photo(3)]},
 same_meal:{schema:{type:'object',properties:{same_meal:{type:'boolean'}},required:['same_meal'],additionalProperties:false},instructions:'Do these pictures show the same foods in the same amounts?',content:[await photo(1),await photo(3)]},
 search_query:{schema:{type:'object',properties:{terms:{type:'array',items:{type:'string'}},date_from:nullable,date_to:nullable,meal:nullable,big:{type:'boolean'},latest_only:{type:'boolean'}},required:['terms','date_from','date_to','meal','big','latest_only'],additionalProperties:false},instructions:'Convert "my last rice meal" to a meal query. Date bounds and meal null; latest_only true.',content:[]},
 wording:{schema:{type:'object',properties:{summary:{type:'string'}},required:['summary'],additionalProperties:false},instructions:'Return a plain sentence: Consumed 100 kcal. No advice.',content:[]},
};
const nutrients=new Set();
for(const [name,{schema,instructions,content}]of Object.entries(formats)){
 const response=await call('/responses',JSON.stringify({model:'muse-spark-1.3',instructions,input:[{type:'message',role:'user',content:[{type:'input_text',text:'Return only the requested structured output.'},...content]}],text:{format:{type:'json_schema',name,strict:true,schema}},max_output_tokens:4096}),{'Content-Type':'application/json'});
 const payload=await response.json();if(payload.status!=='completed')throw new Error(`${name} did not complete`);
 await writeFile(new URL(`spark-${name}.json`,dir),JSON.stringify(payload,null,2)+'\n');
 const text=payload.output?.flatMap(o=>o.content??[]).find(b=>b.type==='output_text')?.text;
 if(name==='identify'||name==='correct')for(const item of JSON.parse(text).items)nutrients.add(item.name.trim().toLowerCase());
 console.log(`Recorded ${name}`);
}
const form=new FormData();form.append('request',new Blob([JSON.stringify({model:'muse-voice-transcribe-1.0',audioEncoding:'WAV',mode:'PUSH_TO_TALK'})],{type:'application/json'}));form.append('audio',new Blob([await readFile(new URL('scripts/fixtures/tone.wav',root))],{type:'audio/wav'}),'tone.wav');
const transcription=await(await call('/asr/transcribe?sessionId=fixture',form,{Accept:'application/json'})).json();
await writeFile(new URL('transcribe.json',dir),JSON.stringify(transcription,null,2)+'\n');console.log('Recorded transcription');
const foods={};
for(const query of nutrients){const params=new URLSearchParams({query,pageSize:'5',dataType:'Foundation,SR Legacy,Branded',api_key:process.env.FDC_API_KEY});const r=await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`);if(!r.ok)throw new Error(`FDC fixture lookup failed ${r.status}`);foods[query]=await r.json();}
await writeFile(new URL('fdc.json',dir),JSON.stringify(foods,null,2)+'\n');
await writeFile(new URL('recording.json',dir),JSON.stringify({recorded_at:new Date().toISOString(),source:'Real Meta Model API and USDA responses',inputs:['plate1.jpg','plate2.jpg','plate3.jpg','tone.wav'],image_bytes_stored:false},null,2)+'\n');
console.log(`Recorded ${nutrients.size} USDA cache entries in ${fileURLToPath(dir)}`);
