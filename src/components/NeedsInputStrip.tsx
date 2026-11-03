/* eslint-disable @next/next/no-img-element -- Private signed images bypass paid optimization. */
"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Icon} from "@/components/ui/Icon";
import {readNeedsInput} from "@/lib/pipeline/needs-input";
import NeedsInputSheet,{type QuestionPost} from "@/components/NeedsInputSheet";
export default function NeedsInputStrip(){
  const [posts,setPosts]=useState<QuestionPost[]>([]),[selected,setSelected]=useState<QuestionPost|null>(null),[error,setError]=useState("");
  useEffect(()=>{
    const db=createClient();let live=true,busy=false;
    let owner: string | null = null, lastQuestions = '';
    let authGeneration = 0;
    let auxiliaryFailed = false;
    let lastMediaPaths: string[] = [], signRetryAt = 0, signFailures = 0;
    const signed = new Map<string, {url: string; until: number}>();
    const auth = db.auth.onAuthStateChange((_event, session) => {
      if (owner !== (session?.user.id ?? null)) {
        authGeneration++; owner = session?.user.id ?? null; lastQuestions = ''; signed.clear(); auxiliaryFailed = false; lastMediaPaths = []; signRetryAt = 0; signFailures = 0;
        if (live) { setPosts([]); setSelected(null); }
      }
    });
    const refresh=async()=>{
      if(busy||document.hidden)return;busy=true;
      try{
        // The local session supplies the owner filter; every database/storage
        // read still authorizes its bearer token with RLS. No Auth request per tick.
        const generation = authGeneration;
        const {data:{session}}=await db.auth.getSession();
        if (!live || generation !== authGeneration) return;
        if(!session){if(live)setPosts([]);return;}
        const userId = session.user.id;
        if (owner !== userId) { owner = userId; signed.clear(); lastQuestions = ''; }
        const {data,error}=await db.from("posts").select("id,eaten_at,needs_input").eq("user_id",userId).eq("status","needs_input").order("created_at",{ascending:false}).abortSignal(AbortSignal.timeout(8000));
        if(error)throw error;
        const questions = (data??[]).flatMap(post => {
          const question = readNeedsInput(post.needs_input);
          return question ? [{...post,needs_input:question}] : [];
        });
        const identity = JSON.stringify(questions);
        if(identity === lastQuestions && (!auxiliaryFailed && lastMediaPaths.every(path=>(signed.get(path)?.until??0)>Date.now()) || Date.now()<signRetryAt))return;
        const media = questions.length ? await db.from('post_media').select('post_id,storage_path,position').in('post_id',questions.map(post=>post.id)).eq('kind','photo').order('position').abortSignal(AbortSignal.timeout(8000)) : {data:[],error:null};

        const first = new Map<string, string>();
        for(const row of media.data??[])if(!first.has(row.post_id))first.set(row.post_id,`${row.storage_path.replace(/\.[^/.]+$/, '')}.feed.jpg`);
        lastMediaPaths = [...new Set(first.values())];
        const needed = lastMediaPaths.filter(path => (signed.get(path)?.until??0) <= Date.now());
        let signingFailed = Boolean(media.error);
        if(needed.length){
          // Storage SDK batching has no per-call abort option. Its documented
          // signing endpoint is a read; use fetch so the request really cancels.
          try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/media`, {
            method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,Authorization:`Bearer ${session.access_token}`},
            body:JSON.stringify({paths:needed,expiresIn:3600}),signal:AbortSignal.timeout(8000),
          });
          if (!response.ok) signingFailed = true;
          if(response.ok){
            const rows=await response.json() as {path:string;signedURL?:string;error?:string|null}[];
            for(const row of rows)if(!row.error&&row.signedURL)signed.set(row.path,{url:`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1${row.signedURL}`,until:Date.now()+300000});
          }
          } catch { signingFailed = true; }
          signingFailed ||= needed.some(path=>(signed.get(path)?.until??0)<=Date.now());
        }
        auxiliaryFailed = signingFailed;
        signRetryAt = signingFailed ? Date.now()+Math.min(60000,2000*2**Math.min(signFailures++,5)) : 0;
        if (!signingFailed) signFailures = 0;
        if(live&&owner===userId&&generation===authGeneration){
          setPosts(questions.map(post=>{const photo=signed.get(first.get(post.id)??'');return {...post,photoUrl:photo&&photo.until>Date.now()?photo.url:null};}));
          lastQuestions=identity;
        }
      }catch{/* Keep last good questions; the next visible tick retries a failed read. */}finally{busy=false;}
    };
    void refresh();const timer=setInterval(()=>{void refresh();},2000);
    return()=>{live=false;clearInterval(timer);auth.data.subscription.unsubscribe();};
  },[]);
  const remove=(id:string)=>{setPosts(rows=>rows.filter(row=>row.id!==id));setSelected(null);};
  return <>{posts.map(post=><div key={post.id} className="flex min-h-brand items-center gap-sheet-top border-b border-hairline px-screen-x">
    <button type="button" onClick={()=>setSelected(post)} className="flex min-w-0 flex-1 items-center gap-sheet-top text-left">
      {post.photoUrl?<img crossOrigin="anonymous" src={post.photoUrl} loading="lazy" decoding="async" width={40} height={40} alt="" className="size-tap shrink-0 rounded-thumb object-cover"/>:<span className="size-tap shrink-0 rounded-thumb bg-card"/>}
      <span className="min-w-0"><span className="block text-body">{post.needs_input.short}</span><span className="block truncate text-meta text-muted">{post.needs_input.short==="No food found"?"Add a caption to log it":post.needs_input.question}</span></span>
    </button>
    <button type="button" aria-label="Discard meal" className="flex size-tap items-center justify-center" onClick={async()=>{const response=await fetch(`/api/posts/${post.id}/discard`,{method:"POST"});if(response.ok)remove(post.id);else setError("Meal could not be discarded.");}}><Icon name="close"/></button>
  </div>)}{error&&<p role="alert">{error}</p>}{selected&&<NeedsInputSheet post={selected} onClose={()=>setSelected(null)} onAnswered={()=>remove(selected.id)}/>}</>;
}
