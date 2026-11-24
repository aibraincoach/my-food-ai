import {captureRouteMessageCode} from '@/lib/posts/capture-route-failure';
import { capUser } from "@/lib/limits/user-cap";
import {traceContext} from "@/lib/trace/context";
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {transcribe} from '@/lib/meta/transcribe';
import {MetaApiError} from '@/lib/meta/client';
import {isUuid} from '@/lib/posts/items';
import {MAX_AUDIO_REQUEST_BYTES,MAX_WAV_BYTES} from '@/lib/audio/limits';
export async function POST(request:Request){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({error:'Sign in to transcribe.',message_code: "route_b37446ca6131"},{status:401});
 const capped = await capUser(user.id, "transcribe"); if (capped) return capped;
 const max=MAX_AUDIO_REQUEST_BYTES;const reader=request.body?.getReader();if(!reader)return NextResponse.json({error:'Audio is required.',message_code: "route_6ea6a8e444f7"},{status:400});
 let form:FormData;
 try{
  const chunks:Uint8Array<ArrayBuffer>[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();return NextResponse.json({error:'Recording is too large.',message_code: "route_860477fccdfe"},{status:413});}chunks.push(new Uint8Array(value));}
  form=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('Content-Type')??''}}).formData();
 }catch{return NextResponse.json({error:'Audio could not be read.',message_code: "route_d90b8fccbd47"},{status:400});}
 const audio=form.get('audio'),draftId=form.get('draftId'),postId=form.get('postId');
 // A caption, drink or search field has no post yet. A comment still names its own post.
 if(postId!==null){
  if(!isUuid(postId))return NextResponse.json({error:'A post is required.',message_code: "route_39fa8eb0ad3c"},{status:400});
  const {data:post}=await client.from('posts').select('id').eq('id',postId).eq('user_id',user.id).maybeSingle();
  if(!post)return NextResponse.json({error:'Post not found.',message_code: "route_9c5ac1fe3dd7"},{status:404});
 }
 if(!(audio instanceof Blob)||!isUuid(draftId)||audio.size<46||audio.size>MAX_WAV_BYTES)return NextResponse.json({error:'Send a WAV recording up to two minutes.',message_code: "route_860d3b3155ad"},{status:400});

 const bytes=await audio.arrayBuffer();const v=new DataView(bytes);const ascii=(start:number,n:number)=>new TextDecoder().decode(new Uint8Array(bytes,start,n));
 if(ascii(0,4)!=='RIFF'||ascii(8,4)!=='WAVE'||ascii(12,4)!=='fmt '||v.getUint32(16,true)!==16||v.getUint16(20,true)!==1||v.getUint16(22,true)!==1||v.getUint32(24,true)!==16000||v.getUint32(28,true)!==32000||v.getUint16(32,true)!==2||v.getUint16(34,true)!==16||ascii(36,4)!=='data'||v.getUint32(40,true)!==audio.size-44||v.getUint32(4,true)!==audio.size-8||(audio.size-44)%2!==0)return NextResponse.json({error:'Recording must be mono 16-bit 16 kHz WAV.',message_code: "route_62ba019bd09f"},{status:400});
 try{return NextResponse.json({transcript:await traceContext.run({postId:typeof postId==='string'?postId:null},()=>transcribe(new Blob([bytes],{type:'audio/wav'}),draftId))});}
 catch(error){return NextResponse.json({error:error instanceof MetaApiError&&error.status===429?'Transcription is busy. Please try again.':'Transcription could not be completed.', message_code: captureRouteMessageCode(error instanceof MetaApiError&&error.status===429?'Transcription is busy. Please try again.':'Transcription could not be completed.')},{status:error instanceof MetaApiError&&error.status===429?429:502});}
}
