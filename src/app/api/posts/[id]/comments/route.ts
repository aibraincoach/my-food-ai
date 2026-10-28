import { after, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/posts/items';
export async function POST(request: Request,{params}:{params:Promise<{id:string}>}) {
 const client=await createClient(); const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to comment.'},{status:401});
 const {id}=await params; if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 const {data:post,error:readError}=await client.from('posts').select('id').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(readError)return NextResponse.json({error:'Meal could not be loaded.'},{status:500});
 if(!post)return NextResponse.json({error:'Meal not found.'},{status:404});
 const body=await request.json().catch(()=>null);
 if(typeof body?.text!=='string'||!body.text.trim()||body.text.length>4000)return NextResponse.json({error:'Enter a comment up to 4000 characters.'},{status:400});
 const {data,error}=await createAdminClient().rpc('append_post_comment',{p_post_id:id,p_user_id:user.id,p_text:body.text.trim()});
 if(error&&error.code==='22023')return NextResponse.json({error:'Enter a comment up to 4000 characters.'},{status:400});
 if(error)return NextResponse.json({error:'Comment could not be saved.'},{status:error.code==='42501'?404:500});
 after(async()=>{try{await fetch(new URL('/api/jobs/tick',request.url),{signal:AbortSignal.timeout(10000)});}catch{/* Queued job survives tick failure. */}});
 return NextResponse.json({comment:data},{status:201});
}
