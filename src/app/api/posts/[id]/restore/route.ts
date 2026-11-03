import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {restorePost} from '@/lib/posts/deleted';
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const {id}=await params;if(!isUuid(id))return new Response(null,{status:404});
 const result=await restorePost(db,user.id,id);
 if(result.error)return NextResponse.json({error:'Post could not be restored.'},{status:500});
 return new Response(null,{status:result.ok?200:404});
}
