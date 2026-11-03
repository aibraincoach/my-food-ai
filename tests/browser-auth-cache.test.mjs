import test from 'node:test';
import assert from 'node:assert/strict';
import {createVerifiedUserReader,shareVerifiedBrowserUser} from '../src/lib/auth/browser-user.ts';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const turn=()=>new Promise(resolve=>setTimeout(resolve,0));
const result=id=>({data:{user:id?{id}:null},error:null});
function authFixture(){
 let session={access_token:'token-a',user:{id:'unsigned-user-must-not-be-returned'}};
 let callback,reads=0;
 const pending=[];
 const auth={
  getSession:async()=>({data:{session},error:null}),
  getUser:async jwt=>{const token=jwt??session?.access_token;if(!token)return{data:{user:null},error:new Error('session missing')};reads++;const operation=deferred();pending.push({token,...operation});return operation.promise;},
  onAuthStateChange:listener=>{callback=listener;return{data:{subscription:{unsubscribe(){}}}};},
 };
 return{auth,pending,reads:()=>reads,event(event,token=session?.access_token){session=token?{access_token:token,user:{id:'unsigned-claims'}}:null;callback(event,session);}};
}

test('six browser callers and later reads share one server-verified user response',async()=>{
 const f=authFixture();shareVerifiedBrowserUser(f.auth);shareVerifiedBrowserUser(f.auth);
 const reads=Array.from({length:6},()=>f.auth.getUser());await turn();assert.equal(f.reads(),1);
 f.pending[0].resolve(result('verified-a'));assert.deepEqual((await Promise.all(reads)).map(r=>r.data.user.id),Array(6).fill('verified-a'));
 f.event('INITIAL_SESSION');f.event('SIGNED_IN');assert.equal((await f.auth.getUser()).data.user.id,'verified-a');assert.equal(f.reads(),1);
});

test('token changes and user updates reverify; a late old-account response cannot escape',async()=>{
 const f=authFixture();shareVerifiedBrowserUser(f.auth);
 const old=f.auth.getUser();await turn();f.event('SIGNED_IN','token-b');const current=f.auth.getUser();await turn();assert.equal(f.reads(),2);
 f.pending[0].resolve(result('verified-a'));f.pending[1].resolve(result('verified-b'));
 assert.equal((await old).data.user.id,'verified-b');assert.equal((await current).data.user.id,'verified-b');assert.equal(f.reads(),2);
 f.event('TOKEN_REFRESHED','token-b-refreshed');const refresh=f.auth.getUser();await turn();assert.equal(f.reads(),3);f.pending[2].resolve(result('verified-b'));await refresh;
 f.event('USER_UPDATED');const updated=f.auth.getUser();await turn();assert.equal(f.reads(),4);f.pending[3].resolve(result('updated-b'));assert.equal((await updated).data.user.id,'updated-b');
});

test('sign-out during verification discards the prior user and returns the current missing session',async()=>{
 const f=authFixture();shareVerifiedBrowserUser(f.auth);const read=f.auth.getUser();await turn();f.event('SIGNED_OUT',null);f.pending[0].resolve(result('verified-a'));
 const value=await read;assert.equal(value.data.user,null);assert.match(value.error.message,/session missing/);assert.equal(f.reads(),1);
});

test('explicit-token lookups do not reuse or replace the current session user',async()=>{
 const f=authFixture();shareVerifiedBrowserUser(f.auth);const ordinary=f.auth.getUser();await turn();f.pending[0].resolve(result('verified-a'));await ordinary;
 const explicit=f.auth.getUser('token-c');await turn();assert.equal(f.reads(),2);assert.equal(f.pending[1].token,'token-c');f.pending[1].resolve(result('verified-c'));assert.equal((await explicit).data.user.id,'verified-c');assert.equal((await f.auth.getUser()).data.user.id,'verified-a');assert.equal(f.reads(),2);
});

test('a refused or rejected verification is retryable rather than a permanent cached failure',async()=>{
 let calls=0;const reader=createVerifiedUserReader(async()=>{calls++;if(calls===1)return{data:{user:null},error:new Error('temporary refusal')};if(calls===2)throw Error('offline');return result('verified-a');});
 assert.equal((await reader.get()).data.user,null);await assert.rejects(reader.get(),/offline/);assert.equal((await reader.get()).data.user.id,'verified-a');assert.equal(calls,3);
});
