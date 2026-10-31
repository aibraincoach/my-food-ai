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

test('actual middleware returns HTTP 404 for signed-out and non-admin trace requests',async()=>{
 const {NextRequest}=await import('next/server.js');
 const {middleware}=await import('../src/middleware.ts');
 const originalFetch=globalThis.fetch;const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;const originalKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';
 const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const exp=Math.floor(Date.now()/1000)+3600;
 const session={access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp})}.fixture`,refresh_token:'fixture-refresh',expires_in:3600,expires_at:exp,token_type:'bearer',user};
 let role='user';
 globalThis.fetch=async input=>{
  const url=String(input instanceof Request?input.url:input);
  if(url.includes('/auth/v1/user'))return Response.json(user);
  if(url.includes('/rest/v1/profiles'))return Response.json({role});
  throw Error('Unexpected request');
 };
 try{
  const signedOut=await middleware(new NextRequest('https://app.invalid/admin/posts/00000000-0000-4000-8000-000000000002'));
  assert.equal(signedOut.status,404);assert.equal(await signedOut.text(),'Not found');
  const request=()=>{const req=new NextRequest('https://app.invalid/admin/posts/00000000-0000-4000-8000-000000000002');req.cookies.set('sb-fixture-auth-token','base64-'+encode(session));return req};
  const ordinary=await middleware(request());assert.equal(ordinary.status,404);assert.equal(await ordinary.text(),'Not found');
  role='admin';const allowed=await middleware(request());assert.equal(allowed.status,200);assert.equal(allowed.headers.get('x-middleware-next'),'1');
 }finally{globalThis.fetch=originalFetch;if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=originalKey;}
});
