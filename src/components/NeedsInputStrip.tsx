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
    const refresh=async()=>{
      if(busy||document.hidden)return;busy=true;
      try{
        const {data:{user}}=await db.auth.getUser();if(!user)return;
        const {data,error}=await db.from("posts").select("id,eaten_at,needs_input").eq("user_id",user.id).eq("status","needs_input").order("created_at",{ascending:false});
        if(error)throw error;
        const rows=await Promise.all((data??[]).map(async post=>{
          const question=readNeedsInput(post.needs_input);if(!question)return null;
          const {data:media}=await db.from("post_media").select("storage_path").eq("post_id",post.id).eq("kind","photo").order("position").limit(1).maybeSingle();
          const signed=media?await db.storage.from("media").createSignedUrl(media.storage_path,3600):null;
          return {...post,needs_input:question,photoUrl:signed?.data?.signedUrl??null};
        }));
        if(live)setPosts(rows.filter((row):row is QuestionPost=>row!==null));
      }catch{/* Keep last good questions during a transient failure. */}finally{busy=false;}
    };
    void refresh();const timer=setInterval(()=>{void refresh();},2000);
    return()=>{live=false;clearInterval(timer);};
  },[]);
  const remove=(id:string)=>{setPosts(rows=>rows.filter(row=>row.id!==id));setSelected(null);};
  return <>{posts.map(post=><div key={post.id} className="flex min-h-brand items-center gap-sheet-top border-b border-hairline px-screen-x">
    <button type="button" onClick={()=>setSelected(post)} className="flex min-w-0 flex-1 items-center gap-sheet-top text-left">
      {post.photoUrl?/* eslint-disable-next-line @next/next/no-img-element */<img src={post.photoUrl} alt="" className="size-tap shrink-0 rounded-thumb object-cover"/>:<span className="size-tap shrink-0 rounded-thumb bg-card"/>}
      <span className="min-w-0"><span className="block text-body">{post.needs_input.short}</span><span className="block truncate text-meta text-muted">{post.needs_input.short==="No food found"?"Add a caption to log it":post.needs_input.question}</span></span>
    </button>
    <button type="button" aria-label="Discard meal" className="flex size-tap items-center justify-center" onClick={async()=>{const response=await fetch(`/api/posts/${post.id}/discard`,{method:"POST"});if(response.ok)remove(post.id);else setError("Meal could not be discarded.");}}><Icon name="close"/></button>
  </div>)}{error&&<p role="alert">{error}</p>}{selected&&<NeedsInputSheet post={selected} onClose={()=>setSelected(null)} onAnswered={()=>remove(selected.id)}/>}</>;
}
