import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
function resolve(root,from,name){
 const base=name.startsWith('@/')?path.join(root,'src',name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(from),name):null;
 return base&&[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
}
function walk(node,visit){visit(node);ts.forEachChild(node,child=>walk(child,visit));}
export function checkCaptureNamespaces(root=project,entrypoints,provided){
 if(!provided){
  const sf=ts.createSourceFile('scope.ts',fs.readFileSync(path.join(root,'src/i18n/capture-scope.ts'),'utf8'),ts.ScriptTarget.Latest,true);
  walk(sf,n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='CAPTURE_NAMESPACES')provided=[...n.initializer.expression.elements].map(x=>x.text);});
 }
 if(!entrypoints){
  entrypoints=['src/app/(tabs)/layout.tsx','src/app/posts/[id]/page.tsx','src/app/shell/page.tsx'];
  const pages=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())pages(p);else if(e.name==='page.tsx')entrypoints.push(path.relative(root,p));}};
  pages(path.join(root,'src/app/(tabs)'));
 }
 const todo=entrypoints.map(p=>path.resolve(root,p)),sources=new Map(),nested=new Map();
 while(todo.length){
  const file=todo.pop();if(sources.has(file))continue;
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);sources.set(file,sf);
  const imports=new Map();
  walk(sf,node=>{
   if(ts.isImportDeclaration(node)&&!node.importClause?.isTypeOnly){
    const target=resolve(root,file,node.moduleSpecifier.text);if(target){todo.push(target);if(node.importClause?.name)imports.set(node.importClause.name.text,target);}
   }
   if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0])){const p=resolve(root,file,node.arguments[0].text);if(p)todo.push(p);}
  });
  // A more local explicit provider owns its direct child components.
  walk(sf,node=>{
   if(!ts.isJsxElement(node)||node.openingElement.tagName.getText(sf)!=='StrictIntlProvider')return;
   const prop=node.openingElement.attributes.properties.find(p=>p.name?.getText(sf)==='messages');
   const value=prop?.initializer?.expression;if(!value||!ts.isObjectLiteralExpression(value))return;
   const namespaces=value.properties.map(p=>p.name?.getText(sf).replace(/['"]/g,''));
   for(const child of node.children){const tag=ts.isJsxSelfClosingElement(child)?child.tagName:ts.isJsxElement(child)?child.openingElement.tagName:null;const target=tag&&imports.get(tag.getText(sf));if(target)nested.set(target,namespaces);}
  });
 }
 for(const [file,sf]of sources)walk(sf,node=>{
  if(!ts.isCallExpression(node)||node.expression.getText(sf)!=='useTranslations')return;
  const argument=node.arguments[0];if(!argument||!ts.isStringLiteral(argument))throw Error('Use an explicit namespace: '+path.relative(root,file));
  const namespace=argument.text.split('.')[0],scope=nested.get(file)??provided;
  if(!scope.includes(namespace))throw Error('Missing capture-provider namespace '+namespace+' for '+path.relative(root,file));
 });
 return {files:sources.size,namespaces:provided};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=checkCaptureNamespaces();console.log('Capture namespaces checked in '+result.files+' source files.');
}
