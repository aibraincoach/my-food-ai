"use client";
import {useEffect,useRef,useState} from "react";
import type {FeedPost} from "@/lib/posts/feed";
import {tokens} from "@/lib/theme/tokens";
import {Icon} from "@/components/ui/Icon";
import Link from "next/link";
import {summaryLine} from "@/lib/posts/summary-line";
import PostCard from "@/components/PostCard";
export default function SearchBox(){
  const [query,setQuery]=useState("");const [posts,setPosts]=useState<FeedPost[]>([]);const [status,setStatus]=useState("");const [truncated,setTruncated]=useState(false);const current=useRef(0);
  const field=useRef<HTMLInputElement>(null);const results=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(new URLSearchParams(window.location.search).has('focus'))field.current?.focus();},[]);
  return <><form className="px-screen-x pt-tooltip-offset pb-sheet-top" onSubmit={async event=>{
    event.preventDefault();const request=++current.current;setStatus("Searching…");setPosts([]);setTruncated(false);
    try{const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;const response=await fetch(`/api/search?q=${encodeURIComponent(query)}&tz=${encodeURIComponent(zone)}`);if(!response.ok)throw new Error();const data=await response.json();if(request===current.current){setPosts(data.posts);setTruncated(Boolean(data.truncated));setStatus(data.posts.length?"":"No meals found.");}}
    catch{if(request===current.current)setStatus("Search could not be completed.");}
  }}><label className="desktop:focus-within:ring-2 desktop:focus-within:ring-text flex h-tap items-center gap-tooltip-y rounded-field bg-field px-tooltip-x"><Icon name="search" size={tokens.spacing["icon-small"]+tokens.spacing.grid} className="text-muted"/><input ref={field} onKeyDown={event=>{if(!matchMedia("(min-width:1024px)").matches)return;if(event.key==="Escape"){event.preventDefault();if(query){current.current++;setQuery("");setPosts([]);setStatus("");}else field.current?.blur();}if(event.key==="ArrowDown"){event.preventDefault();results.current?.querySelector<HTMLAnchorElement>("a")?.focus();}}} className="min-w-0 flex-1 bg-transparent text-body outline-none" aria-label="Search meals" placeholder="Search meals" value={query} onChange={event=>setQuery(event.target.value)}/></label></form>
  <p className="px-screen-x text-detail text-muted" role="status">{status}</p>
  <p className="hidden px-screen-x pb-3 text-detail text-muted desktop:block">{posts.length} {posts.length===1?'post':'posts'}</p>
  <div className="desktop:hidden flex flex-col gap-card-gap">{posts.map(post=><PostCard key={post.id} post={post} showDate/>)}</div>
  <div ref={results} className="hidden desktop:flex desktop:flex-col desktop:gap-4" onKeyDown={event=>{
    const links=Array.from(results.current?.querySelectorAll<HTMLAnchorElement>('a')??[]);const index=links.indexOf(document.activeElement as HTMLAnchorElement);
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();links[Math.max(0,Math.min(links.length-1,index+(event.key==='ArrowDown'?1:-1)))]?.focus();}
    if(event.key==='Escape'){event.preventDefault();field.current?.focus();}
  }}>{posts.map(post=><Link key={post.id} data-desktop-post={post.id} href={`/posts/${post.id}`} className="flex min-h-[140px] gap-4 rounded-card outline-offset-2 focus-visible:outline-2 focus-visible:outline-text">
    {post.photoUrl?<img src={post.photoUrl} alt={post.caption||'Meal'} className="size-[140px] shrink-0 rounded-card object-cover"/>:<div className="size-[140px] shrink-0 rounded-card bg-card"/>}
    <div className="min-w-0 py-2"><p className="text-body font-semibold">{post.caption||'Meal'}</p><p className="mt-1 text-meta text-muted">{new Date(post.eaten_at).toLocaleDateString()}</p><p className="mt-3 text-detail text-muted">{post.items.map(item=>item.name).join(' · ')}</p><p className="mt-2 text-detail">{summaryLine(post)}</p></div>
  </Link>)}</div>
  {truncated?<p className="px-screen-x pt-sheet-top text-detail text-muted" role="status">Showing the most recently eaten matches. Narrow the search to see older ones.</p>:null}</>;
}
