import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {middleware} from '../src/middleware.ts';
import {readFileSync,existsSync} from 'node:fs';
test('signed-out protected user pages land on Welcome; admin keeps404 and shell stays anonymous',async()=>{
 const prior={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,fetch:globalThis.fetch};
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';let calls=0;globalThis.fetch=async()=>{calls++;throw Error('anonymous requests need no database read');};
 try{for(const path of ['/','/search','/days/2026-11-22','/profile','/posts/example','/choose-handle']){const r=await middleware(new NextRequest('https://app.invalid'+path));assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location')).pathname,'/welcome',path);}assert.equal((await middleware(new NextRequest('https://app.invalid/admin'))).status,404);assert.equal(calls,0);const {config}=await import('../src/middleware.ts');assert.ok(config.matcher.includes('/shell'));assert.ok(config.matcher.includes('/welcome'));const shell=await middleware(new NextRequest('https://app.invalid/shell?lang=ja'));assert.equal(shell.status,200);assert.equal(shell.headers.get('x-middleware-request-x-mfa-shell-locale'),'ja');assert.equal(calls,0,'anonymous shell makes no Auth or account request');}
 finally{globalThis.fetch=prior.fetch;for(const [key,value]of [['NEXT_PUBLIC_SUPABASE_URL',prior.url],['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',prior.key]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
test('Welcome reuses the real result card and has an email path without owner-gated promises',()=>{
 const url=new URL('../src/app/(auth)/welcome/page.tsx',import.meta.url);assert.ok(existsSync(url),'Welcome page must exist');const product=new URL('../src/app/(auth)/_components/AuthProduct.tsx',import.meta.url);const code=readFileSync(url,'utf8')+readFileSync(product,'utf8');assert.match(code,/<ResultsCard/);assert.match(code,/t\('sample'\)/);assert.match(code,/t\('heroTitle'\)/);assert.match(code,/t\('heroSupport'\)/);assert.match(code,/href="\/sign-in"/);assert.match(code,/t\('emailPath'\)/);assert.match(code,/href="\/sign-in" prefetch={false}/);assert.doesNotMatch(code,/Free while|visible to your account only|emailed.*code/);
});

test('Sample calories agree with its macros and plausible salmon/rice portions',()=>{const product=new URL('../src/app/(auth)/_components/AuthProduct.tsx',import.meta.url);const s=readFileSync(product,'utf8');const values=Object.fromEntries(['calories','protein','carbs','fat'].map(k=>[k,Number(s.match(new RegExp(k+'={([0-9]+)}'))?.[1])]));assert.ok(Object.values(values).every(Number.isFinite));assert.ok(Math.abs(values.calories-(4*values.protein+4*values.carbs+9*values.fat))<=5,'sample energy must agree within rounding');assert.ok(values.protein>=27,'120g salmon alone supplies about27g protein');assert.match(s,/name: t\('salmon'\), grams: 120/);assert.match(s,/name: t\('rice'\), grams: 150/);});
