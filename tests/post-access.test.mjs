import assert from 'node:assert/strict';
import test from 'node:test';
import {NextRequest} from 'next/server.js';
import {postRequestAllowed} from '../src/lib/auth/post-access.ts';
const owner='00000000-0000-4000-8000-000000000001',post='00000000-0000-4000-8000-000000000002';
test('direct post metadata must identify the authenticated owner; malformed IDs never query',async()=>{
 let reads=0;assert.equal(await postRequestAllowed(owner,'bad',async()=>{reads++;return{data:null,error:null};}),false);assert.equal(reads,0);
 for(const result of [{data:null,error:null},{data:{id:post,user_id:post},error:null},{data:{id:owner,user_id:owner},error:null},{data:{id:post,user_id:owner},error:{message:'outage'}}])assert.equal(await postRequestAllowed(owner,post,async()=>result),false);
 assert.equal(await postRequestAllowed(owner,post,async()=>{throw Error('network');}),false);
 assert.equal(await postRequestAllowed(owner,post,async()=>({data:{id:post,user_id:owner},error:null})),true);
});
test('actual middleware refuses foreign post links with404 before streaming, preserving Auth and owner access',async()=>{
 const {middleware}=await import('../src/middleware.ts');const prior={fetch:globalThis.fetch,url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';
 const user={id:owner,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'},encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url'),exp=Math.floor(Date.now()/1000)+3600;
 const session={access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:owner,exp})}.fixture`,refresh_token:'fixture-refresh',expires_in:3600,expires_at:exp,token_type:'bearer',user};let visible=false,reads=0;
 globalThis.fetch=async input=>{const url=new URL(input instanceof Request?input.url:String(input));if(url.pathname==='/auth/v1/user')return Response.json(user);if(url.pathname==='/rest/v1/posts'){reads++;assert.equal(url.searchParams.get('user_id'),'eq.'+owner);assert.equal(url.searchParams.get('id'),'eq.'+post);assert.equal(url.searchParams.get('deleted_at'),'is.null');assert.equal(url.searchParams.get('select'),'id,user_id');return Response.json(visible?{id:post,user_id:owner}:null);}throw Error('Unexpected request');};
 const request=(authenticated=true)=>{const r=new NextRequest('https://app.invalid/posts/'+post);if(authenticated)r.cookies.set('sb-fixture-auth-token','base64-'+encode(session));return r;};
 try{
  const signedOut=await middleware(request(false));assert.equal(signedOut.status,307);assert.equal(reads,0);
  const denied=await middleware(request());assert.equal(denied.status,404);assert.equal(await denied.text(),'Not found');assert.equal(denied.headers.get('cache-control'),'private, no-store');assert.equal(denied.headers.get('x-middleware-next'),null);assert.ok(denied.cookies.getAll().length);
  visible=true;const allowed=await middleware(request());assert.equal(allowed.status,200);assert.equal(allowed.headers.get('x-middleware-next'),'1');assert.equal(reads,2);
 }finally{globalThis.fetch=prior.fetch;if(prior.url===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=prior.url;if(prior.key===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=prior.key;}
});
