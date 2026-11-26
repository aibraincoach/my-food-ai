import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const root=new URL('../../',import.meta.url);
function files(dir){return fs.readdirSync(new URL(dir+'/',root),{recursive:true}).map(file=>dir+'/'+file).filter(file=>fs.statSync(new URL(file,root)).isFile()).sort();}
const isRef=name=>name==='source_ref'||name==='sourceRef';
export function sourceWriterInventory(){
 const assignments=[];
 for(const file of files('src').filter(file=>/\.tsx?$/.test(file))){
  const source=fs.readFileSync(new URL(file,root),'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const add=(kind,node)=>assignments.push({file,kind,expression:node.getText(ast).replace(/\s+/g,' ')});
  function visit(node){
   if(ts.isPropertyAssignment(node)&&isRef(node.name.getText(ast).replaceAll(/['"]/g,'')))add('property',node.initializer);
   if(ts.isShorthandPropertyAssignment(node)&&isRef(node.name.text))add('shorthand',node.name);
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&isRef(node.name.text)&&node.initializer)add('variable',node.initializer);
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken){
    const left=node.left;
    if((ts.isPropertyAccessExpression(left)&&isRef(left.name.text))||(ts.isElementAccessExpression(left)&&isRef(left.argumentExpression?.getText(ast).replaceAll(/['"]/g,''))))add('assignment',node.right);
   }
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 const sql=[];
 for(const file of [...files('supabase/migrations'),...files('scripts')].filter(file=>path.extname(file)==='.sql')){
  const lines=fs.readFileSync(new URL(file,root),'utf8').split('\n').filter(line=>/\bsource_ref\b/.test(line)).map(line=>line.trim());
  if(lines.length)sql.push({file,sourceRefLines:lines.length,sha256:createHash('sha256').update(lines.join('\n')).digest('hex')});
 }
 return {assignments,sql};
}
