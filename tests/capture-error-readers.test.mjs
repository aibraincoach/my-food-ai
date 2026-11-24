// Evaluate each actual UI error writer with the real translator and exception.
// Exact English fixtures were read from main1efa5c5e before conversion; check
// both ordinary exceptions and structured failures through each actual writer.
import test from'node:test';import assert from'node:assert/strict';import ts from'typescript';import vm from'node:vm';import{readFileSync}from'node:fs';
import{captureEnglish}from'./fixtures/capture-wording.mjs';import{CaptureFailureError,captureFailureText}from'../src/lib/posts/capture-failure.ts';
const messages=JSON.parse(readFileSync(new URL('../messages/en.json',import.meta.url),'utf8')).capture;
function writer(source,structured){
 const ast=ts.createSourceFile('reader.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;
 function visit(n){
  if(expression)return;
  if(ts.isCallExpression(n)&&['setError','onError','setCopyError'].includes(n.expression.getText(ast))){
   function find(c){if(expression)return;if(ts.isConditionalExpression(c)&&c.condition.getText(ast).includes('instanceof '+(structured?'CaptureFailureError':'Error')))expression=c;else ts.forEachChild(c,find);}
   for(const arg of n.arguments)find(arg);
  }
  ts.forEachChild(n,visit);
 }visit(ast);assert.ok(expression,'consumer has an actual UI error writer');
 const parameter=expression.condition.left?.getText(ast);assert.match(parameter,/^\w+$/);
 const code=ts.transpileModule('const render=('+parameter+')=>('+expression.getText(ast)+');render;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 return vm.runInNewContext(code,{Error,CaptureFailureError,captureFailureText,tc:captureEnglish,tf:captureEnglish});
}
for(const [name,sentence]of[
 ['IntakeSheet','Sign in to keep this drink.'],
 ['FoodSearchPanel','Sign in to keep this food selection.'],
 ['SavedMealListeners','Sign in to keep this copy.'],
 ['LogAgainSheet','Sign-in changed. Your copy is kept for its original account.'],
])test(name+' shows the same English failure as base, never a code',()=>{
 const file='src/components/'+name+'.tsx',current=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const key=Object.entries(messages).find(([,value])=>value===sentence)?.[0];assert.ok(key,'exact English message exists');
 assert.equal(writer(current,true)(new Error(sentence)),sentence,'ordinary English exceptions retain the base display');
 const shown=writer(current,true)(new CaptureFailureError({code:key}));assert.equal(shown,sentence);assert.notEqual(shown,key);
});
