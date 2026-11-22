import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import vm from'node:vm';
import ts from'typescript';
const valid={APP_URL:'http://127.0.0.1:3000',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',MFA_TEST_DISPOSABLE:'1',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-public',TEST_USER2_EMAIL:'two@example.invalid',TEST_USER2_PASSWORD:'synthetic-password'};
function harness({env=valid,status=200,fetchError,logoutError}={}){
 const calls={helper:0,sdk:0,fetch:[],logout:[],output:[]},exports={},cookie='synthetic-session=do-not-print',token='x.'+Buffer.from(JSON.stringify({sub:'deadbeef-0000-4000-8000-000000000001'})).toString('base64url')+'.x';
 const source=readFileSync(new URL('../scripts/agent-sign-in-check.mjs',import.meta.url),'utf8').split('// CLI entry')[0];
 const compiled=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 assert.deepEqual(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>d.code),[],'The real script must parse without transpiler recovery');
 const code=compiled.outputText;
 const context={exports,process:{env,argv:['node','check']},URL,Buffer,AbortSignal,console:{log:value=>calls.output.push(value)},fetch:async(input,init)=>{calls.fetch.push({input:String(input),init});if(fetchError)throw Error(fetchError);return new Response(null,{status});},require(name){
  if(name==='node:url')return{};
  if(name==='./lib/session.mjs')return{signInAsTestUser:async which=>{calls.helper++;assert.equal(which,2);return cookie;}};
  if(name==='@supabase/ssr')return{createServerClient(_url,_key,options){calls.sdk++;assert.equal(options.cookies.getAll()[0].value,'do-not-print');return{auth:{getSession:async()=>({data:{session:{access_token:token}},error:null}),signOut:async options=>{calls.logout.push(options.scope);return{error:logoutError};}}};}};
  throw Error('Unexpected import '+name);
 }};
 vm.runInNewContext(code,context);return{api:exports,calls,context};
}
for(const key of['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])for(const value of['https://example.invalid','http://localhost.example.invalid','file://localhost/tmp/a','http://user:secret@127.0.0.1'])test(`refuses ${key} outside plain loopback before Auth imports`,async()=>{
 const h=harness({env:{...valid,[key]:value}});await assert.rejects(h.api.runLocalAgentSignInCheck(),new RegExp(key));assert.equal(h.calls.helper,0);assert.equal(h.calls.sdk,0);assert.equal(h.calls.fetch.length,0);
});
test('one sign-in and one authenticated read; only status/prefix output; local sign-out',async()=>{
 const h=harness(),native=h.context.fetch,result=await h.api.runLocalAgentSignInCheck();assert.equal(result.status,200);assert.equal(result.idPrefix,'deadbeef');assert.equal(h.calls.helper,1);assert.equal(h.calls.fetch.length,1);assert.equal(h.calls.fetch[0].input,'http://127.0.0.1:3000/api/today');assert.equal(h.calls.fetch[0].init.redirect,'error');assert.deepEqual(h.calls.output,['200 deadbeef']);assert.deepEqual(h.calls.logout,['local']);assert.equal(h.context.fetch,native);
});
for(const failure of[{status:302},{status:401},{fetchError:'synthetic sensitive message'},{logoutError:{message:'synthetic sensitive message'}}])test('failed read or sign-out is non-success and prints no session',async()=>{
 const h=harness(failure);await assert.rejects(h.api.runLocalAgentSignInCheck());assert.deepEqual(h.calls.output,[]);assert.deepEqual(h.calls.logout,['local']);
});

test('refuses production option and non-disposable configuration before Auth imports',async()=>{
 const option=harness();option.context.process.argv.push('--production');await assert.rejects(option.api.runLocalAgentSignInCheck(),/no command-line options/);assert.equal(option.calls.helper,0);assert.equal(option.calls.sdk,0);
 const flag=harness({env:{...valid,MFA_TEST_DISPOSABLE:'0'}});await assert.rejects(flag.api.runLocalAgentSignInCheck(),/MFA_TEST_DISPOSABLE/);assert.equal(flag.calls.helper,0);assert.equal(flag.calls.sdk,0);
});
