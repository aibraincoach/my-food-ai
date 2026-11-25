import {tileDrinkKey,readDrinkReceipt,drinkErrorStatus} from "@/lib/intake/drink-operation";
import {validEatenAt} from "@/lib/posts/eaten-at";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDrinkInput, postDrink } from "@/lib/intake/post-drink";
import { drinksForDay, getDrinkCardData, getDrinkCardsData } from "@/lib/intake/hydration";
import { dateInZone, validZone } from "@/lib/posts/days";
import { isUuid } from "@/lib/posts/items";

export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const zone = validZone(params.get("tz") ?? (await cookies()).get("time-zone")?.value);
  try {
    const postIds = params.get("post_ids");
    if (postIds !== null) {
      const ids = [...new Set(postIds.split(","))];
      if (!ids.length || ids.length > 50 || ids.some(id => !isUuid(id))) return NextResponse.json({ message_code: "route_eeaf9e335bdd" }, { status: 400 });
      return NextResponse.json({ drinks: await getDrinkCardsData(db, user.id, ids, zone) });
    }
    const postId = params.get("post_id");
    if (postId) {
      if (!isUuid(postId)) return NextResponse.json({ message_code: "route_1a0a5b5e80ce" }, { status: 400 });
      return NextResponse.json({ drink: await getDrinkCardData(db, user.id, postId, zone) });
    }
    return NextResponse.json({ rows: await drinksForDay(db, user.id, dateInZone(new Date(), zone), zone) });
  } catch { return NextResponse.json({ message_code: "route_80312f72a9a9" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const body=await request.json().catch(()=>null);
  if(body?.owner_id!==undefined&&body.owner_id!==user.id)return NextResponse.json({message_code: "route_746975d64da6"},{status:404});
  if(!isUuid(body?.operation_id))return NextResponse.json({message_code: "route_22cedede8c18"},{status:400});
  const input = parseDrinkInput(body);
  if (!input) return NextResponse.json({ message_code: "route_1537a97602c2" }, { status: 400 });
  const zone = validZone(new URL(request.url).searchParams.get("tz") ?? (await cookies()).get("time-zone")?.value);
  const admin=createAdminClient(),key=tileDrinkKey(body,zone);
  const eatenAt=body?.eaten_at===undefined?new Date().toISOString():validEatenAt(body.eaten_at);
  if(!eatenAt)return NextResponse.json({message_code: "route_6572182f4064"},{status:400});
  const receipt=await readDrinkReceipt(admin,user.id,body.operation_id,key,'tile');
  if(receipt){if('status' in receipt)return NextResponse.json({ message_code: receipt.message_code},{status:receipt.status});return NextResponse.json({post_id:receipt.postId,drink:null},{status:201});}
  try {
    const result = await postDrink(admin,user.id,input,zone,{id:body.operation_id,key,eatenAt});
    return NextResponse.json({ post_id: result.postId, drink: result.drink }, { status: 201 });
  } catch(reason) { const code=(reason as {code?:string})?.code;return NextResponse.json({ message_code: "route_d9093df4e1e4" }, { status: code?drinkErrorStatus(code):502 }); }
}

export async function DELETE(request:Request){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const body=await request.json().catch(()=>null);
 if(body?.owner_id!==user.id)return NextResponse.json({message_code: "route_746975d64da6"},{status:404});
 if(!isUuid(body?.operation_id))return NextResponse.json({message_code: "route_22cedede8c18"},{status:400});
 const {data,error}=await createAdminClient().rpc('cancel_drink_operation',{p_operation_id:body.operation_id,p_user_id:user.id,p_upload_id:null});
 if(error)return NextResponse.json({message_code: "route_542d3857d5da"},{status:drinkErrorStatus(error.code)});
 return NextResponse.json({post_id:data},{status:200});
}
