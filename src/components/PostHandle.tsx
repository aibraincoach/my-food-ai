'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type ProfileIdentity={handle:string;userId:string;avatarMediaId:string|null};
let pending:Promise<ProfileIdentity>|null=null;
let authWatching=false;
let account:string|null|undefined;
function watchAccount(){
 if(authWatching)return;authWatching=true;
 createClient().auth.onAuthStateChange((_event,session)=>{const next=session?.user.id??null;if(account!==undefined&&account!==next)pending=null;account=next;});
}
function loadIdentity() {
 watchAccount();
 if(!pending)pending=(async()=>{
  const client=createClient();const {data:{session}}=await client.auth.getSession();const user=session?.user;if(!user)return {handle:'',userId:'',avatarMediaId:null};
  const {data}=await client.from('profiles').select('handle,avatar_media_id').eq('id',user.id).maybeSingle();
  return {handle:String(data?.handle??''),userId:user.id,avatarMediaId:data?.avatar_media_id??null};
 })().catch(error=>{pending=null;throw error;});
 return pending;
}
export function refreshProfileIdentity(){pending=null;}
export function useProfileIdentity(seed?:Partial<ProfileIdentity>) {
 const [value,setValue]=useState<ProfileIdentity>({handle:seed?.handle??'',userId:seed?.userId??'',avatarMediaId:seed?.avatarMediaId??null});
 useEffect(()=>{
  let live=true;
  const apply=(identity:ProfileIdentity)=>{if(live)setValue({handle:seed?.handle||identity.handle,userId:identity.userId,avatarMediaId:identity.avatarMediaId});};
  void loadIdentity().then(apply).catch(()=>{if(live)setValue({handle:seed?.handle??'',userId:'',avatarMediaId:null});});
  const changed=()=>{pending=null;void loadIdentity().then(apply);};
  window.addEventListener('profile-identity-changed',changed);
  return()=>{live=false;window.removeEventListener('profile-identity-changed',changed);};
 },[seed?.handle]);
 return value;
}
export function usePostHandle(handle?:string) {
 return useProfileIdentity(handle?{handle}:undefined).handle||handle||'';
}

export function AgentAttribution({ name }: { name?: string | null }) {
 return name ? <span className="block truncate text-[11px] font-normal leading-[1.3] text-muted">via {name}</span> : null;
}
