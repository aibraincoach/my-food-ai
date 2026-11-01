import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readNutritionLabel } from "@/lib/meta/label";
export async function POST(request:Request){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
 const body=await request.json().catch(()=>null);const path=body?.photo_path;
 if(typeof path!=="string"||!new RegExp(`^${user.id}/[0-9a-f-]{36}/0[.]jpg$`).test(path))return NextResponse.json({error:"Choose an uploaded photo."},{status:400});
 const admin=createAdminClient();
 const {data:photo,error}=await admin.storage.from("media").download(path);
 if(error||!photo||photo.size>20*1024*1024)return NextResponse.json({error:"The photo could not be opened."},{status:400});
 try{
  const reading=await readNutritionLabel(new Uint8Array(await photo.arrayBuffer()));
  const {data,error:saveError}=await admin.from("label_readings").insert({user_id:user.id,photo_path:path,reading}).select("id").single();
  if(saveError)throw Error("The reading could not be saved.");
  return NextResponse.json({reading_id:data.id,reading});
 }catch{return NextResponse.json({error:"The nutrition label could not be read. Try again."},{status:502});}
}
