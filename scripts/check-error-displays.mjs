import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
// Syntax/dataflow guard for UI error sinks. Only a dictionary-rendered DisplayError
// may expose .message; ordinary exceptions and response error fields are untrusted.
export function checkErrorDisplays(source,filename='fixture.tsx'){
 const file=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),bindings=new Map(),failures=[];
 function collect(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer){const list=bindings.get(n.name.text)??[];list.push(n.initializer);bindings.set(n.name.text,list);}ts.forEachChild(n,collect);}collect(file);
 const text=n=>n.getText(file);
 function unsafe(n,allowed=new Set(),seen=new Set()){
  if(ts.isConditionalExpression(n)){
   const match=text(n.condition).match(/^(\w+) instanceof DisplayError$/);
   return unsafe(n.condition,allowed,seen)||unsafe(n.whenTrue,new Set([...allowed,...(match?[match[1]]:[])]),seen)||unsafe(n.whenFalse,allowed,seen);
  }
  if(ts.isCallExpression(n)&&['captureFailureText','displayErrorText','apiError'].includes(text(n.expression)))return false;
  if(ts.isPropertyAccessExpression(n)&&['message','error','message_code'].includes(n.name.text))return !(n.name.text==='message'&&allowed.has(text(n.expression)));
  if(ts.isElementAccessExpression(n)&&n.argumentExpression&&ts.isStringLiteral(n.argumentExpression)&&['message','error','message_code'].includes(n.argumentExpression.text))return true;
  if(ts.isIdentifier(n)&&bindings.has(n.text)&&!seen.has(n.text)){const next=new Set([...seen,n.text]);return bindings.get(n.text).some(value=>unsafe(value,allowed,next));}
  let found=false;ts.forEachChild(n,child=>{if(unsafe(child,allowed,seen))found=true;});return found;
 }
 function visit(n){
  if(ts.isCallExpression(n)&&/^(?:set\w*Error|setError|setToast|toast|alert|onError)$/.test(text(n.expression).split('.').at(-1))&&n.arguments[0]&&unsafe(n.arguments[0])){
   failures.push({line:file.getLineAndCharacterOfPosition(n.getStart(file)).line+1,kind:'untranslated error sink'});
  }
  if(ts.isNewExpression(n)&&text(n.expression)==='DisplayError'){
   const arg=n.arguments?.[0];
   if(!arg||!ts.isCallExpression(arg)||!['t','tc','tp','tf','apiError'].includes(text(arg.expression)))failures.push({line:file.getLineAndCharacterOfPosition(n.getStart(file)).line+1,kind:'DisplayError must come from a dictionary lookup'});
  }
  ts.forEachChild(n,visit);
 }visit(file);return failures;
}
export function checkAllErrorDisplays(root='src'){
 const failures=[];let files=0;
 function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=path.join(dir,entry.name);if(entry.isDirectory())walk(name);else if(/\.tsx$/.test(name)){files++;for(const failure of checkErrorDisplays(fs.readFileSync(name,'utf8'),name))failures.push({file:name,...failure});}}}
 walk(root);return{files,failures};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=checkAllErrorDisplays();console.log(JSON.stringify(result,null,2));if(result.failures.length)process.exitCode=1;
}
