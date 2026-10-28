import "server-only";
import {localDate,localDateStart,parseSearchDates,searchZone} from "./dates";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createResponse} from "@/lib/meta/client";
import {searchQueryPrompt,searchQuerySchema} from "@/lib/prompts/spark/search-query";
import {getPostCard,type FeedPost} from "@/lib/posts/feed";
import {hasSemanticOperator,SEARCH_HYDRATE_CONCURRENCY,SEARCH_PAGE_SIZE} from "./operators";

export type SearchResult={posts:FeedPost[];truncated:boolean};

type Query={terms:string[];date_from:string|null;date_to:string|null;meal:string|null;big:boolean;latest_only:boolean};
async function run(db:SupabaseClient,query:Query,zone:string) {
  const {data,error}=await db.rpc("search_own_posts",{p_terms:query.terms.join(" "),p_from:query.date_from,p_to:query.date_to,p_meal:query.meal,p_big:query.big,p_latest:query.latest_only,p_tz:zone});
  if(error) throw new Error("Search is unavailable.");
  const rows=(data??[]) as {id:string}[];
  const page=rows.slice(0,SEARCH_PAGE_SIZE);
  // Hydrate a few cards at a time: each card is several table reads.
  const posts:(FeedPost|null)[]=[];
  for(let start=0;start<page.length;start+=SEARCH_HYDRATE_CONCURRENCY)
    posts.push(...await Promise.all(page.slice(start,start+SEARCH_HYDRATE_CONCURRENCY).map(row=>getPostCard(db,row.id))));
  return {posts:posts.filter((post):post is FeedPost=>post!==null),truncated:rows.length>SEARCH_PAGE_SIZE};
}
export async function searchPosts(db:SupabaseClient,text:string,timeZone?:string):Promise<SearchResult> {
  const now=new Date();
  const zone=searchZone(timeZone);
  const parsed=parseSearchDates(text,zone,now);
  let terms=parsed.terms;
  const from=parsed.from,to=parsed.to;
  terms=terms.replace(/\b(what|did|i|eat|on|at|the|show|me)\b/gi," ").trim();
  // The direct full-text path is only for literal food searches; a question with a meal,
  // size or recency word always goes through the structured interpretation below.
  if(!hasSemanticOperator(text)){
    const initial=await run(db,{terms:terms?[terms]:[],date_from:from,date_to:to,meal:null,big:false,latest_only:false},zone);
    if(initial.posts.length) return initial;
  }
  const result=await createResponse({model:"muse-spark-1.3",instructions:searchQueryPrompt,input:[{role:"user",content:[{type:"input_text",text:JSON.stringify({query:text,today:localDate(now,zone),time_zone:zone})}]}],text:{format:{type:"json_schema",name:"search_query",schema:searchQuerySchema,strict:true}},max_output_tokens:512});
  if(result.status!=="completed"||!result.outputText) return {posts:[],truncated:false};
  const query=JSON.parse(result.outputText) as Query;
  if(!Array.isArray(query.terms)||!query.terms.every(term=>typeof term==="string")||![null,"breakfast","lunch","dinner","snack"].includes(query.meal)||typeof query.big!=="boolean"||typeof query.latest_only!=="boolean") throw new Error("Search query was not understood.");
  for(const date of [query.date_from,query.date_to]) if(date!==null&&(typeof date!=="string"||!Number.isFinite(Date.parse(date)))) throw new Error("Search date was not understood.");
  return run(db,{...query,date_from:query.date_from===null?null:localDateStart(query.date_from,zone),date_to:query.date_to===null?null:localDateStart(query.date_to,zone)},zone);
}
