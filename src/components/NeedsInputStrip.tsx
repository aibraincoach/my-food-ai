/* eslint-disable @next/next/no-img-element -- Owner-authorized thumbnails bypass paid optimization. */
"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Icon} from "@/components/ui/Icon";
import {smallFeedPhotoUrl} from "@/lib/posts/feed-photo-url";
import {readNeedsInput} from "@/lib/pipeline/needs-input";
import NeedsInputSheet,{type QuestionPost} from "@/components/NeedsInputSheet";
export default function NeedsInputStrip(){
  const [posts,setPosts]=useState<QuestionPost[]>([]),[selected,setSelected]=useState<QuestionPost|null>(null),[error,setError]=useState("");
  useEffect(()=>{
    const db=createClient();let live=true,busy=false;
    let owner: string | null = null, lastQuestions = '';
    let authGeneration = 0;
    let auxiliaryFailed = false;
    let mediaRetryAt = 0, mediaFailures = 0;
    const auth = db.auth.onAuthStateChange((_event, session) => {
      if (owner !== (session?.user.id ?? null)) {
        authGeneration++; owner = session?.user.id ?? null; lastQuestions = ''; auxiliaryFailed = false; mediaRetryAt = 0; mediaFailures = 0;
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
        if (owner !== userId) { owner = userId; lastQuestions = ''; auxiliaryFailed = false; mediaRetryAt = 0; mediaFailures = 0; }
        const {data,error}=await db.from("posts").select("id,eaten_at,status,needs_input,question").eq("user_id",userId).or("status.eq.needs_input,question.not.is.null").is("deleted_at",null).order("created_at",{ascending:false}).abortSignal(AbortSignal.timeout(8000));
        if(error)throw error;
        const questions = (data??[]).flatMap(post => {
          const held = post.status === "needs_input";
          const question = readNeedsInput(held ? post.needs_input : post.question);
          return question ? [{id:post.id,eaten_at:post.eaten_at,needs_input:question,held}] : [];
        });
        const identity = JSON.stringify(questions);
        if(identity === lastQuestions && (!auxiliaryFailed || Date.now()<mediaRetryAt))return;
        const media = questions.length ? await db.from('post_media').select('id,post_id,position').in('post_id',questions.map(post=>post.id)).eq('kind','photo').order('position').abortSignal(AbortSignal.timeout(8000)) : {data:[],error:null};
        const first = new Map<string, string>();
        for(const row of media.data??[])if(!first.has(row.post_id)){
          const url = smallFeedPhotoUrl(userId,row.post_id,row.id);
          if(url)first.set(row.post_id,url);
        }
        // A missing/failed auxiliary read must not hide the questions or become
        // permanent: media may finish arriving after the needs-input update.
        auxiliaryFailed = Boolean(media.error) || questions.some(post=>!first.has(post.id));
        mediaRetryAt = auxiliaryFailed ? Date.now()+Math.min(60000,2000*2**Math.min(mediaFailures++,5)) : 0;
        if (!auxiliaryFailed) mediaFailures = 0;
        if(live&&owner===userId&&generation===authGeneration){
          setPosts(questions.map(post=>({...post,photoUrl:first.get(post.id)??null})));
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
      <span className="min-w-0"><span className="block text-body">{post.needs_input.short==="Clarification needed"?"A question about this meal":post.needs_input.short}</span><span className="block truncate text-meta text-muted">{post.needs_input.short==="No food found"?"Add a caption to log it":post.needs_input.question}</span></span>
    </button>
    <button type="button" aria-label={post.held?"Discard meal":"Dismiss question"} className="flex size-tap items-center justify-center" onClick={async()=>{const response=post.held?await fetch(`/api/posts/${post.id}/discard`,{method:"POST"}):await fetch(`/api/posts/${post.id}/question`,{method:"DELETE"});if(response.ok)remove(post.id);else setError(post.held?"Meal could not be discarded.":"Question could not be dismissed.");}}><Icon name="close"/></button>
  </div>)}{error&&<p role="alert">{error}</p>}{selected&&<NeedsInputSheet post={selected} onClose={()=>setSelected(null)} onAnswered={()=>remove(selected.id)}/>}</>;
}
