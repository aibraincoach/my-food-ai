import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
export function feedbackBatchModule(client,timer=setTimeout){
 const exports={};
 const code=ts.transpileModule(readFileSync(new URL('../../src/lib/client/feedback-batch.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,setTimeout:timer,require(name){if(name==='@/lib/supabase/client')return{createClient:()=>client};throw Error(name);}});
 return exports;
}
