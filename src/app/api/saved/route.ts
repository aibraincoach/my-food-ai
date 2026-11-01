import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {listSaved,savePost} from '@/lib/posts/saved';
export async function GET(){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});try{return NextResponse.json({meals:await listSaved(db)});}catch{return NextResponse.json({error:'Saved meals could not be loaded.'},{status:503});}}
export async function POST(request:Request){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});const body=await request.json().catch(()=>null);if(!isUuid(body?.post_id))return NextResponse.json({error:'Invalid meal.'},{status:400});try{return NextResponse.json(await savePost(db,body.post_id));}catch{return NextResponse.json({error:'The meal could not be saved.'},{status:400});}}
