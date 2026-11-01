import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {createAdminClient} from '@/lib/supabase/admin';
import {logMeal} from '@/lib/posts/saved';
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Context){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});try{return NextResponse.json(await logMeal(db,createAdminClient(),id,body?.eaten_at,true));}catch{return NextResponse.json({error:'The meal could not be logged.'},{status:400});}}
