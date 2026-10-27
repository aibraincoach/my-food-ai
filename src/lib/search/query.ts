import "server-only";
import * as chrono from "chrono-node";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createResponse} from "@/lib/meta/client";
import {searchQueryPrompt,searchQuerySchema} from "@/lib/prompts/spark/search-query";
import {getPostCard,type FeedPost} from "@/lib/posts/feed";

type Query={terms:string[];date_from:string|null;date_to:string|null;meal:string|null;big:boolean;latest_only:boolean};
async function run(db:SupabaseClient,query:Query) {
  const {data,error}=await db.rpc("search_own_posts",{p_terms:query.terms.join(" "),p_from:query.date_from,p_to:query.date_to,p_meal:query.meal,p_big:query.big,p_latest:query.latest_only});
  if(error) throw new Error("Search is unavailable.");
  const posts=await Promise.all((data??[]).map((row:{id:string})=>getPostCard(db,row.id)));
  return posts.filter((post):post is FeedPost=>post!==null);
}
export async function searchPosts(db:SupabaseClient,text:string) {
  const now=new Date();
  const dates=chrono.parse(text,now,{forwardDate:false});
  const first=dates[0];
  let terms=text,from:string|null=null,to:string|null=null;
  if(first) {
    const start=first.start.date();start.setHours(0,0,0,0);
    const end=first.end?.date()??new Date(start);end.setHours(0,0,0,0);end.setDate(end.getDate()+1);
    from=start.toISOString();to=end.toISOString();
    terms=text.slice(0,first.index)+text.slice(first.index+first.text.length);
  }
  terms=terms.replace(/\b(what|did|i|eat|on|at|the|show|me)\b/gi," ").trim();
  const initial=await run(db,{terms:terms?[terms]:[],date_from:from,date_to:to,meal:null,big:false,latest_only:false});
  if(initial.length) return initial;
  const result=await createResponse({model:"muse-spark-1.3",instructions:searchQueryPrompt,input:[{role:"user",content:[{type:"input_text",text:JSON.stringify({query:text,today:now.toISOString()})}]}],text:{format:{type:"json_schema",name:"search_query",schema:searchQuerySchema,strict:true}},max_output_tokens:512});
  if(result.status!=="completed"||!result.outputText) return [];
  const query=JSON.parse(result.outputText) as Query;
  if(!Array.isArray(query.terms)||!query.terms.every(term=>typeof term==="string")||![null,"breakfast","lunch","dinner","snack"].includes(query.meal)||typeof query.big!=="boolean"||typeof query.latest_only!=="boolean") throw new Error("Search query was not understood.");
  for(const date of [query.date_from,query.date_to]) if(date!==null&&(typeof date!=="string"||!Number.isFinite(Date.parse(date)))) throw new Error("Search date was not understood.");
  return run(db,query);
}
