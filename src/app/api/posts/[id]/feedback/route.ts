import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {saveFeedback} from '@/lib/posts/feedback';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to save feedback.'},{status:401});
 const {id}=await params;if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 const {data:post,error}=await client.from('posts').select('id').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(error)return NextResponse.json({error:'Meal could not be loaded.'},{status:500});
 if(!post)return NextResponse.json({error:'Meal not found.'},{status:404});
 const body=await request.json().catch(()=>null);
 if(body?.verdict!=='up'&&body?.verdict!=='down')return NextResponse.json({error:'Choose up or down.'},{status:400});
 if(!isUuid(body.modelCommentId))return NextResponse.json({error:'Choose an analysis revision.'},{status:400});
 const {data:revision,error:revisionError}=await client.from('post_comments').select('id').eq('id',body.modelCommentId).eq('post_id',id).eq('author','model').maybeSingle();
 if(revisionError)return NextResponse.json({error:'Analysis could not be loaded.'},{status:500});
 if(!revision)return NextResponse.json({error:'Analysis revision not found.'},{status:400});
 try{await saveFeedback(client,id,user.id,body.verdict,body.modelCommentId);}catch{return NextResponse.json({error:'Feedback could not be saved.'},{status:500});}
 return new Response(null,{status:204});
}
