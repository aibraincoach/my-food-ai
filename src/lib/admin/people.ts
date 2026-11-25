import 'server-only';
import {requireOwner} from './owner';
import {createAdminClient} from '@/lib/supabase/admin';
import type {User} from '@supabase/supabase-js';

export type PersonMetadata = {id:string;handle:string|null;last_activity:string|null;meals:number;errors:number;comments:number;corrections:number;live_tokens:number;agent_last_used:string|null};
export type GroupKind='signup'|'today'|'week'|'error';
export type PeopleStats={
 counts:Record<GroupKind,number>;
 groups:{kind:GroupKind;id:string;handle:string|null;at:string}[];
 daily:{day:string;signups:number;meals:number;active:number;agent_reads:number;agent_lists:number;agent_writes:number}[];
 metadata:PersonMetadata[];
 person_errors:{id:string;post_id:string|null;at:string;kind:'failedMeal'|'failedJob'|'failedCall'|'freezeReport';code:string|null}[];
 person_error_count:number;
 person_agent:{day:string;reads:number;lists:number;writes:number}[];
};
export type Account={id:string;createdAt:string;lastSignIn:string|null;providers:string[];confirmed:boolean};
const providers = new Set(['email','phone','apple','azure','bitbucket','discord','facebook','figma','github','gitlab','google','kakao','keycloak','linkedin','linkedin_oidc','notion','slack','slack_oidc','spotify','twitch','twitter','x','workos','zoom','fly']);
function account(user:User):Account{
 // Explicit projection: email, identities' emails and user_metadata never leave the reader.
 return {id:user.id,createdAt:user.created_at,lastSignIn:user.last_sign_in_at??null,providers:Array.isArray(user.app_metadata?.providers)&&user.app_metadata.providers.every((p:unknown)=>typeof p==='string'&&providers.has(p))?[...new Set(user.app_metadata.providers as string[])]:[],confirmed:!!user.email_confirmed_at};
}
export function peoplePage(value:unknown):number {
 const n=typeof value==='string'&&/^[1-9][0-9]*$/.test(value)?Number(value):1;
 return Number.isSafeInteger(n)&&n<=100000?n:1;
}
export async function readPeopleAccounts(page:number){
 await requireOwner();
 const admin=createAdminClient();
 try{
  const {data,error}=await admin.auth.admin.listUsers({page,perPage:50});
  if(error)throw error;
  // Do not use the SDK's nextPage parser: this installed version truncates multi-digit pages.
  // total comes from GoTrue's x-total-count. An unavailable total is a visible read error.
  if(!Number.isSafeInteger(data.total)||data.total<0||data.users.length>50||data.total<data.users.length)throw Error('Invalid Auth pagination');
  return {ok:true as const,accounts:data.users.map(account),total:data.total};
 }catch{return {ok:false as const};}
}
export async function readPeopleStats(zone:string,ids:string[],page:number,person:string|null=null,now=new Date()){
 await requireOwner();
 const admin=createAdminClient();
 try{
  const {data,error}=await admin.rpc('admin_people',{p_zone:zone,p_now:now.toISOString(),p_ids:ids,p_page:page,p_person:person});
  if(error||!data)throw Error('People statistics unavailable');
  return {ok:true as const,stats:data as PeopleStats};
 }catch{return {ok:false as const};}
}
export async function readPersonAccount(id:string){
 await requireOwner();
 const admin=createAdminClient();
 try{
  const {data,error}=await admin.auth.admin.getUserById(id);
  if(error){if(error.status===404)return {ok:true as const,person:null};throw error;}
  return {ok:true as const,person:{...account(data.user),email:data.user.email??null}};
 }catch{return {ok:false as const};}
}
