import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=ts.createSourceFile('PostActions.tsx',readFileSync(new URL('../src/components/PostActions.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const contract=source.statements.filter(node=>node.name&&['NoticeKey','emitSaveMealBlocked'].includes(node.name.text)).map(node=>node.getText(source)).join('\n');
const keys=['cannotSave','analysisFailed','answerFirst','analysisPending'];
function diagnostics(calls){
 const file='/virtual-save-meal-notice-contract.ts',code=contract+'\n'+calls;
 const options={noEmit:true,strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,skipLibCheck:true,types:[]};
 const host=ts.createCompilerHost(options),read=host.getSourceFile.bind(host);
 host.getSourceFile=(name,languageVersion,...args)=>name===file?ts.createSourceFile(name,code,languageVersion,true):read(name,languageVersion,...args);
 return ts.getPreEmitDiagnostics(ts.createProgram([file],options,host));
}
test('the actual notice producer accepts the four keys and rejects unsupported keys at compile time',()=>{
 assert.deepEqual(diagnostics(keys.map(key=>"emitSaveMealBlocked('post','"+key+"');").join('\n')).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),[]);
 const invalid=diagnostics("emitSaveMealBlocked('post','notAnApprovedKey');");
 assert.equal(invalid.length,1);assert.equal(invalid[0].code,2345);assert.match(ts.flattenDiagnosticMessageText(invalid[0].messageText,' '),/notAnApprovedKey/);
});
test('the actual typed producer keeps the existing event name and payload shape',()=>{
 const exports={},events=[];
 vm.runInNewContext(ts.transpileModule(contract,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,CustomEvent,window:{dispatchEvent:event=>events.push(event)}});
 for(const key of keys)exports.emitSaveMealBlocked('owned-post',key);
 assert.deepEqual(events.map(event=>({name:event.type,detail:JSON.parse(JSON.stringify(event.detail))})),keys.map(messageKey=>({name:'save-meal-blocked',detail:{postId:'owned-post',messageKey}})));
});
