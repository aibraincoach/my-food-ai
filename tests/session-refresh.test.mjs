import assert from 'node:assert/strict';
import test from 'node:test';
import {NextRequest} from 'next/server.js';
import {middleware} from '../src/middleware.ts';

const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const token=exp=>`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:'00000000-0000-4000-8000-000000000001',exp})}.fixture`;
const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const cookieName='sb-fixture-auth-token';
const cookie=value=>'base64-'+encode(value);

test('session renewal is visible to the current server render and persists for the next visit',async()=>{
 const originalFetch=globalThis.fetch;const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;const originalKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';
 const fresh={access_token:token(Math.floor(Date.now()/1000)+3600),refresh_token:'fixture-renewed',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 let refreshes=0;
 globalThis.fetch=async input=>{const url=String(input instanceof Request?input.url:input);if(url.includes('/token')){refreshes++;return Response.json(fresh)}if(url.includes('/user'))return Response.json(user);throw Error('Unexpected request')};
 try{
  const expired={...fresh,access_token:token(Math.floor(Date.now()/1000)-3600),refresh_token:'fixture-expired',expires_at:Math.floor(Date.now()/1000)-3600};
  const req=new NextRequest('https://app.invalid/');req.cookies.set(cookieName,cookie(expired));
  const response=await middleware(req);
  assert.equal(refreshes,1);
  const renewed=response.cookies.getAll().filter(c=>c.name.startsWith(cookieName));
  assert.ok(renewed.length>0,'browser receives renewed cookies');
  for(const c of renewed)assert.ok(req.cookies.get(c.name)?.value===c.value,'same-request render must read the renewed session');
  assert.match(response.headers.get('x-middleware-override-headers')??'',/cookie/,'renewal is forwarded to the server render');
  const next=new NextRequest('https://app.invalid/profile');for(const c of renewed)next.cookies.set(c.name,c.value);
  await middleware(next);assert.equal(refreshes,1,'the following visit reuses the persisted session');
 }finally{globalThis.fetch=originalFetch;if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=originalKey;}
});

test('expired session cleanup survives the redirect to sign-in',async()=>{
 const originalFetch=globalThis.fetch;const originalUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;const originalKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';
 globalThis.fetch=async()=>Response.json({code:'refresh_token_not_found',message:'Invalid refresh token'},{status:400});
 try{
  const expired={access_token:token(Math.floor(Date.now()/1000)-3600),refresh_token:'fixture-invalid',expires_in:3600,expires_at:Math.floor(Date.now()/1000)-3600,token_type:'bearer',user};
  const req=new NextRequest('https://app.invalid/profile');req.cookies.set(cookieName,cookie(expired));
  const response=await middleware(req);
  assert.equal(response.status,307);assert.equal(response.headers.get('location'),'https://app.invalid/sign-in');
  const cleared=response.cookies.getAll().find(c=>c.name===cookieName);assert.ok(cleared);assert.equal(cleared.value,'');assert.equal(cleared.maxAge,0);
 }finally{globalThis.fetch=originalFetch;if(originalUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=originalUrl;if(originalKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=originalKey;}
});

test('multiple cookie chunks and expired chunks survive every response path',async()=>{
 const {sessionCookieBridge}=await import('../src/lib/auth/session-cookies.ts');
 const {NextResponse}=await import('next/server.js');
 const request=new NextRequest('https://app.invalid/profile');
 request.cookies.set('session.2','stale');
 const bridge=sessionCookieBridge(request);
 bridge.cookies.setAll([
  {name:'session.0',value:'part-a',options:{path:'/',httpOnly:true,maxAge:3600,sameSite:'lax'}},
  {name:'session.1',value:'part-b',options:{path:'/',httpOnly:true,maxAge:3600,sameSite:'lax'}},
 ]);
 bridge.cookies.setAll([{name:'session.2',value:'',options:{path:'/',maxAge:0}}]);
 const response=bridge.apply(NextResponse.redirect('https://app.invalid/sign-in'));
 for(const name of ['session.0','session.1','session.2']){
  assert.equal(request.cookies.get(name)?.value,response.cookies.get(name)?.value);
  assert.ok(bridge.response.cookies.has(name));
 }
 assert.equal(response.cookies.get('session.0')?.httpOnly,true);
 assert.equal(response.cookies.get('session.0')?.sameSite,'lax');
 assert.equal(response.cookies.get('session.2')?.maxAge,0);
});
