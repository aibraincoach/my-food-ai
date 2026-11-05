'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
export type ProfileIdentity={handle:string;userId:string;avatarMediaId:string|null};
export type PostAuthorRow={userId:string;handle:string;avatarMediaId?:string|null};

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
 const seeded=Boolean(seed?.userId&&seed?.handle);
 const [value,setValue]=useState<ProfileIdentity>({handle:seed?.handle??'',userId:seed?.userId??'',avatarMediaId:seed?.avatarMediaId??null});
 useEffect(()=>{
  if(seeded)return;
  let live=true;
  const apply=(identity:ProfileIdentity)=>{if(live)setValue({handle:seed?.handle||identity.handle,userId:identity.userId,avatarMediaId:identity.avatarMediaId});};
  void loadIdentity().then(apply).catch(()=>{if(live)setValue({handle:seed?.handle??'',userId:'',avatarMediaId:null});});
  const changed=()=>{pending=null;void loadIdentity().then(apply);};
  window.addEventListener('profile-identity-changed',changed);
  return()=>{live=false;window.removeEventListener('profile-identity-changed',changed);};
 },[seed?.handle,seed?.userId,seed?.avatarMediaId,seeded]);
 if(seeded)return {handle:seed!.handle!,userId:seed!.userId!,avatarMediaId:seed?.avatarMediaId??null};
 return value;
}
export function usePostAuthor(row?:PostAuthorRow|null){
 const profile=useProfileIdentity();
 const [changed,setChanged]=useState<{userId:string;handle?:string;avatarMediaId?:string|null}|null>(null);
 const own=Boolean(row?.userId&&profile.userId&&row.userId===profile.userId);
 useEffect(()=>{
  if(!own||!row?.userId)return;
  const userId=row.userId;
  const update=(event:Event)=>{const d=(event as CustomEvent<{handle?:string;avatarMediaId?:string|null}>).detail??{};setChanged(prev=>({...(prev?.userId===userId?prev:{}),userId,...(typeof d.handle==='string'&&d.handle?{handle:d.handle}:{}),...('avatarMediaId' in d?{avatarMediaId:d.avatarMediaId??null}:{})}));};
  window.addEventListener('profile-identity-changed',update);
  return()=>window.removeEventListener('profile-identity-changed',update);
 },[own,row?.userId]);
 if(!row?.userId)return profile;
 if(own){const live=changed?.userId===row.userId?changed:null;return {handle:live?.handle||profile.handle||row.handle,userId:row.userId,avatarMediaId:live&&'avatarMediaId' in live?live.avatarMediaId??null:profile.avatarMediaId};}
 if(row.handle)return {handle:row.handle,userId:row.userId,avatarMediaId:row.avatarMediaId??null};
 return {handle:'',userId:row.userId,avatarMediaId:row.avatarMediaId??null};
}
export function usePostHandle(handle?:string,author?:PostAuthorRow|null) {
 const unknownAuthor=Boolean(author?.userId&&!author.handle);
 const seeded=author?.userId&&author.handle?{userId:author.userId,handle:author.handle,avatarMediaId:author.avatarMediaId??null}:handle?{handle}:undefined;
 const identity=useProfileIdentity(seeded);
 if(unknownAuthor)return handle||'';
 if(author?.handle)return author.handle;
 return identity.handle||handle||'';
}

export function AgentAttribution({ name }: { name?: string | null }) {
 return name ? <span className="block truncate text-[11px] font-normal leading-[1.3] text-muted">via {name}</span> : null;
}
