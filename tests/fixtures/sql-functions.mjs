import fs from 'node:fs';
import path from 'node:path';
const canonical=type=>type.trim().toLowerCase().replace(/\btimestamptz\b/g,'timestamp with time zone').replace(/^int$/,'integer').replace(/\s+/g,' ');
export function signature(name,args,parameterNames=true){return name+'('+args.split(',').map(arg=>{let s=arg.trim().replace(/\s+default\s+[\s\S]*$/i,'');if(parameterNames)s=s.replace(/^\w+\s+/,'');return canonical(s);}).filter(Boolean).join(',')+')';}
export function effectiveFunctions(dir,read=file=>fs.readFileSync(file,'utf8')) {
 const functions=new Map();
 for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.sql')).sort()) {
  const file=path.join(dir,name),text=read(file),events=[];
  const create=/^[ \t]*create(?:\s+or\s+replace)?\s+function\s+public\.(\w+)\s*\(([\s\S]*?)\)\s*returns\b[\s\S]*?\bas\s+(\$[a-z_]*\$)([\s\S]*?)\3\s*;/gim;
  for(const m of text.matchAll(create))events.push({at:m.index,type:'create',key:signature(m[1],m[2]),name:m[1],sql:m[0].trim(),body:m[4],file:name});
  for(const m of text.matchAll(/^[ \t]*drop\s+function(?:\s+if\s+exists)?\s+public\.(\w+)\(([^)]*)\)/gim))events.push({at:m.index,type:'drop',key:signature(m[1],m[2],false)});
  for(const m of text.matchAll(/^[ \t]*alter\s+function\s+public\.(\w+)\(([^)]*)\)\s+rename\s+to\s+(\w+)/gim))events.push({at:m.index,type:'rename',key:signature(m[1],m[2],false),next:signature(m[3],m[2],false),name:m[3]});
  for(const e of events.sort((a,b)=>a.at-b.at)){if(e.type==='create')functions.set(e.key,e);else if(e.type==='drop')functions.delete(e.key);else{const prev=functions.get(e.key);if(!prev)throw Error('Unresolved function rename '+e.key);functions.delete(e.key);functions.set(e.next,{...prev,key:e.next,name:e.name,sql:prev.sql.replace(/function\s+public\.\w+/i,'function public.'+e.name)});}}
 }
 return functions;
}
export function nutritionWriters(functions){return [...functions.values()].filter(row=>/\binsert\s+into\s+(?:public\.)?item_nutrition\b/i.test(row.body)).sort((a,b)=>a.key.localeCompare(b.key));}
