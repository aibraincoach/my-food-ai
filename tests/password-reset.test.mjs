import {authRedirectOrigin} from '../src/lib/auth/redirect-origin.ts';
import {englishIntl,englishIntlServer} from './fixtures/english-intl.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {NextRequest,NextResponse} from 'next/server.js';
import ts from 'typescript';
import {readFileSync,existsSync} from 'node:fs';
function fixture({resetError=null,user={id:'verified-user'},updateError=null,origin='https://app.invalid'}={}){
  const calls=[],exports={},path=new URL('../src/lib/auth/password-reset.ts',import.meta.url);
  if(!existsSync(path))return{calls,exports};
  const deps={'@/lib/auth/redirect-origin':{authRedirectOrigin},'next-intl':englishIntl,'next-intl/server':englishIntlServer,
    'next/navigation':{redirect:url=>{throw Object.assign(Error('redirect'),{url});}},
    'next/headers':{headers:async()=>({get:key=>key==='origin'?origin:null})},
    '@/lib/supabase/server':{createClient:async signal=>{
      assert.ok(signal instanceof AbortSignal);
      return{auth:{
        resetPasswordForEmail:async(email,options)=>{calls.push(['reset',email,options]);return{error:resetError};},
        getUser:async()=>{calls.push(['user']);return{data:{user},error:null};},
        updateUser:async data=>{calls.push(['update',data]);return{error:updateError};},
      }};
    }},
  };
  vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,AbortSignal,URL,require:n=>deps[n]});
  return{calls,exports};
}
const input=values=>{const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,v);return f;};
test('reset request makes one provider call with same-origin callback and no account lookup',async()=>{const f=fixture();assert.equal(typeof f.exports.requestPasswordReset,'function','reset action must exist');await assert.rejects(f.exports.requestPasswordReset(input({email:' person@example.com ','h-captcha-response':'token'})),e=>{assert.equal(e.url,'/reset-password?sent=1');return true;});assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'reset');assert.equal(f.calls[0][1],'person@example.com');assert.equal(f.calls[0][2].redirectTo,'https://app.invalid/auth/password-reset');assert.equal(f.calls[0][2].captchaToken,'token');});
test('email request failures are visible without raw provider details or automatic retry',async()=>{const f=fixture({resetError:{message:'PRIVATE'}});assert.equal(typeof f.exports.requestPasswordReset,'function');await assert.rejects(f.exports.requestPasswordReset(input({email:'person@example.com'})),e=>{assert.equal(new URL(e.url,'https://app.invalid').searchParams.get('error'),'The reset email could not be sent. Try again.');return true;});assert.equal(f.calls.length,1);});
test('new password is written only for a verified session and success keeps that person signed in',async()=>{const f=fixture();assert.equal(typeof f.exports.updatePassword,'function');await assert.rejects(f.exports.updatePassword(input({password:'New-password-123!'})),e=>e.url==='/');assert.deepEqual(JSON.parse(JSON.stringify(f.calls)),[['user'],['update',{password:'New-password-123!'}]]);const denied=fixture({user:null});await assert.rejects(denied.exports.updatePassword(input({password:'New-password-123!'})),e=>new URL(e.url,'https://app.invalid').pathname==='/reset-password');assert.equal(denied.calls.some(c=>c[0]==='update'),false);});
test('weak passwords and missing origin fail before a provider write',async()=>{for(const kind of['weak','origin']){const f=fixture({origin:null});const method=kind==='weak'?'updatePassword':'requestPasswordReset';assert.equal(typeof f.exports[method],'function');await assert.rejects(f.exports[method](input(kind==='weak'?{password:'short'}:{email:'person@example.com'})));assert.equal(f.calls.length,0);}});

function callbackFixture({redirectType='recovery',error=null,throws=false}={}){
  const path=new URL('../src/app/auth/password-reset/route.ts',import.meta.url),exports={},calls=[];
  if(!existsSync(path))return{exports,calls};
  let notify=()=>{};const deps={'next-intl':englishIntl,'next-intl/server':englishIntlServer,'next/server':{NextResponse},'@supabase/ssr':{createServerClient:(_url,_key,options)=>({auth:{onAuthStateChange:callback=>{notify=callback;return{data:{subscription:{unsubscribe(){}}}};},exchangeCodeForSession:async(code,flow)=>{calls.push([code,flow]);if(throws)throw Error('PRIVATE');options.cookies.setAll([{name:'verified-recovery',value:'token',options:{httpOnly:true}}]);notify(redirectType==='recovery'?'PASSWORD_RECOVERY':'SIGNED_IN');return{data:{user:{id:'verified'}},error};}}})}};
  vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,process:{env:{}},fetch:()=>{throw Error('unexpected direct fetch');},require:n=>deps[n]});
  return{exports,calls};
}
test('only a recovered PKCE session reaches the new-password page with its cookies',async()=>{const f=callbackFixture();assert.equal(typeof f.exports.GET,'function');const r=await f.exports.GET(new NextRequest('https://app.invalid/auth/password-reset?code=once&sb_flow_id=slot'));assert.equal(new URL(r.headers.get('location')).pathname,'/new-password');assert.equal(r.cookies.get('verified-recovery')?.value,'token');assert.equal(f.calls.length,1);assert.equal(f.calls[0][0],'once');assert.equal(f.calls[0][1].flowId,'slot');});
test('missing, expired, failed and non-recovery callback codes never install a session',async()=>{for(const options of[{missing:true},{error:{message:'PRIVATE'}},{throws:true},{redirectType:'signup'}]){const f=callbackFixture(options);assert.equal(typeof f.exports.GET,'function');const r=await f.exports.GET(new NextRequest('https://app.invalid/auth/password-reset'+(options.missing?'':'?code=once')));assert.equal(new URL(r.headers.get('location')).pathname,'/reset-password');assert.equal(r.cookies.get('verified-recovery'),undefined);assert.ok(!r.headers.get('location').includes('PRIVATE'));assert.equal(f.calls.length,options.missing?0:1);}});
