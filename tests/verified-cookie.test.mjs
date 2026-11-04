import test from 'node:test';
import assert from 'node:assert/strict';
import {readVerifiedUserCookie,verifiedUserCookie} from '../src/lib/auth/verified-cookie.ts';
const id='11111111-1111-4111-8111-111111111111';
test('verified cookie parses UUID identity hints and clears explicitly',()=>{
 assert.equal(readVerifiedUserCookie(`other=a; mfa-verified-user=${id}; more=b`),id);
 assert.equal(readVerifiedUserCookie(`other=a;mfa-verified-user=${id}`),id);
 assert.equal(readVerifiedUserCookie('mfa-verified-user=forged'),null);
 assert.equal(readVerifiedUserCookie('other=a'),null);
 assert.equal(verifiedUserCookie(null,true).options.maxAge,0);
 assert.equal(verifiedUserCookie(id,true).options.secure,true);
 assert.equal(verifiedUserCookie(id,false).options.httpOnly,false);
});
test('browser identity hint is used only when it matches the real session account',async()=>{
 const {shareVerifiedBrowserUser}=await import('../src/lib/auth/browser-user.ts');const before=globalThis.document;
 try{for(const [cookie,expected]of [[id,0],['22222222-2222-4222-8222-222222222222',1],['forged',1]]){
  globalThis.document={cookie:`mfa-verified-user=${cookie}`};let calls=0;
  const auth={getSession:async()=>({data:{session:{access_token:'token',user:{id}}}}),getUser:async()=>{calls++;return {data:{user:{id}},error:null};},onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})};
  shareVerifiedBrowserUser(auth);assert.equal((await auth.getUser()).data.user.id,id);assert.equal(calls,expected);
 }}finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});
