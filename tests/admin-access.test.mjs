import assert from 'node:assert/strict';
import test from 'node:test';
import {NextResponse} from 'next/server.js';
import {adminRequestAllowed,adminNotFoundResponse} from '../src/lib/auth/admin-access.ts';

test('signed-out, ordinary and failed-role requests are denied before page rendering',async()=>{
 let queried=0;
 assert.equal(await adminRequestAllowed(undefined,async()=>{queried++;return{data:{role:'admin'},error:null}}),false);
 assert.equal(queried,0);
 for(const reply of [{data:{role:'user'},error:null},{data:null,error:null},{data:{role:'admin'},error:{message:'unavailable'}}])
  assert.equal(await adminRequestAllowed('test-user',async()=>reply),false);
 assert.equal(await adminRequestAllowed('test-user',async()=>{throw Error('network')}),false);
 assert.equal(await adminRequestAllowed('test-admin',async()=>({data:{role:'admin'},error:null})),true);
});
test('denied HTTP response is 404 with no trace payload and preserves session cleanup cookies',async()=>{
 const session=NextResponse.next();session.cookies.set('session','',{maxAge:0,httpOnly:true,path:'/'});
 const response=adminNotFoundResponse(session);
 assert.equal(response.status,404);assert.equal(await response.text(),'Not found');
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal(response.cookies.get('session')?.value,'');
 assert.match(response.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal(response.headers.get('x-middleware-next'),null);
});
