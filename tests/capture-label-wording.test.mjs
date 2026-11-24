import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import vm from'node:vm';import ts from'typescript';import{createTranslator}from'next-intl';
const source=readFileSync(new URL('../src/components/CaptureSheet.tsx',import.meta.url),'utf8'),ast=ts.createSourceFile('CaptureSheet.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),functions=new Map();
function visit(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&['labelMacros','macros'].includes(n.name.text))functions.set(n.name.text,n.initializer.getText(ast));ts.forEachChild(n,visit);}visit(ast);
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
