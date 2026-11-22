import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function harness(answer){
 const calls={password:0,links:0,otp:0,admin:0,public:0};
 const user={id:'synthetic-user'},exports={};let cookieOptions;
 const client={auth:{
  async signInWithPassword(){calls.password++;if(!answer.error)cookieOptions?.cookies.setAll([{name:'test-session',value:'synthetic-cookie'}]);return answer;},
  async verifyOtp(){calls.otp++;return{data:{user},error:null};},
  admin:{async generateLink(){calls.links++;return{data:{properties:{hashed_token:'synthetic-hash'}},error:null};}},
 }};
 const code=ts.transpileModule(readFileSync(new URL('../scripts/lib/session.mjs',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'http://localhost',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SECRET_KEY:'admin-fixture',TEST_USER_EMAIL:'one@example.invalid',TEST_USER_PASSWORD:'synthetic',TEST_USER2_EMAIL:'two@example.invalid',TEST_USER2_PASSWORD:'synthetic'}},fetch:()=>{throw Error('No network allowed');},require(name){
  if(name==='@supabase/ssr')return{createServerClient(_url,_key,options){calls.public++;cookieOptions=options;return client;}};
  if(name==='@supabase/supabase-js')return{createClient(_url,key){calls[key==='admin-fixture'?'admin':'public']++;return client;}};
  throw Error('Unexpected dependency '+name);
 }});
 return{api:exports,calls,user};
}
for(const helper of ['signInTestClient','signInAsTestUser']){
 for(const error of[{code:'captcha_failed',message:'Challenge required'},{code:'other',message:'CAPTCHA required'}])test(`${helper}: CAPTCHA fails after one password attempt with no magic link`,async()=>{
  const {api,calls}=harness({data:{user:null},error});
  await assert.rejects(api[helper](2),/Test account 2 sign-in failed:.*CAPTCHA/);
  assert.deepEqual(calls,{password:1,links:0,otp:0,admin:0,public:1});
 });
 test(`${helper}: ordinary errors fail without another route`,async()=>{
  const {api,calls}=harness({data:{user:null},error:{code:'invalid_credentials',message:'Invalid credentials'}});
  await assert.rejects(api[helper](1),/Test account 1 sign-in failed/);
  assert.deepEqual(calls,{password:1,links:0,otp:0,admin:0,public:1});
 });
 test(`${helper}: success uses the password result`,async()=>{
  const user={id:'synthetic-user'},h=harness({data:{user},error:null});
  const result=await h.api[helper](1);
  if(helper==='signInTestClient')assert.equal(result.user,user);else assert.equal(result,'test-session=synthetic-cookie');
  assert.deepEqual(h.calls,{password:1,links:0,otp:0,admin:0,public:1});
 });
 test(`${helper}: invalid account never authenticates`,async()=>{
  const {api,calls}=harness({data:{user:{id:'unused'}},error:null});
  await assert.rejects(api[helper](3),/Test account must be 1 or 2/);
  assert.equal(calls.password,0);assert.equal(calls.links,0);assert.equal(calls.otp,0);assert.equal(calls.admin,0);
 });
}
