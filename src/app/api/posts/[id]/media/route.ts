import {after,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {isUuid} from '@/lib/posts/items';
import {attachPostPhoto} from '@/lib/posts/attach-photo';
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const {id}=await context.params;if(!isUuid(id))return NextResponse.json({error:'Post not found.'},{status:404});
 const {data:post,error:readError}=await client.from('posts').select('id').eq('id',id).maybeSingle();
 if(readError)return NextResponse.json({error:'The meal could not be read.'},{status:503});
 if(!post)return NextResponse.json({error:'Post not found.'},{status:404});
 const body=await request.json().catch(()=>null),photo=body?.photo;
 if(typeof body?.not_eaten!=='boolean'||!photo||typeof photo.path!=='string'||!new RegExp(`^${user.id}/[0-9a-f-]{36}/0[.]jpg$`).test(photo.path)||!Number.isSafeInteger(photo.width)||!Number.isSafeInteger(photo.height)||photo.width<1||photo.width>4096||photo.height<1||photo.height>4096)return NextResponse.json({error:'Choose a valid uploaded photo.'},{status:400});
 try{
  const result=await attachPostPhoto(createAdminClient(),id,user.id,photo,body.not_eaten);
  after(async()=>{try{await fetch(new URL('/api/jobs/tick',request.url),{cache:'no-store',signal:AbortSignal.timeout(10000)});}catch{/* Durable queue is retried by the wake. */}});
  return NextResponse.json({media_id:result.mediaId,post_id:id},{status:201});
 }catch(error){
  const code=(error as {code?:string;cause?:{code?:string}})?.cause?.code??(error as {code?:string})?.code;
  return NextResponse.json({error:error instanceof Error?error.message:'The photo could not be attached.'},{status:code==='42501'?404:code==='55000'||code==='40001'?409:code?.startsWith('22')?400:503});
 }
}
