'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {DeletedPost} from '@/lib/posts/deleted';
export default function DeletedPosts({posts}:{posts:DeletedPost[]}){
 const router=useRouter();const [restored,setRestored]=useState<string[]>([]),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
 const shown=posts.filter(post=>!restored.includes(post.id));
 async function restore(id:string){setBusy(id);setError('');try{const result=await fetch(`/api/posts/${id}/restore`,{method:'POST'});if(!result.ok)throw Error('The post could not be restored.');setRestored(old=>[...old,id]);window.dispatchEvent(new CustomEvent('post-restore',{detail:{id}}));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'The post could not be restored.');}finally{setBusy(null);}}
 return <>{error&&<p role="alert" className="text-detail text-muted">{error}</p>}{shown.length?<ul>{shown.map(post=><li key={post.id} className="flex items-center gap-3 border-b border-hairline py-3">{post.thumbnail?
 // eslint-disable-next-line @next/next/no-img-element
 <img src={post.thumbnail} alt="" width={56} height={56} className="size-14 rounded-field object-cover"/>:<div aria-hidden="true" className="size-14 shrink-0 rounded-field bg-field"/>}<div className="min-w-0 flex-1"><p className="truncate text-detail">{post.caption||'Meal'}</p><time dateTime={post.eaten_at} className="text-meta text-muted">{new Date(post.eaten_at).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})}</time></div><button type="button" disabled={busy!==null} onClick={()=>void restore(post.id)} className="min-h-tap px-2 text-detail font-semibold disabled:opacity-50">{busy===post.id?'Restoring…':'Restore'}</button></li>)}</ul>:<p className="text-detail text-muted">No recently deleted posts.</p>}</>;
}
