// node --import tsx --test tests/verified-user.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';
import { middleware } from '../src/middleware.ts';
import { VERIFIED_USER_HEADER } from '../src/lib/auth/verified-user-header.ts';
import { sessionCookieBridge } from '../src/lib/auth/session-cookies.ts';

const user = {id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})}.fixture`;

async function withAuth(run) {
  const previousFetch=globalThis.fetch;
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-key';
  let authCalls=0;
  globalThis.fetch=async input=>{
    assert.equal(new URL(String(input instanceof Request?input.url:input)).pathname,'/auth/v1/user');
    authCalls++;return Response.json(user);
  };
  try {await run(()=>authCalls);}
  finally {
    globalThis.fetch=previousFetch;
    if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;
    if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=oldKey;
  }
}

test('a forged verified ID cannot authenticate a protected request with no user',async()=>{
  await withAuth(async calls=>{
    const req=new NextRequest('https://app.invalid/profile',{headers:{[VERIFIED_USER_HEADER]:'forged-user'}});
    const response=await middleware(req);
    assert.equal(req.headers.get(VERIFIED_USER_HEADER),null);
    assert.equal(response.status,307);
    assert.equal(response.headers.get('location'),'https://app.invalid/sign-in');
    assert.equal(response.headers.get(`x-middleware-request-${VERIFIED_USER_HEADER}`),null);
    assert.equal(calls(),0);
  });
});

test('middleware replaces a forged header with the Auth-verified ID on the forwarded request only',async()=>{
  await withAuth(async calls=>{
    const req=new NextRequest('https://app.invalid/profile',{headers:{[VERIFIED_USER_HEADER]:'forged-user'}});
    req.cookies.set('sb-fixture-auth-token','base64-'+encode({access_token:token,refresh_token:'fixture-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user}));
    const response=await middleware(req);
    assert.equal(req.headers.get(VERIFIED_USER_HEADER),user.id);
    assert.equal(response.headers.get(`x-middleware-request-${VERIFIED_USER_HEADER}`),user.id);
    assert.match(response.headers.get('x-middleware-override-headers'),new RegExp(VERIFIED_USER_HEADER));
    assert.equal(response.headers.get(VERIFIED_USER_HEADER),null,'identity is not a browser response header');
    assert.equal(calls(),1);
  });
});

test('the forwarding refresh preserves changed session cookies and their attributes',()=>{
  const req=new NextRequest('https://app.invalid/profile');
  const bridge=sessionCookieBridge(req);
  bridge.cookies.setAll([{name:'session',value:'fresh',options:{httpOnly:true,path:'/',maxAge:3600}}]);
  req.headers.set(VERIFIED_USER_HEADER,user.id);
  bridge.refreshRequestHeaders();
  assert.equal(bridge.response.headers.get(`x-middleware-request-${VERIFIED_USER_HEADER}`),user.id);
  assert.equal(bridge.response.cookies.get('session')?.value,'fresh');
  assert.equal(bridge.response.cookies.get('session')?.httpOnly,true);
  assert.equal(bridge.response.cookies.get('session')?.maxAge,3600);
  assert.match(bridge.response.headers.get('x-middleware-request-cookie'),/session=fresh/);
});
