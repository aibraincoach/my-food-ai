import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/lib/meta/label.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const panel={kcal:null,protein_g:null,carbs_g:10,fat_g:2,fibre_g:null,sugar_g:null,sodium_mg:null};
const reading=per_serving=>({is_label:true,serving:{amount:55,unit:'g'},per_serving,product_name:'Crackers',box:{x:0,y:0,w:1,h:1}});
async function run(first,retry){
 const answers=[first,retry],calls=[],exports={};
 const deps={'./retry404':{createResponseRetrying404:async input=>{calls.push(input);assert.ok(answers.length,'unexpected model call');return{status:'completed',outputText:JSON.stringify(answers.shift())};}},'./client':{MetaApiError:class extends Error{}},'@/lib/prompts/spark/label':{labelPrompt:'fixture'},'@/lib/prompts/spark/label.schema.json':{default:{}},sharp:{default:sharp}};
 vm.runInNewContext(compiled,{exports,Buffer,Uint8Array,require:name=>{assert.ok(name in deps,name);return deps[name];}});
 const image=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).png().toBuffer();
 const result=await exports.readNutritionLabel(image,'image/png');
 assert.equal(calls.length,2);assert.deepEqual(calls.map(c=>c.reasoning.effort),['low','medium']);
 return JSON.parse(JSON.stringify(result));
}
for(const[key,value]of[['sodium_mg',100],['kcal',120],['fibre_g',4],['sugar_g',0]]){
 test(`cropped label keeps recovered ${key} without a higher macro count`,async()=>{
  const first=reading({...panel}),retry=reading({...panel,[key]:value});
  const result=await run(first,retry);
  assert.equal(result.per_serving[key],value);
  assert.equal(result.per_serving.protein_g,null);
  assert.equal(result.per_serving.carbs_g,10);assert.equal(result.per_serving.fat_g,2);
  assert.deepEqual(result.serving,first.serving);assert.equal(result.product_name,first.product_name);assert.deepEqual(result.box,first.box);
 });
}
test('recovered sodium survives fewer known retry macros without losing earlier values',async()=>{
 const first=reading({...panel,kcal:120,fibre_g:4,sugar_g:3});
 const result=await run(first,reading({...panel,carbs_g:null,fat_g:null,sodium_mg:100}));
 assert.deepEqual(result.per_serving,{...first.per_serving,sodium_mg:100});
});
