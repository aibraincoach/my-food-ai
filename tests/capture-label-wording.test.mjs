import {formatNumber} from '../src/i18n/format.ts';
import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import vm from'node:vm';import ts from'typescript';import{createTranslator}from'next-intl';
const source=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8'),ast=ts.createSourceFile('CaptureSheet.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),functions=new Map();
function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&['labelMacros','macros','labelNumber'].includes(n.name.text))functions.set(n.name.text,n.initializer.getText(ast));ts.forEachChild(n,visit);}visit(ast);
for(const locale of['en','ja'])test(locale+' label and barcode summaries use the shared whole sentence',()=>{
 const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8')),t=createTranslator({locale,messages,namespace:'capture',onError(e){throw e;}});
 const values={kcal:'230',calories:'230',protein_g:'3',carbs_g:'37',fat_g:'8'},context={t,labelServings:1,labelNumber:key=>values[key],value:key=>values[key]};
 for(const name of['labelMacros','macros']){
  const code=ts.transpileModule('const render='+functions.get(name)+';render;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,render=vm.runInNewContext(code,{...context});
  assert.equal(render(1),locale==='en'?'230 kcal · 3 g protein · 37 g carbs · 8 g fat':'230 kcal · たんぱく質 3 g · 炭水化物 37 g · 脂質 8 g');
 }
 assert.equal(t('per100Label',{unit:'g'}),locale==='en'?'Per 100 g':'100 gあたり');
 assert.equal(t('servingAmount',{count:1}),locale==='en'?'1 serving':'1食分');
 assert.equal(t('servingAmount',{count:2}),locale==='en'?'2 servings':'2食分');
 assert.equal(t('nowWithChevron'),locale==='en'?'Now ›':'現在 ›');
});

for(const locale of ['en','ja'])test(locale+' actual label number uses viewer locale with unchanged precision',()=>{
 const calls=[],labelReading={reading:{per_serving:{kcal:1234.567,protein_g:0.001,carbs_g:0,fat_g:null}}};
 const code=ts.transpileModule('const render='+functions.get('labelNumber')+';render;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const render=vm.runInNewContext(code,{locale,labelReading,labelServings:2,formatNumber:(...args)=>{calls.push(args);return formatNumber(...args);}});
 assert.equal(render('kcal'),'2,469.13');assert.equal(render('kcal',1),'1,234.57');assert.equal(render('protein_g'),'0');assert.equal(render('carbs_g'),'0');assert.equal(render('fat_g'),'—');assert.equal(render('sugar_g'),'—');
 assert.equal(calls.length,4);assert.ok(calls.every(args=>args[0]===locale));
});
