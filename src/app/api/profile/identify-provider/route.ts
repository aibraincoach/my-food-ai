import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {openWeightsConfigured} from '@/lib/meta/open-weights';
export async function PATCH(request:Request) {
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 if(!openWeightsConfigured())return NextResponse.json({error:'Open identify is not available.'},{status:503});
 const body=await request.json().catch(()=>null);
 if(!body||!['meta','open'].includes(body.provider))return NextResponse.json({error:'Choose an identify provider.'},{status:400});
 const {data,error}=await db.rpc('set_identify_provider',{p_provider:body.provider});
 if(error||!data)return NextResponse.json({error:'The setting could not be saved.'},{status:503});
 return NextResponse.json({provider:data});
}
