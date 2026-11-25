import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {englishIntlServer} from './fixtures/english-intl.mjs';
import {authRedirectOrigin} from '../src/lib/auth/redirect-origin.ts';
import {pendingHandle} from '../src/lib/auth/pending-handle.ts';
function load(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(process.env.MFA_AUTH_SOURCE_ROOT?process.env.MFA_AUTH_SOURCE_ROOT+'/'+file:new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText,{exports,URL,React:{createElement},require:n=>{assert.ok(n in deps,n);return deps[n]}});return exports;}
const redirect=url=>{throw Object.assign(Error('redirect'),{url});};
function signup({origin='https://app.invalid',handle='  my_handle  '}={}){
 const calls=[],deps={'next-intl/server':englishIntlServer,'next/headers':{headers:async()=>({get:()=>origin})},'next/navigation':{redirect},'@/lib/auth/redirect-origin':{authRedirectOrigin},'@/lib/auth/pending-handle':{pendingHandle},'@/lib/auth/end-session':{},'@/lib/supabase/admin':{createAdminClient:()=>{throw Error('No unverified write');}},'@/lib/supabase/server':{createClient:async()=>({auth:{signUp:async value=>{calls.push(value);return{data:{user:{id:'unconfirmed'},session:null},error:null}}}})}};
 const {signUp}=load('src/lib/auth/actions.ts',deps),form=new FormData();form.set('handle',handle);form.set('email','new@example.com');form.set('password','private-password');form.set('h-captcha-response',' token ');
 return{calls,run:()=>signUp({},form)};
}
test('confirmation signup stores only trimmed handle metadata and same-origin callback, preserving captcha',async()=>{const f=signup();const result=await f.run();assert.equal(f.calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0].options)),{data:{pending_handle:'my_handle'},emailRedirectTo:'https://app.invalid/auth/callback',captchaToken:'token'});assert.equal(result.handle,'my_handle');assert.ok(!('password'in result));});
test('invalid handles fail before Auth and do not echo a password',async()=>{for(const handle of['','  ','x'.repeat(81)]){const f=signup({handle});assert.equal((await f.run()).error,'Enter a handle of 1 to 80 characters.');assert.equal(f.calls.length,0);}});
test('missing, insecure remote, credentialed and path-bearing origins fail before Auth',async()=>{for(const origin of[null,'http://app.invalid','https://app.invalid/path','https://user:secret@app.invalid','null']){const f=signup({origin});assert.equal((await f.run()).error,"We couldn't finish creating your account. Try again.");assert.equal(f.calls.length,0);}});
test('HTTPS and loopback origins share the reset redirect policy',()=>{for(const origin of['https://app.invalid','http://localhost:1234','http://127.0.0.1:1234','http://[::1]:1234'])assert.equal(authRedirectOrigin(origin),origin);});
function choose(user,error=null){const AuthField=()=>null,noop=()=>null;const page=load('src/app/(auth)/choose-handle/page.tsx',{'next-intl/server':englishIntlServer,'react':{createElement,Suspense:noop},'next/server':{connection:async()=>{}},'next/navigation':{redirect},'@/lib/auth/actions':{chooseHandle:noop},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user},error})}})},'@/lib/auth/pending-handle':{pendingHandle},'@/components/ui/Button':{Button:noop},'../_components/AuthShell':{AuthShell:noop},'../_components/AuthField':{AuthField},'../_components/AuthPieces':{AuthHeader:noop,AuthErrorBanner:noop,AuthBackRow:noop}});
 return{AuthField,async render(){const node=page.default({searchParams:Promise.resolve({})});return node.props.children.type(node.props.children.props)}};
}
function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of[node.props?.children].flat(Infinity)){const match=find(child,type);if(match)return match;}return null;}
test('choose handle reads only verified current-user metadata, does no profile write, and prefills valid values',async()=>{for(const [metadata,expected]of[[{pending_handle:' alice '},'alice'],[{pending_handle:'bob'},'bob'],[{pending_handle:7},''],[{pending_handle:'x'.repeat(81)},''],[{},'']]){const f=choose({id:'current',user_metadata:metadata});assert.equal(find(await f.render(),f.AuthField).props.defaultValue,expected);}});
test('signed-out or failed verification never renders a metadata suggestion',async()=>{for(const args of[[null],[{id:'untrusted',user_metadata:{pending_handle:'planted'}},{message:'PRIVATE'}]])await assert.rejects(choose(...args).render(),e=>e.url==='/welcome');});

test('missing signup Origin shows the existing visible failure and makes no Auth call',async()=>{const f=signup({origin:null});const result=await f.run();assert.equal(result.error,"We couldn't finish creating your account. Try again.");assert.equal(result.handle,'my_handle');assert.equal(f.calls.length,0);assert.ok(!('password' in result));});
