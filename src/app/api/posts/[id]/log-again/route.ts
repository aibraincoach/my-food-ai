import {CopyOperationError,readCopyOperation,copyOperation} from '@/lib/posts/copy-operation';
import {cookies} from 'next/headers';
import {validZone} from '@/lib/posts/days';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {createAdminClient} from '@/lib/supabase/admin';
import {getCurrentItems} from '@/lib/nutrition/totals';
import {validEatenAt} from '@/lib/posts/eaten-at';
import {logMeal} from '@/lib/posts/saved';
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Context){
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 try{const operationId=readCopyOperation(body,user.id);return NextResponse.json(await logMeal(db,createAdminClient(),id,body?.eaten_at,false,validZone((await cookies()).get('time-zone')?.value),operationId));}
 catch(error){return NextResponse.json({error:error instanceof CopyOperationError?error.message:'The meal could not be logged.'},{status:error instanceof CopyOperationError?error.status:400});}
}
export async function DELETE(request:Request,{params}:Context){
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const{id}=await params;const body=await request.json().catch(()=>null);if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});
 try{const operationId=readCopyOperation(body,user.id,true)!;return NextResponse.json({post_id:await copyOperation(db,operationId,id,false,body?.eaten_at,true)});}
 catch(error){return NextResponse.json({error:error instanceof CopyOperationError?error.message:'The pending copy could not be removed.'},{status:error instanceof CopyOperationError?error.status:400});}
}

export async function GET(request:Request,{params}:Context){const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});const{id}=await params;if(!isUuid(id))return NextResponse.json({error:'Meal not found.'},{status:404});const{data:post,error}=await db.from('posts').select('caption,eaten_at').eq('id',id).eq('user_id',user.id).eq('status','ready').maybeSingle();if(error||!post)return NextResponse.json({error:'Meal not found.'},{status:404});const current=await getCurrentItems(db,id);const items=current.map(i=>({name:i.name,portion_text:i.portion_text,portion_grams:i.portion_grams,nutrition:{calories:i.calories,protein_g:i.protein_g,carbs_g:i.carbs_g,fat_g:i.fat_g,food_category:i.food_category,micronutrients:i.micronutrients}}));const{data:intake,error:intakeError}=await db.from('intake_logs').select('kind,amount,ml,label,source,post_item_id').eq('post_id',id).eq('user_id',user.id);if(intakeError)return NextResponse.json({error:'The meal could not be loaded.'},{status:503});const drinks=(intake??[]).map(row=>({...row,item_name:current.find(item=>item.id===row.post_item_id)?.name??null}));const{data:first}=await db.from('posts').select('eaten_at').eq('user_id',user.id).gte('eaten_at',validEatenAt(new URL(request.url).searchParams.get('day_start'))??new Date().toISOString()).order('eaten_at').limit(1).maybeSingle();return NextResponse.json({id,name:(post.caption||items?.[0]?.name||'Meal').slice(0,80),items,drinks,firstPostAt:first?.eaten_at??null});}
