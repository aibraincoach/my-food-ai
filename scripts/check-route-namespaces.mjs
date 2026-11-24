// Audit actual render paths, including routes not yet converted to messages.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const project=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const walk=(node,visit)=>{visit(node);ts.forEachChild(node,child=>walk(child,visit));};
const unwrap=node=>ts.isAsExpression(node)||ts.isParenthesizedExpression(node)||ts.isNonNullExpression(node)?unwrap(node.expression):node;
function resolve(root,from,name){
 const base=name.startsWith('@/')?path.join(root,'src',name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(from),name):null;
 return base&&[base,base+'.tsx',base+'.ts',path.join(base,'index.tsx'),path.join(base,'index.ts')].find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
}
export function auditRouteNamespaces(root=project,{overrides={}}={}){
 const app=path.join(root,'src/app'),dictionary=JSON.parse(fs.readFileSync(path.join(root,'messages/en.json'),'utf8'));
 const requestNamespaces=Object.keys(dictionary),modules=new Map(),issues=new Map(),visited=new Set(),active=new Set();
 function module(file){
  if(modules.has(file))return modules.get(file);
  const source=overrides[path.relative(root,file)]??fs.readFileSync(file,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const mod={file,sf,imports:new Map(),functions:new Map(),arrays:new Map(),client:false,server:false,defaultFn:null};modules.set(file,mod);
  for(const statement of sf.statements){
   if(ts.isExpressionStatement(statement)&&ts.isStringLiteral(statement.expression)){mod.client||=statement.expression.text==='use client';mod.server||=statement.expression.text==='use server';}
   if(ts.isImportDeclaration(statement)&&!statement.importClause?.isTypeOnly){
    const name=statement.moduleSpecifier.text,target=resolve(root,file,name),clause=statement.importClause;
    if(clause?.name)mod.imports.set(clause.name.text,{file:target,name:'default',external:name});
    if(clause?.namedBindings&&ts.isNamedImports(clause.namedBindings))for(const member of clause.namedBindings.elements)if(!member.isTypeOnly)mod.imports.set(member.name.text,{file:target,name:member.propertyName?.text??member.name.text,external:name});
   }
  }
  walk(sf,node=>{
   if(ts.isFunctionDeclaration(node)&&node.body){if(node.name)mod.functions.set(node.name.text,node);if(node.modifiers?.some(x=>x.kind===ts.SyntaxKind.DefaultKeyword))mod.defaultFn=node;}
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){
    const value=unwrap(node.initializer);
    if(ts.isArrowFunction(value)||ts.isFunctionExpression(value))mod.functions.set(node.name.text,value);
    if(ts.isArrayLiteralExpression(value)&&value.elements.every(ts.isStringLiteral))mod.arrays.set(node.name.text,value.elements.map(x=>x.text));
   }
   if(ts.isExportAssignment(node)&&ts.isIdentifier(node.expression))mod.defaultName=node.expression.text;
  });
  mod.defaultFn??=mod.functions.get(mod.defaultName);
  return mod;
 }
 function target(mod,name){
  const imported=mod.imports.get(name);if(imported?.file){const other=module(imported.file);return{mod:other,fn:imported.name==='default'?other.defaultFn:other.functions.get(imported.name)};}
  return{mod,fn:mod.functions.get(name)};
 }
 function providerNames(mod,expression){
  if(!expression)throw Error('Provider has no message expression: '+path.relative(root,mod.file));
  const value=unwrap(expression);
  if(ts.isObjectLiteralExpression(value))return value.properties.map(p=>{
   if(ts.isSpreadAssignment(p))throw Error('Provider message spread needs explicit namespace keys: '+path.relative(root,mod.file));
   return p.name.text??p.name.getText(mod.sf);
  });
  if(ts.isCallExpression(value)&&ts.isIdentifier(value.expression)){
   const found=target(mod,value.expression.text),names=new Set();
   if(found.fn)walk(found.fn,node=>{if(ts.isIdentifier(node)&&found.mod.arrays.has(node.text))for(const name of found.mod.arrays.get(node.text))names.add(name);});
   if(names.size)return[...names];
  }
  throw Error('Cannot derive provider messages: '+path.relative(root,mod.file)+' '+value.getText(mod.sf));
 }
 function checkCalls(mod,fn,scope,client,chain,entry){
  walk(fn.body,node=>{
   if(!ts.isCallExpression(node)||!ts.isIdentifier(node.expression))return;
   const imported=mod.imports.get(node.expression.text);
   if(!imported||!['next-intl','next-intl/server'].includes(imported.external)||!['useTranslations','getTranslations'].includes(imported.name))return;
   const arg=node.arguments[0];let namespace;
   if(arg&&ts.isStringLiteral(arg))namespace=arg.text.split('.')[0];
   else if(arg&&ts.isObjectLiteralExpression(arg)){const prop=arg.properties.find(p=>p.name?.getText(mod.sf)==='namespace');if(prop&&ts.isPropertyAssignment(prop)&&ts.isStringLiteral(prop.initializer))namespace=prop.initializer.text.split('.')[0];}
   if(!namespace)throw Error('Use an explicit auditable namespace: '+path.relative(root,mod.file));
   // A server component (including a server action) reads request messages.
   // A shared component imported from a client boundary reads client context.
   const supplied=client?scope:requestNamespaces;
   if(!supplied.includes(namespace)){
    const item={entry,route:routeName(entry),namespace,consumer:path.relative(root,mod.file),boundary:client?'client':'server-request',supplied:[...supplied],chain:[...chain]};
    issues.set([entry,item.consumer,namespace,item.boundary].join('|'),item);
   }
  });
 }
 function render(mod,fn,scope,inheritedClient,slots,chain,entry){
  if(!fn?.body)return;
  const client=mod.server?false:inheritedClient||mod.client;
  const key=[mod.file,fn.pos,client,...scope].join('|');if(active.has(key))return;active.add(key);visited.add(mod.file);
  const aliases=new Map(),paramNames=new Set();
  for(const parameter of fn.parameters){if(ts.isObjectBindingPattern(parameter.name))for(const member of parameter.name.elements){if(ts.isIdentifier(member.name))aliases.set(member.name.text,member.propertyName?.text??member.name.text);}else if(ts.isIdentifier(parameter.name))paramNames.add(parameter.name.text);}
  checkCalls(mod,fn,scope,client,chain,entry);
  function visit(node,current=scope){
   if(ts.isIdentifier(node)&&aliases.has(node.text)&&slots[aliases.get(node.text)]){slots[aliases.get(node.text)](current);return;}
   if(ts.isPropertyAccessExpression(node)&&ts.isIdentifier(node.expression)&&paramNames.has(node.expression.text)&&slots[node.name.text]){slots[node.name.text](current);return;}
   if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)){
    const opening=ts.isJsxElement(node)?node.openingElement:node,tag=opening.tagName.getText(mod.sf),imported=mod.imports.get(tag);
    const provider=tag==='StrictIntlProvider'||(imported?.file&&path.relative(root,imported.file)==='src/components/i18n/StrictIntlProvider.tsx')||(imported?.external==='next-intl'&&imported.name==='NextIntlClientProvider');
    if(provider){
     const property=opening.attributes.properties.find(p=>p.name?.getText(mod.sf)==='messages'),next=providerNames(mod,property?.initializer?.expression);
     for(const child of ts.isJsxElement(node)?node.children:[])visit(child,next);
     return;
    }
    const children=ts.isJsxElement(node)?node.children:[],childSlots={children:next=>{for(const child of children)visit(child,next);}};
    for(const prop of opening.attributes.properties)if(ts.isJsxAttribute(prop)&&prop.initializer&&ts.isJsxExpression(prop.initializer)&&prop.initializer.expression){const value=prop.initializer.expression;childSlots[prop.name.text]=next=>visit(value,next);}
    const found=target(mod,tag);
    if(found.fn){render(found.mod,found.fn,current,client,childSlots,[...chain,path.relative(root,found.mod.file)+':'+tag],entry);}
    else{for(const child of children)visit(child,current);for(const [name,slot]of Object.entries(childSlots))if(name!=='children')slot(current);}
    return;
   }
   if(ts.isCallExpression(node)){
    if(ts.isIdentifier(node.expression)){
     const found=target(mod,node.expression.text);
     if(found.fn)render(found.mod,found.fn,current,client,{},[...chain,path.relative(root,found.mod.file)+':'+node.expression.text],entry);
    }else if(node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0])){
     const file=resolve(root,mod.file,node.arguments[0].text);if(file){const found=module(file);render(found,found.defaultFn,current,client,{},[...chain,path.relative(root,file)+':dynamic'],entry);}
    }
   }
   // Definitions execute when called; callbacks may render JSX and inherit scope.
   if(ts.isFunctionDeclaration(node))return;
   ts.forEachChild(node,child=>visit(child,current));
  }
  try{visit(fn.body);}finally{active.delete(key);}
 }
 function routeName(file){file=path.isAbsolute(file)?file:path.join(root,file);return'/'+path.relative(app,path.dirname(file)).split(path.sep).filter(p=>p&&!/^\(.+\)$/.test(p)).join('/');}
 const entries=[];function scan(dir){for(const value of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,value.name);if(value.isDirectory())scan(file);else if(/^(layout|page)\.tsx$/.test(value.name))entries.push(file);}}scan(app);
 for(const entry of entries){
  const dirs=[];for(let dir=path.dirname(entry);dir.startsWith(app);dir=path.dirname(dir)){dirs.unshift(dir);if(dir===app)break;}
  const layouts=dirs.map(dir=>path.join(dir,'layout.tsx')).filter(file=>fs.existsSync(file)&&file!==entry),sequence=[...layouts,entry];
  const next=(index,scope)=>{
   const mod=module(sequence[index]);
   // Layout/page server exports are separate RSC origins. A provider changes
   // their client descendants' context, never their request dictionary.
   render(mod,mod.defaultFn,scope,false,{children:childScope=>{if(index+1<sequence.length)next(index+1,childScope);}},[routeName(entry),...sequence.slice(0,index+1).map(file=>path.relative(root,file))],path.relative(root,entry));
   for(const name of ['generateMetadata','generateViewport']){const fn=mod.functions.get(name);if(fn)checkCalls(mod,fn,scope,false,[routeName(entry),path.relative(root,mod.file)+':'+name],path.relative(root,entry));}
  };
  next(0,[]);
 }
 return{entries:entries.map(file=>path.relative(root,file)),files:visited.size,issues:[...issues.values()]};
}
export function checkRouteNamespaces(root=project){
 const result=auditRouteNamespaces(root);
 if(result.issues.length)throw Error(result.issues.map(row=>`${row.route}: missing ${row.namespace} (${row.boundary}), ${row.chain.join(' -> ')} -> ${row.consumer}`).join('\n'));
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditRouteNamespaces();
 if(result.issues.length){for(const row of result.issues)console.error(`${row.route}: missing ${row.namespace} (${row.boundary}), ${row.chain.join(' -> ')} -> ${row.consumer}`);process.exitCode=1;}
 else console.log(`All ${result.entries.length} route/layout entries have their message namespaces (${result.files} source files).`);
}
