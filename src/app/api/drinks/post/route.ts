import {photoDrinkKey,readDrinkReceipt,drinkErrorStatus} from '@/lib/intake/drink-operation';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {isUuid} from '@/lib/posts/items';
import {validEatenAt} from '@/lib/posts/eaten-at';
import {scalePhotoDrink,type PhotoDrink} from '@/lib/intake/photo-drinks';
import {sumNutrition} from '@/lib/nutrition/totals';
import {plainConsumed} from '@/lib/pipeline/wording';
import {markReady} from '@/lib/pipeline/persist';
export const maxDuration=300;
export async function POST(request:Request){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const body=await request.json().catch(()=>null);
 if(body?.owner_id!==undefined&&body.owner_id!==user.id)return NextResponse.json({message_code: "route_6b5f780f8b11"},{status:404});
 if(!isUuid(body?.operation_id))return NextResponse.json({message_code: "route_22cedede8c18"},{status:400});
 const eatenAt=body?.eaten_at===undefined?new Date().toISOString():validEatenAt(body.eaten_at);
 if(!isUuid(body?.upload_id)||typeof body?.caption!=='string'||body.caption.length>2000||!eatenAt||!Array.isArray(body.readings)||body.readings.length<1||body.readings.length>8)return NextResponse.json({message_code: "route_e8bc94eebcee"},{status:400});
 for(const reading of body.readings)if(!isUuid(reading?.reading_id)||!Array.isArray(reading.selections)||reading.selections.length>40||reading.selections.some((s:{index?:unknown;ml?:unknown})=>!Number.isInteger(s?.index)||Number(s.index)<0||!Number.isFinite(s?.ml)||Number(s.ml)<1||Number(s.ml)>5000))return NextResponse.json({message_code: "route_75dd7b606424"},{status:400});
 const location=body.location??null;
 if(typeof body.save_as_meal!=='boolean'||(location!==null&&(typeof location!=='object'||!Number.isFinite(location.lat)||!Number.isFinite(location.lng)||Math.abs(location.lat)>90||Math.abs(location.lng)>180||(location.accuracy_m!=null&&(!Number.isFinite(location.accuracy_m)||location.accuracy_m<0)))))return NextResponse.json({message_code: "route_f8731e88d19d"},{status:400});
 const admin=createAdminClient(),key=photoDrinkKey(body);
 const receipt=await readDrinkReceipt(admin,user.id,body.operation_id,key,'photo');
 if(receipt){if('status' in receipt)return NextResponse.json({ message_code: receipt.message_code},{status:receipt.status});return NextResponse.json({post_id:receipt.postId},{status:201});}
 const {data:stored,error:readError}=await admin.from('composer_drink_readings').select('id,drinks').eq('user_id',user.id).eq('upload_id',body.upload_id).in('id',body.readings.map((r:{reading_id:string})=>r.reading_id));
 if(readError)return NextResponse.json({message_code: "route_c9652e91a22b"},{status:503});
 const expected:Record<string,PhotoDrink[]>={},items:{name:string;portion_text:string;portion_grams:number|null;nutrition:PhotoDrink['nutrition']}[]=[];
 for(const choice of body.readings){
  const reading=stored?.find(r=>r.id===choice.reading_id);if(!reading)continue;
  expected[reading.id]=reading.drinks as PhotoDrink[];
  for(const selection of choice.selections){const drink=(reading.drinks as PhotoDrink[])[selection.index];if(!drink)continue;const scaled=scalePhotoDrink(drink,selection.ml);items.push({name:scaled.name,portion_text:`${scaled.ml} ml`,portion_grams:scaled.grams,nutrition:scaled.nutrition});}
 }
 const summary=plainConsumed(sumNutrition(items.map(item=>({...item.nutrition,name:item.name}))));
 const {data,error}=await admin.rpc('publish_photo_drink_operation',{p_operation_id:body.operation_id,p_request_key:key,p_upload_id:body.upload_id,p_user_id:user.id,p_readings:body.readings,p_caption:body.caption,p_eaten_at:eatenAt,p_location:location,p_save_as_meal:body.save_as_meal,p_items:items,p_summary:summary,p_expected:expected});
 if(error)return NextResponse.json({ message_code: error.code==='42501' ? "route_e431cb5e4a79" : "route_07c3267907ee"},{status:drinkErrorStatus(error.code)});
 // Nutrition, intake and the photo have committed together. Optional PNG work
 // must never turn a successful Post into a retry that creates another meal.
 try{await markReady(data,admin,undefined,{notify:false});}catch{console.error('Drink photo card rendering failed.');}
 return NextResponse.json({post_id:data},{status:201});
}

export async function DELETE(request:Request){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const body=await request.json().catch(()=>null);
 if(body?.owner_id!==user.id)return NextResponse.json({message_code: "route_6b5f780f8b11"},{status:404});
 if(!isUuid(body?.operation_id)||!isUuid(body?.upload_id))return NextResponse.json({message_code: "route_0ac89faa64bf"},{status:400});
 const {data,error}=await createAdminClient().rpc('cancel_drink_operation',{p_operation_id:body.operation_id,p_user_id:user.id,p_upload_id:body.upload_id});
 if(error)return NextResponse.json({message_code: "route_7f1e06ef7708"},{status:drinkErrorStatus(error.code)});
 return NextResponse.json({post_id:data},{status:200});
}
