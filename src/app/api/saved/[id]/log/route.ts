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
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 try{const operationId=readCopyOperation(body,user.id);return NextResponse.json(await logMeal(db,createAdminClient(),id,body?.eaten_at,true,validZone((await cookies()).get('time-zone')?.value),operationId));}
 catch(error){return NextResponse.json({ message_code: error instanceof CopyOperationError ? error.failure.code : "route_35d40f66fffa"},{status:error instanceof CopyOperationError?error.status:400});}
}
export async function DELETE(request:Request,{params}:Context){
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
 try{const operationId=readCopyOperation(body,user.id,true)!;return NextResponse.json({post_id:await copyOperation(db,operationId,id,true,body?.eaten_at,true)});}
 catch(error){return NextResponse.json({ message_code: error instanceof CopyOperationError ? error.failure.code : "route_24ead72d486b"},{status:error instanceof CopyOperationError?error.status:400});}
}
