import {createClient} from '@/lib/supabase/server';
import {validReport} from '@/lib/diagnostics/schema';
export async function POST(request:Request){
  const client=await createClient();const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user)return Response.json({message_code: "unknownFailure"},{status:401});
  // Bound streaming input too: Content-Length alone is not a trustworthy limit.
  const reader=request.body?.getReader();let length=0;const chunks:Uint8Array[]=[];
  if(!reader)return Response.json({message_code: "unknownFailure"},{status:400});
  let report:unknown;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();return Response.json({message_code: "unknownFailure"},{status:400});}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    report=JSON.parse(new TextDecoder().decode(bytes));
  }catch{return Response.json({message_code: "unknownFailure"},{status:400});}
  if(!validReport(report))return Response.json({message_code: "unknownFailure"},{status:400});
  try {
    const {error}=await client.from('freeze_reports').insert({...report,user_id:user.id});
    if(error)return Response.json({message_code: "unknownFailure"},{status:error.code==='P4290'?429:500});
    return Response.json({ok:true});
  }catch{return Response.json({message_code: "unknownFailure"},{status:500});}
}
