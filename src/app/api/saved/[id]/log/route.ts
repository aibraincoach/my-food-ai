import {CopyOperationError,readCopyOperation,copyOperation} from '@/lib/posts/copy-operation';
import {cookies} from 'next/headers';
import {validZone} from '@/lib/posts/days';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {createAdminClient} from '@/lib/supabase/admin';
import {logMeal} from '@/lib/posts/saved';
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Context){
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 try{const operationId=readCopyOperation(body,user.id);return NextResponse.json(await logMeal(db,createAdminClient(),id,body?.eaten_at,true,validZone((await cookies()).get('time-zone')?.value),operationId));}
 catch(error){return NextResponse.json({error:error instanceof CopyOperationError?error.message:'The meal could not be logged.'},{status:error instanceof CopyOperationError?error.status:400});}
}
export async function DELETE(request:Request,{params}:Context){
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 try{const operationId=readCopyOperation(body,user.id,true)!;return NextResponse.json({post_id:await copyOperation(db,operationId,id,true,body?.eaten_at,true)});}
 catch(error){return NextResponse.json({error:error instanceof CopyOperationError?error.message:'The pending copy could not be removed.'},{status:error instanceof CopyOperationError?error.status:400});}
}
