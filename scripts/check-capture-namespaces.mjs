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
// Root siblings sit outside the route provider. Follow their rendered component
// graph under each explicit provider rather than assuming route scope applies.
export function checkRootSiblingNamespaces(root=project,sourceOverride){
 const seen=new Set(),rootFile=path.join(root,'src/app/layout.tsx');
 function visitFile(file,scope,override){
  const identity=file+'|'+scope.join(',');if(seen.has(identity))return;seen.add(identity);
  const sf=ts.createSourceFile(file,override??fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),imports=new Map();
  walk(sf,node=>{if(ts.isImportDeclaration(node)&&!node.importClause?.isTypeOnly){const target=resolve(root,file,node.moduleSpecifier.text);if(target){if(node.importClause?.name)imports.set(node.importClause.name.text,target);const named=node.importClause?.namedBindings;if(named&&ts.isNamedImports(named))for(const member of named.elements)if(!member.isTypeOnly)imports.set(member.name.text,target);}}});
  walk(sf,node=>{
   if(!ts.isCallExpression(node)||node.expression.getText(sf)!=='useTranslations')return;
   const argument=node.arguments[0];if(!argument||!ts.isStringLiteral(argument))throw Error('Use an explicit root namespace: '+path.relative(root,file));
   const namespace=argument.text.split('.')[0];if(!scope.includes(namespace))throw Error('Missing root-provider namespace '+namespace+' for '+path.relative(root,file));
  });
  const component=(tag,current)=>{const target=imports.get(tag.getText(sf));if(target)visitFile(target,current);};
  function visit(node,current){
   if(ts.isJsxElement(node)){
    const opening=node.openingElement;
    if(opening.tagName.getText(sf)==='StrictIntlProvider'){
     const prop=opening.attributes.properties.find(value=>value.name?.getText(sf)==='messages'),value=prop?.initializer?.expression;
     if(!value||!ts.isObjectLiteralExpression(value))throw Error('Root provider requires explicit namespace keys');
     const next=value.properties.map(property=>property.name?.getText(sf).replace(/['"]/g,''));
     for(const child of node.children)visit(child,next);return;
    }
    component(opening.tagName,current);
   }else if(ts.isJsxSelfClosingElement(node))component(node.tagName,current);
   ts.forEachChild(node,child=>visit(child,current));
  }
  visit(sf,scope);
 }
 visitFile(rootFile,[],sourceOverride);return{files:seen.size};
}
export function checkCaptureNamespaces(root=project,entrypoints,provided){
 checkRootSiblingNamespaces(root);
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
