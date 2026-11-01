'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
let pending:Promise<string>|null=null;
let authWatching=false;
let account:string|null|undefined;
function watchAccount(){
 if(authWatching)return;authWatching=true;
 createClient().auth.onAuthStateChange((_event,session)=>{const next=session?.user.id??null;if(account!==undefined&&account!==next)pending=null;account=next;});
}
function loadHandle() {
 watchAccount();
 if(!pending)pending=(async()=>{
  const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user)return '';
  const {data}=await client.from('profiles').select('handle').eq('id',user.id).maybeSingle();
  return String(data?.handle??'');
 })().catch(error=>{pending=null;throw error;});
 return pending;
}
export function usePostHandle(handle?:string) {
 const [value,setValue]=useState(handle??'');
 useEffect(()=>{let live=true;if(handle){setValue(handle);return;}void loadHandle().then(value=>{if(live)setValue(value);}).catch(()=>{if(live)setValue('');});return()=>{live=false;};},[handle]);
 return value;
}
