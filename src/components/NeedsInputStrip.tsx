/* eslint-disable @next/next/no-img-element -- Owner-authorized thumbnails bypass paid optimization. */
"use client";
import {useTranslations} from "next-intl";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Icon} from "@/components/ui/Icon";
import {smallFeedPhotoUrl} from "@/lib/posts/feed-photo-url";
import {readNeedsInput} from "@/lib/pipeline/needs-input";
import NeedsInputSheet,{type QuestionPost} from "@/components/NeedsInputSheet";
export default function NeedsInputStrip(){
  const t=useTranslations('feed');
  const [posts,setPosts]=useState<QuestionPost[]>([]),[selected,setSelected]=useState<QuestionPost|null>(null),[errorCode,setErrorCode]=useState<''|'questionsLoadFailed'|'discardFailed'|'dismissFailed'>('');
  useEffect(()=>{
    const db=createClient();let live=true,busy=false;
    let owner: string | null = null, lastQuestions = '';
    let authGeneration = 0;
    let auxiliaryFailed = false;
    let again = false;
    const auth = db.auth.onAuthStateChange((_event, session) => {
      if (owner !== (session?.user.id ?? null)) {
        authGeneration++; owner = session?.user.id ?? null; lastQuestions = ''; auxiliaryFailed = false;
        if (live) { setErrorCode("");setPosts([]);setSelected(null); }
        // A sign-in or an account change starts a read, after this callback has returned.
        queueMicrotask(kick);
      }
    });
    const refresh=async()=>{
      if(busy||document.hidden)return;busy=true;
      const generation = authGeneration;
      try{
        const {data:{session}}=await db.auth.getSession();
        if (!live || generation !== authGeneration) return;
        if(!session){if(live){setPosts([]);}return;}
        const userId = session.user.id;
        if (owner !== userId) { owner = userId; lastQuestions = ''; auxiliaryFailed = false; }
        const {data,error}=await db.from("posts").select("id,eaten_at,status,needs_input,question").eq("user_id",userId).or("status.eq.needs_input,question.not.is.null").is("deleted_at",null).order("created_at",{ascending:false}).abortSignal(AbortSignal.timeout(8000));
        if(!live||generation!==authGeneration||owner!==userId)return;
        if(error)throw error;
        const questions = (data??[]).flatMap(post => {
          const held = post.status === "needs_input";
          let question: ReturnType<typeof readNeedsInput> = null;
          try { question = readNeedsInput(held ? post.needs_input : post.question); } catch { /* One unreadable row must not hide the other questions. */ }
          return question ? [{id:post.id,eaten_at:post.eaten_at,needs_input:question,held}] : [];
        });
        const identity = JSON.stringify(questions);
        setErrorCode("");
        if(identity === lastQuestions && !auxiliaryFailed) return;
        const media = questions.length ? await db.from('post_media').select('id,post_id,position').in('post_id',questions.map(post=>post.id)).eq('kind','photo').order('position').abortSignal(AbortSignal.timeout(8000)) : {data:[],error:null};
        const first = new Map<string, string>();
        for(const row of media.data??[])if(!first.has(row.post_id)){
          const url = smallFeedPhotoUrl(userId,row.post_id,row.id);
          if(url)first.set(row.post_id,url);
        }
        auxiliaryFailed = Boolean(media.error) || questions.some(post=>!first.has(post.id));
        if(live&&owner===userId&&generation===authGeneration){
          setPosts(questions.map(post=>({...post,photoUrl:first.get(post.id)??null})));
          lastQuestions=identity;
        }
      }catch{if(live&&generation===authGeneration)setErrorCode('questionsLoadFailed');}finally{busy=false;if(again&&live){again=false;void refresh();}}
    };
    const kick = () => { if (!live) return; if (busy) again = true; else void refresh(); };
    const visible = () => { if (document.visibilityState === "visible") kick(); };
    const onFocus = () => { kick(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("post-readiness", kick);
    void refresh();
    return()=>{live=false;document.removeEventListener("visibilitychange", visible);window.removeEventListener("focus", onFocus);window.removeEventListener("post-readiness", kick);auth.data.subscription.unsubscribe();};
  },[]);
  const remove=(id:string)=>{setPosts(rows=>rows.filter(row=>row.id!==id));setSelected(null);};
  return <>{posts.map(post=><div key={post.id} className="flex min-h-brand items-center gap-sheet-top border-b border-hairline px-screen-x">
    <button type="button" onClick={()=>setSelected(post)} className="flex min-w-0 flex-1 items-center gap-sheet-top text-left">
      {post.photoUrl?<img crossOrigin="anonymous" src={post.photoUrl} loading="lazy" decoding="async" width={40} height={40} alt="" className="size-tap shrink-0 rounded-thumb object-cover"/>:<span className="size-tap shrink-0 rounded-thumb bg-card"/>}
      <span className="min-w-0"><span className="block text-body">{post.needs_input.short==="Clarification needed"?t('quickQuestion'):t('noFoodFound')}</span><span className="block truncate text-meta text-muted">{post.needs_input.short==="No food found"?t('captionToLog'):post.needs_input.question}</span></span>
    </button>
    <button type="button" aria-label={post.held?t('discardMeal'):t('dismissQuestion')} className="flex size-tap items-center justify-center" onClick={async()=>{const response=post.held?await fetch(`/api/posts/${post.id}/discard`,{method:"POST"}):await fetch(`/api/posts/${post.id}/question`,{method:"DELETE"});if(response.ok){remove(post.id);if(post.held)window.dispatchEvent(new CustomEvent('post-deleted',{detail:{id:post.id}}));}else setErrorCode(post.held?'discardFailed':'dismissFailed');}}><Icon name="close"/></button>
  </div>)}{errorCode&&<p role="alert">{t(errorCode)}</p>}{selected&&<NeedsInputSheet post={selected} onClose={()=>setSelected(null)} onAnswered={()=>remove(selected.id)}/>}</>;
}
