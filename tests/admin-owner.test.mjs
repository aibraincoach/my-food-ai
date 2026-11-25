import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
function fixture({user={id:'owner'},authError=null,role='admin',profileError=null}={}){
 const events=[],exports={};const client={auth:{getUser:async()=>{events.push('verified-user');return{data:{user},error:authError};}},from(table){events.push('role-table:'+table);return{select(column){assert.equal(column,'role');return this;},eq(column,value){assert.equal(column,'id');assert.equal(value,user.id);return this;},maybeSingle:async()=>({data:role===null?null:{role},error:profileError})};}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/lib/admin/owner.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require(name){if(name==='react')return{cache:fn=>fn};if(name==='next/navigation')return{notFound(){events.push('not-found');throw Error('404');}};if(name==='@/lib/supabase/server')return{createClient:async()=>{events.push('session-client');return client;}};throw Error('Unexpected privileged dependency: '+name);}});
 return{guard:exports.requireOwner,events,client};
}
for(const [name,input,expected]of [
 ['signed out',{user:null},['session-client','verified-user','not-found']],
 ['unverified session',{authError:Error('expired')},['session-client','verified-user','not-found']],
 ['ordinary account',{role:'user'},['session-client','verified-user','role-table:profiles','not-found']],
 ['missing role',{role:null},['session-client','verified-user','role-table:profiles','not-found']],
 ['role read fails',{profileError:Error('unavailable')},['session-client','verified-user','role-table:profiles','not-found']],
])test('owner guard refuses '+name+' before any privileged dependency',async()=>{const f=fixture(input);await assert.rejects(f.guard(),/404/);assert.deepEqual(f.events,expected);});
test('owner guard returns only the verified owner and their session client',async()=>{const f=fixture(),result=await f.guard();assert.equal(result.user.id,'owner');assert.equal(result.client,f.client);assert.deepEqual(f.events,['session-client','verified-user','role-table:profiles']);});
for(const file of ['src/app/admin/page.tsx','src/app/admin/freeze-reports/page.tsx','src/app/admin/posts/[id]/page.tsx','src/app/admin/people/page.tsx','src/app/admin/people/[id]/page.tsx'])test(file+' calls the shared guard before a service client',()=>{
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),calls=[];
 function visit(node){if(ts.isCallExpression(node))calls.push({name:node.expression.getText(ast),at:node.pos});ts.forEachChild(node,visit);}visit(ast);
 const guard=calls.filter(c=>c.name==='requireOwner');assert.equal(guard.length,1);for(const call of calls.filter(c=>c.name==='createAdminClient'))assert.ok(guard[0].at<call.at);assert.equal(calls.some(c=>c.name==='createClient'||c.name.endsWith('.auth.getUser')),false,'role verification has one implementation');
});
