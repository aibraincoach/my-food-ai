"use client";
import {useRef,useState} from "react";
import type {FeedPost} from "@/lib/posts/feed";
import {Icon} from "@/components/ui/Icon";
import PostCard from "@/components/PostCard";
import AnalysisBlock from "@/components/AnalysisBlock";
export default function SearchBox(){
  const [query,setQuery]=useState("");const [posts,setPosts]=useState<FeedPost[]>([]);const [status,setStatus]=useState("");const current=useRef(0);
  return <><form className="px-screen-x py-sheet-top" onSubmit={async event=>{
    event.preventDefault();const request=++current.current;setStatus("Searching…");
    try{const response=await fetch(`/api/search?q=${encodeURIComponent(query)}`);if(!response.ok)throw new Error();const data=await response.json();if(request===current.current){setPosts(data.posts);setStatus(data.posts.length?"":"No meals found.");}}
    catch{if(request===current.current)setStatus("Search could not be completed.");}
  }}><label className="flex h-tap items-center gap-2 rounded-field bg-field px-field-x"><Icon name="search" className="text-muted"/><input className="min-w-0 flex-1 bg-transparent text-body outline-none" aria-label="Search meals" placeholder="Search meals" value={query} onChange={event=>setQuery(event.target.value)}/></label></form>
  <p className="px-screen-x text-detail text-muted" role="status">{status}</p>
  <div className="flex flex-col gap-card-gap">{posts.map(post=><PostCard key={post.id} post={post} showDate analysis={<AnalysisBlock post={post} initiallyOpen/>}/>)}</div></>;
}
