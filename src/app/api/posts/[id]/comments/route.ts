import { capUser } from "@/lib/limits/user-cap";
import { after, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/posts/items';
export async function POST(request: Request,{params}:{params:Promise<{id:string}>}) {
 const client=await createClient(); const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_b7c879fec850"},{status:401});
 const capped = await capUser(user.id, "correct"); if (capped) return capped;
 const {id}=await params; if(!isUuid(id))return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 const {data:post,error:readError}=await client.from('posts').select('id').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(readError)return NextResponse.json({message_code: "route_2ead7e1dfe1f"},{status:500});
 if(!post)return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 const body=await request.json().catch(()=>null);
 if(typeof body?.text!=='string'||!body.text.trim()||body.text.length>4000)return NextResponse.json({message_code: "route_a8fd311448ff"},{status:400});
 const {data,error}=await createAdminClient().rpc('append_post_comment',{p_post_id:id,p_user_id:user.id,p_text:body.text.trim()});
 if(error&&error.code==='22023')return NextResponse.json({message_code: "route_a8fd311448ff"},{status:400});
 if(error)return NextResponse.json({message_code: "route_770fa8b158ed"},{status:error.code==='42501'?404:500});
 // A comment answers the question beside a published meal (#615); the queued correction applies it.
 const cleared=await createAdminClient().from('posts').update({question:null}).eq('id',id).eq('user_id',user.id).not('question','is',null);
 if(cleared.error)console.warn('question could not be cleared',cleared.error.message);
 after(async()=>{try{await fetch(new URL('/api/jobs/tick',request.url),{signal:AbortSignal.timeout(10000)});}catch{/* Queued job survives tick failure. */}});
 return NextResponse.json({comment:data},{status:201});
}
