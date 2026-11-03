import type {SupabaseClient} from '@supabase/supabase-js';

/** Cache only the result of a verified Auth request, never session.user or JWT
 * claims. A session epoch fences late responses from an earlier account. */
export function createVerifiedUserReader<T extends {error:unknown}>(read:()=>Promise<T>){
 let epoch=0;
 let pending:Promise<T>|null=null;
 const get=():Promise<T>=>{
  const current=epoch;
  const request=pending??=Promise.resolve().then(read);
  return request.then(result=>{
   if(current!==epoch)return get();
   if(result.error&&pending===request)pending=null;
   return result;
  },error=>{
   if(current!==epoch)return get();
   if(pending===request)pending=null;
   throw error;
  });
 };
 return {get,invalidate(){epoch++;pending=null;}};
}

type BrowserAuth=Pick<SupabaseClient['auth'],'getUser'|'getSession'|'onAuthStateChange'>;
const installed=new WeakSet<BrowserAuth>();
/** The browser factory installs this once on its SDK singleton. Server clients
 * retain their existing per-request verified Auth checks and RLS credentials. */
export function shareVerifiedBrowserUser(auth:BrowserAuth){
 if(installed.has(auth))return;installed.add(auth);
 const original=auth.getUser.bind(auth);
 let sessionToken:string|null|undefined;
 const reader=createVerifiedUserReader(async()=>{
  // The token is only an invalidation key. Authorization/user data always
  // comes from the real getUser request below, not this local session.
  const {data:{session}}=await auth.getSession();
  if(sessionToken===undefined)sessionToken=session?.access_token??null;
  return original();
 });
 auth.getUser=jwt=>jwt===undefined?reader.get():original(jwt);
 auth.onAuthStateChange((event,session)=>{
  const token=session?.access_token??null;
  if(event==='INITIAL_SESSION'){if(sessionToken===undefined)sessionToken=token;return;}
  const changed=sessionToken!==undefined&&token!==sessionToken;
  sessionToken=token;
  if(changed||event==='SIGNED_OUT'||event==='USER_UPDATED'||event==='PASSWORD_RECOVERY'||event==='MFA_CHALLENGE_VERIFIED')reader.invalidate();
 });
}
