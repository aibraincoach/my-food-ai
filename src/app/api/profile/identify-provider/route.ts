import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {openWeightsConfigured} from '@/lib/meta/open-weights';
export async function PATCH(request:Request) {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 if(!openWeightsConfigured())return NextResponse.json({message_code: "route_eb2d02d20462"},{status:503});
 const body=await request.json().catch(()=>null);
 if(!body||!['meta','open'].includes(body.provider))return NextResponse.json({message_code: "route_46baaf2e7e84"},{status:400});
 const {data,error}=await db.rpc('set_identify_provider',{p_provider:body.provider});
 if(error||!data)return NextResponse.json({message_code: "route_9202743ef6df"},{status:503});
 return NextResponse.json({provider:data});
}
