import {CaptureFailureError} from '@/lib/posts/capture-failure';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {listSaved,savePost} from '@/lib/posts/saved';
export async function GET(){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});try{return NextResponse.json({meals:await listSaved(db)});}catch{return NextResponse.json({message_code: "route_f113aa0fb999"},{status:503});}}
export async function POST(request:Request){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});const body=await request.json().catch(()=>null);if(!isUuid(body?.post_id))return NextResponse.json({message_code: "route_68f7b121048f"},{status:400});try{return NextResponse.json(await savePost(db,body.post_id));}catch(e){const code=(e as {code?:string})?.code;return NextResponse.json({message_code: e instanceof CaptureFailureError ? e.failure.code : "error_0795a0b4a0a6"},{status:code==='42501'?409:400});}}
