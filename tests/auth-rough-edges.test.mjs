import {authRedirectOrigin} from '../src/lib/auth/redirect-origin.ts';
import {pendingHandle} from '../src/lib/auth/pending-handle.ts';
import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import ts from'typescript';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function actions(error=null,profileError=null){const exports={},removed=[],logs=[],deps={'@/lib/auth/redirect-origin':{authRedirectOrigin},'@/lib/auth/pending-handle':{pendingHandle},'next/headers':{headers:async()=>({get:()=> 'https://app.invalid'})},'next-intl':englishIntl,'next-intl/server':englishIntlServer,
 'next/navigation':{redirect:url=>{throw Object.assign(Error('redirect'),{url})}},
 '@/lib/supabase/server':{createClient:async()=>({auth:{signUp:async()=>({data:{user:error?null:{id:'new-user'}},error}),signInWithPassword:async()=>({error}),getUser:async()=>({data:{user:null}})}})},
 '@/lib/supabase/admin':{createAdminClient:()=>({from:()=>({insert:async()=>({error:profileError})}),auth:{admin:{deleteUser:async id=>{removed.push(id);return{error:null}}}}})},
 '@/lib/auth/end-session':{endCurrentSession:async()=>{}}
};vm.runInNewContext(ts.transpileModule(read('src/lib/auth/actions.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in deps,n);return deps[n]},console:{error:(...args)=>logs.push(args)},FormData});return{exports,removed,logs};}
const form=()=>{const f=new FormData();f.set('email','person@example.com');f.set('handle','taken');f.set('password','PRIVATE password');return f;};
test('sign-up errors return only safe retained fields, neutral messages and no redirect/password',async()=>{
 for(const [error,message] of [[{code:'weak_password',message:'SECRET'},"Choose a stronger password, then try again."],[{code:'email_address_invalid',message:'SECRET'},"Enter a valid email address."],[{code:'over_email_send_rate_limit',message:'SECRET'},"Too many requests. Wait a moment, then try again."],[{code:'user_already_exists',message:'Account exists SECRET'},"We couldn't finish creating your account. Try again."],[{code:'unexpected',message:'SECRET'},"We couldn't finish creating your account. Try again."]]){
  const h=actions(error),result=await h.exports.signUp({},form());assert.deepEqual(JSON.parse(JSON.stringify(result)),{email:'person@example.com',handle:'taken',error:message});assert.doesNotMatch(JSON.stringify(result)+JSON.stringify(h.logs),/PRIVATE|SECRET|Account exists/);
 }
});
test('a signup without a session keeps Auth and returns neutral next steps',async()=>{const h=actions(null,{code:'23505',message:'PRIVATE'});const result=await h.exports.signUp({},form());assert.equal(result.error,"If you received a confirmation email, confirm your account, then sign in. Otherwise, sign in.");assert.deepEqual(h.removed,[]);assert.ok(!('password'in result));});
test('sign-in distinguishes confirmation and rate limit but never leaks unknown service text',async()=>{
 for(const [error,message]of [[{code:'email_not_confirmed',message:'SECRET'},"Confirm your email address before you sign in."],[{code:'over_request_rate_limit',message:'SECRET'},"Too many attempts. Wait a moment, then try again."],[{status:429,message:'SECRET'},"Too many attempts. Wait a moment, then try again."],[{code:'other',message:'SECRET'},'Sign-in could not be completed. Try again.']])await assert.rejects(actions(error).exports.signIn(form()),e=>new URL(e.url,'https://app.invalid').searchParams.get('error')===message);
});
test('sign-out lands on Welcome; explicit email/error routes stay email routes',async()=>{await assert.rejects(actions().exports.signOut(),e=>e.url==='/welcome');const s=read('src/lib/auth/actions.ts');assert.match(s,/fail\("\/sign-in"/);assert.match(read('src/app/(auth)/welcome/page.tsx'),/href="\/sign-in"/);});
test('signup has one stateful submission and no query error or secret persistence path',()=>{
 const page=read('src/app/(auth)/sign-up/page.tsx'),form=read('src/app/(auth)/_components/SignUpForm.tsx');assert.doesNotMatch(page,/searchParams|error\?/);assert.match(form,/startTransition\(\(\)=>submit\(data\)\)/);assert.match(form,/preventDefault/);assert.match(form,/method="post"/);assert.doesNotMatch(form,/\.reset\(|localStorage|sessionStorage|defaultValue=\{[^}]*password/);
});
