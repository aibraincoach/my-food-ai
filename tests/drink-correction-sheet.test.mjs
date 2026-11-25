import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createTranslator} from 'next-intl';
import {photoDrinkProduct} from '../src/lib/intake/photo-drinks.ts';
const product=photoDrinkProduct({name:'Cola',ml:200,grams:210,caffeineMg:20,source:'read from the can',nutrition:{calories:80,protein_g:0,carbs_g:20,fat_g:0,fibre_g:0,sugar_g:20,sodium_mg:0,micronutrients:[],source_ref:'123',food_category:'Soft drinks'}});
function mount(locale){
 const messages=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url))),t=createTranslator({locale,messages,namespace:'postMenu'}),slots=[],exports={};let cursor=0;
 const jsx=(type,props)=>({type,props}),saved=[];
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/components/CorrectProductSheet.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,Number,Boolean,require(name){
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='react')return{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>{slots[i]=v;}];}};
  if(name==='next-intl')return{useTranslations:()=>t};
  if(name==='@/i18n/api-error-text')return{useApiFailureText:()=>()=>''};
  if(name==='@/components/ui/Button')return{Button:'Button'};
  if(name==='@/components/ui/Field')return{Field:'Field'};
  return new Proxy({},{get:(_,key)=>key==='__esModule'?true:key});
 }});
 const render=()=>{cursor=0;return exports.default({product,onClose(){},onSaved(){},onSave:async value=>saved.push(value)});};
 const nodes=n=>!n?[]:Array.isArray(n)?n.flatMap(nodes):typeof n==='object'?[n,...nodes(n.props?.children)]:[];
 return{nodes:()=>nodes(render()),saved,t};
}
for(const locale of ['en','ja'])test(locale+' sheet disables unchanged Save, starts caffeine empty, and sends an entered caffeine-only change',async()=>{
 const h=mount(locale);let nodes=h.nodes(),save=nodes.find(n=>n.type==='Button');assert.equal(save.props.disabled,true);
 const caffeine=nodes.find(n=>n.type==='Field'&&n.props['aria-label']===h.t('caffeineCorrectionField'));assert.ok(caffeine);assert.equal(caffeine.props.value,'');
 caffeine.props.onChange({target:{value:'75'}});nodes=h.nodes();save=nodes.find(n=>n.type==='Button');assert.equal(save.props.disabled,false);
 save.props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.saved.length,1);assert.equal(h.saved[0].caffeine_mg,75);
 assert.equal(nodes.some(n=>n.type==='option'&&n.props.value==='g'),false,'photo correction has only volume units');
});
