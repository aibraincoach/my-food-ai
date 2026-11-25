import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

// Inspect syntax, so comments and unrelated method names do not look like formats.
export function inspectLocaleFormats(source, file) {
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
 const failures=[],allowed=[];
 const report=(node,reason)=>({file,line:tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1,reason});
 function visit(node){
  if(file.replaceAll('\\','/')==='src/i18n/format.ts')return;
  if(ts.isStringLiteralLike(node)&&node.text==='en-US')failures.push(report(node,'Fixed en-US locale outside the formatting boundary'));
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&/^toLocale(?:Date|Time)?String$/.test(node.expression.name.text)&&node.arguments.length===0)failures.push(report(node,'Locale argument is required'));
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text==='locale'&&node.initializer&&ts.isStringLiteralLike(node.initializer)&&node.initializer.text==='en'){
   const line=tree.getLineAndCharacterOfPosition(node.getStart(tree)).line;
   const context=source.split('\n').slice(Math.max(0,line-1),line+1).join('\n');
   if(!context.includes('#1219'))failures.push(report(node,'Explicit English writer requires its #1219 boundary comment'));
   else allowed.push({...report(node,'Explicit English boundary (#1219)'),source:context.trim()});
  }
  ts.forEachChild(node,visit);
 }
 visit(tree);return {failures,allowed};
}
export function checkLocaleFormats(root=process.cwd()){
 const failures=[],allowed=[];
 function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);
  else if(/\.[cm]?[jt]sx?$/.test(entry.name)){const result=inspectLocaleFormats(fs.readFileSync(file,'utf8'),path.relative(root,file));failures.push(...result.failures);allowed.push(...result.allowed);}
 }}
 walk(path.join(root,'src'));return {failures,allowed};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=checkLocaleFormats();console.log(JSON.stringify(result,null,2));if(result.failures.length)process.exitCode=1;
}
