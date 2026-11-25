import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const project=fileURLToPath(new URL('..',import.meta.url));
const visit=(node,fn)=>{fn(node);ts.forEachChild(node,child=>visit(child,fn));};
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]);}
export function auditClientDictionaries(root=project,{overrides={}}={}){
 const modules=new Map(),failures=[];
 const relative=file=>path.relative(root,file).split(path.sep).join('/');
 function read(file){
  if(modules.has(file))return modules.get(file);
  const source=overrides[relative(file)]??fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const directives=sf.statements.filter(ts.isExpressionStatement).filter(s=>ts.isStringLiteral(s.expression)).map(s=>s.expression.text);
  const dependencies=[];
  visit(sf,node=>{
   if(ts.isImportDeclaration(node)){
    const clause=node.importClause;
    if(clause?.isTypeOnly)return;
    if(clause&&!clause.name&&clause.namedBindings&&ts.isNamedImports(clause.namedBindings)&&clause.namedBindings.elements.every(e=>e.isTypeOnly))return;
    dependencies.push(node.moduleSpecifier.text);
   }else if(ts.isExportDeclaration(node)&&node.moduleSpecifier&&!node.isTypeOnly){
    if(node.exportClause&&ts.isNamedExports(node.exportClause)&&node.exportClause.elements.every(e=>e.isTypeOnly))return;
    dependencies.push(node.moduleSpecifier.text);
   }else if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require')&&node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0]))dependencies.push(node.arguments[0].text);
  });
  const result={directives,dependencies};modules.set(file,result);return result;
 }
 function resolve(from,name){
  const base=name.startsWith('@/')?path.join(root,'src',name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(from),name):null;
  if(!base)return null;
  const candidates=[base,...['.ts','.tsx','.js','.mjs','.json'].map(ext=>base+ext),...['.ts','.tsx','.js'].map(ext=>path.join(base,'index'+ext))];
  return candidates.find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
 }
 const sources=files(path.join(root,'src')).filter(file=>/\.[cm]?[jt]sx?$/.test(file)&&!file.endsWith('.d.ts'));
 const roots=sources.filter(file=>read(file).directives.includes('use client'));
 for(const entry of roots){
  const seen=new Set();
  function walk(file,chain){
   if(seen.has(file))return;seen.add(file);
   const name=relative(file),route=[...chain,name];
   if(/^messages\/.*\.json$/.test(name)||/^src\/i18n\/(card|nutrition|nutrients)\.ts$/.test(name)){failures.push({entry:relative(entry),chain:route});return;}
   if(!/\.[cm]?[jt]sx?$/.test(file))return;
   const mod=read(file);if(mod.directives.includes('use server'))return;
   for(const dependency of mod.dependencies){
    if(dependency==='server-only'){failures.push({entry:relative(entry),chain:[...route,'server-only']});continue;}
    const target=resolve(file,dependency);
    if(target)walk(target,route);
    else if(dependency.startsWith('.')||dependency.startsWith('@/'))throw Error('Unresolved browser import: '+name+' -> '+dependency);
   }
  }
  walk(entry,[]);
 }
 return {roots:roots.length,failures};
}
export function checkClientDictionaries(){
 const result=auditClientDictionaries();
 if(result.failures.length)throw Error('Browser dictionary imports: '+JSON.stringify(result.failures));
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(checkClientDictionaries()));
