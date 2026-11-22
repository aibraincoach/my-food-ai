import {pathToFileURL} from 'node:url';

class CheckFailure extends Error {}
const LOOPBACK=new Set(['localhost','127.0.0.1','[::1]']);
function localUrl(value,name){
 let url;
 try{url=new URL(value);}catch{throw new CheckFailure(`${name} must be a loopback HTTP(S) URL.`);}
 if(!['http:','https:'].includes(url.protocol)||!LOOPBACK.has(url.hostname)||url.username||url.password)throw new CheckFailure(`${name} must be a loopback HTTP(S) URL.`);
 return url;
}
export function localSignInConfig(env){
 // Validate both destinations before loading any Auth SDK or session helper.
 const app=localUrl(env.APP_URL,'APP_URL');
 const supabase=localUrl(env.NEXT_PUBLIC_SUPABASE_URL,'NEXT_PUBLIC_SUPABASE_URL');
 if(env.MFA_TEST_DISPOSABLE!=='1')throw new CheckFailure('This check requires MFA_TEST_DISPOSABLE=1.');
 if(!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||!env.TEST_USER2_EMAIL||!env.TEST_USER2_PASSWORD)throw new CheckFailure('The local public key and test account 2 credentials must be configured.');
 return{app,supabase};
}
export async function runLocalAgentSignInCheck(){
 if(process.argv.length>2)throw new CheckFailure('This local-only check accepts no command-line options.');
 const config=localSignInConfig(process.env),nativeFetch=globalThis.fetch;
 const origins=new Set([config.app.origin,config.supabase.origin]);
 // The helper's SDK fetches and the app read obey the same destination/redirect limit.
 globalThis.fetch=(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(!origins.has(url.origin))throw new CheckFailure('The local check refused an unexpected request destination.');
  return nativeFetch(input,{...init,redirect:'error'});
 };
 let client,result;
 try{
  const {signInAsTestUser}=await import('./lib/session.mjs');
  const {createServerClient}=await import('@supabase/ssr');
  let cookie;
  try{cookie=await signInAsTestUser(2);}catch(error){
   throw new CheckFailure(error?.message?.includes('the project requires a CAPTCHA')?'Test account 2 sign-in failed: the project requires a CAPTCHA, and this helper signs in with a password only.':'Test account 2 password sign-in failed.');
  }
  const jar=new Map(cookie.split('; ').map(part=>{const i=part.indexOf('=');return[part.slice(0,i),part.slice(i+1)];}));
  client=createServerClient(config.supabase.href,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
   cookies:{
    getAll:()=>[...jar].map(([name,value])=>({name,value})),
    setAll:rows=>{for(const {name,value}of rows)jar.set(name,value);},
   },
  });
  const {data,error}=await client.auth.getSession();
  if(error||!data.session)throw new CheckFailure('The local session could not be read.');
  // Read only the fresh token's subject for the prefix; do not trigger a second sign-in.
  const id=JSON.parse(Buffer.from(data.session.access_token.split('.')[1],'base64url').toString()).sub;
  if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))throw new CheckFailure('The local session has no valid user id.');
  const response=await fetch(new URL('/api/today',config.app),{headers:{Cookie:cookie},redirect:'error',signal:AbortSignal.timeout(15000)});
  await response.body?.cancel();
  if(!response.ok)throw new CheckFailure('The local authenticated read failed.');
  result={status:response.status,idPrefix:id.slice(0,8)};
 }finally{
  try{if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)throw new CheckFailure('The local session could not be signed out.');}}
  finally{globalThis.fetch=nativeFetch;}
 }
 console.log(`${result.status} ${result.idPrefix}`);
 return result;
}

// CLI entry; importing the guard for an offline test performs no authentication.
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 runLocalAgentSignInCheck().catch(error=>{console.error(error instanceof CheckFailure?error.message:'Local agent sign-in check failed.');process.exitCode=1;});
}
