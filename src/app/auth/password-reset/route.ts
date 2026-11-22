import {NextResponse,type NextRequest} from 'next/server';
import {createServerClient} from '@supabase/ssr';

export async function GET(request:NextRequest){
  const code=request.nextUrl.searchParams.get('code');
  const failed=()=>{
    const response=NextResponse.redirect(new URL('/reset-password?error='+encodeURIComponent('That reset link is invalid or has expired. Request a new link.'),request.url));
    response.headers.set('Cache-Control','private, no-store');
    response.headers.set('Referrer-Policy','no-referrer');
    return response;
  };
  if(!code)return failed();
  const jar:{name:string;value:string;options?:object}[]=[];
  const signal=AbortSignal.timeout(8000);
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    global:{fetch:(input,init)=>fetch(input,{...init,signal})},
    cookies:{getAll:()=>request.cookies.getAll(),setAll:rows=>{jar.push(...rows);}},
  });
  let recovery=false;
  const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
    if(event==='PASSWORD_RECOVERY')recovery=true;
  });
  try{
    const flowId=request.nextUrl.searchParams.get('sb_flow_id');
    const {data,error}=await supabase.auth.exchangeCodeForSession(code,flowId===null?undefined:{flowId});
    if(error||!recovery||!data.user)return failed();
  }catch{return failed();}
  finally{subscription.unsubscribe();}
  const response=NextResponse.redirect(new URL('/new-password',request.url));
  for(const{name,value,options}of jar)response.cookies.set(name,value,options);
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
