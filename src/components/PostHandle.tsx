'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
let pending:Promise<string>|null=null;
function loadHandle() {
 if(!pending)pending=(async()=>{
  const client=createClient();const {data:{user}}=await client.auth.getUser();if(!user)return '';
  const {data}=await client.from('profiles').select('handle').eq('id',user.id).maybeSingle();
  return String(data?.handle??'');
 })().finally(()=>{pending=null;});
 return pending;
}
export function usePostHandle(handle?:string) {
 const [value,setValue]=useState(handle??'');
 useEffect(()=>{let live=true;if(handle){setValue(handle);return;}void loadHandle().then(value=>{if(live)setValue(value);});return()=>{live=false;};},[handle]);
 return value;
}
