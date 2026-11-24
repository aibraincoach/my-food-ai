import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {saveFeedback} from '@/lib/posts/feedback';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_31483252188b"},{status:401});
 const {id}=await params;if(!isUuid(id))return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 const {data:post,error}=await client.from('posts').select('id').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(error)return NextResponse.json({message_code: "route_2ead7e1dfe1f"},{status:500});
 if(!post)return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 const body=await request.json().catch(()=>null);
 if(body?.verdict!=='up'&&body?.verdict!=='down')return NextResponse.json({message_code: "route_978b68cb1d6a"},{status:400});
 if(!isUuid(body.modelCommentId)||typeof body.fingerprint!=='string'||!/^[a-f0-9]{32}$/.test(body.fingerprint))return NextResponse.json({message_code: "route_3bd9bc424d73"},{status:400});
 const {data:revision,error:revisionError}=await client.from('post_comments').select('id').eq('id',body.modelCommentId).eq('post_id',id).eq('author','model').maybeSingle();
 if(revisionError)return NextResponse.json({message_code: "route_2ad049cbbb7a"},{status:500});
 if(!revision)return NextResponse.json({message_code: "route_804a5e2a1732"},{status:400});
 try{await saveFeedback(client,id,body.verdict,body.modelCommentId,body.fingerprint);}
 catch(error){
  const code=(error as {code?:string}).code;
  if(code==='42501')return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
  if(code==='22023')return NextResponse.json({message_code: "route_3bd9bc424d73"},{status:400});
  if(code==='40001'||code==='PT409'){
   const {data:current}=await client.rpc('feedback_revision',{p_post_id:id});
   return NextResponse.json({message_code: "route_4e5793fa7013",revision:current??null},{status:409});
  }
  return NextResponse.json({message_code: "route_4e5793fa7013"},{status:500});
 }
 return new Response(null,{status:204});
}
