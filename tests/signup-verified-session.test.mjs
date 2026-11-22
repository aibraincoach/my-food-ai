import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
const generic="We couldn't finish creating your account. Try again.";
const nextStep='If you received a confirmation email, confirm your account, then sign in. Otherwise, sign in.';
function fixture({user={id:'new'},session={user:{id:'new'}},verified={id:'new'},verifyError=null,throws=false,profileError=null}={}) {
 const inserts=[],ends=[],checks=[],exports={};
 const auth={signUp:async()=>({data:{user,session},error:null}),getUser:async()=>{checks.push(1);if(throws)throw Error('private');return{data:{user:verified},error:verifyError}},signOut:async()=>{ends.push(1);return{error:null}}};
 const deps={'next/navigation':{redirect:url=>{throw Object.assign(Error('redirect'),{url})}},'@/lib/supabase/server':{createClient:async()=>({auth})},'@/lib/supabase/admin':{createAdminClient:()=>({from:()=>({insert:async row=>{inserts.push(row);return{error:profileError}}})})},'@/lib/auth/end-session':{endCurrentSession:async a=>a.signOut({scope:'local'})}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/auth/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>deps[n]});
 const form=new FormData();form.set('email','person@example.com');form.set('handle','chosen');form.set('password','private-password');
 return{inserts,ends,checks,run:()=>exports.signUp({},form)};
}
for(const shape of [{id:'existing',identities:[]},{id:'new-unconfirmed',identities:[{provider:'email'}]}])test('no session never inserts: '+shape.id,async()=>{const h=fixture({user:shape,session:null});const r=await h.run();assert.equal(r.error,nextStep);assert.equal(r.email,'person@example.com');assert.equal(r.handle,'chosen');assert.deepEqual(h.inserts,[]);assert.deepEqual(h.checks,[]);assert.deepEqual(h.ends,[]);assert.doesNotMatch(JSON.stringify(r),/password|already|exists/);});
for(const [name,config] of [['mismatched session',{session:{user:{id:'other'}}}],['verification error',{verifyError:{message:'private'}}],['verification missing user',{verified:null}],['different verified user',{verified:{id:'other'}}],['verification throws',{throws:true}]])test(name+' ends session without inserting',async()=>{const h=fixture(config);const r=await h.run();assert.equal(r.error,generic);assert.deepEqual(h.inserts,[]);assert.deepEqual(h.ends,[1]);assert.doesNotMatch(JSON.stringify(r),/private|already|exists/);});
test('verified matching session inserts exactly once for the verified id',async()=>{const h=fixture();await assert.rejects(h.run(),e=>e.url==='/');assert.equal(h.checks.length,1);assert.deepEqual(JSON.parse(JSON.stringify(h.inserts)),[{id:'new',handle:'chosen'}]);assert.deepEqual(h.ends,[]);});
test('verified matching session with a taken handle uses existing recovery',async()=>{const h=fixture({profileError:{code:'23505'}});await assert.rejects(h.run(),e=>e.url==='/choose-handle?error='+encodeURIComponent('That handle is taken. Choose another.'));assert.equal(h.inserts.length,1);assert.deepEqual(h.ends,[]);});
test('Auth code contains no automatic account deletion',()=>{const root=new URL('../src/lib/auth/',import.meta.url);for(const file of readdirSync(root).filter(n=>n.endsWith('.ts')))assert.doesNotMatch(readFileSync(new URL(file,root),'utf8'),/deleteUser/);});
