// Server-only adapter for the optional per-account identify provider.
import {fetchWithRetry, MetaApiError, type ResponseOutput} from './client';
import {recordCall} from '@/lib/trace/record';
// shortcut: one 75 s try and then Meta; the slowest trial call took 50.5 s (docs/open-weights.md). Raise it if Baseten's normal latency grows.
const OPEN_IDENTIFY_TIMEOUT_MS = 75_000;
export const openWeightsConfigured = () => Boolean(process.env.IDENTIFY_OPEN_API_KEY);
export function openIdentifyModel():string {
 const model=process.env.IDENTIFY_OPEN_MODEL || 'meta-models/muse-spark-open-1026';
 if(!/^meta-models\/muse-spark-open(?:-[a-z0-9]+)?$/.test(model))throw Error('Open identify requires a Muse Spark Open model.');
 return model;
}
export const openBaseUrl = () => (process.env.IDENTIFY_OPEN_BASE_URL || 'https://inference.baseten.co/v1').replace(/\/$/,'');

export function openRequest(body:Record<string,unknown>,jsonObject=false):Record<string,unknown> {
 const format=(body.text as {format?:Record<string,unknown>})?.format;
 const instructions=String(body.instructions??'')+(jsonObject?`\nReturn only one JSON object that matches this JSON Schema:\n${JSON.stringify(format?.schema)}`:'');
 const input=Array.isArray(body.input)?body.input:[];
 const messages=[{role:'system',content:instructions},...input.map((entry:Record<string,unknown>)=>({role:entry.role??'user',content:Array.isArray(entry.content)?entry.content.map((part:Record<string,unknown>)=>part.type==='input_image'?{type:'image_url',image_url:{url:part.image_url}}:{type:'text',text:part.text}):entry.content}))];
 return {model:openIdentifyModel(),messages,max_tokens:16384,response_format:jsonObject?{type:'json_object'}:{type:'json_schema',json_schema:{name:format?.name??'identify',strict:true,schema:format?.schema}}};
}

export function readOpenResponse(payload:unknown):ResponseOutput {
 const data=payload as {choices?:{finish_reason?:string;message?:{content?:unknown;refusal?:unknown}}[];usage?:{prompt_tokens:number;completion_tokens:number}};
 const choice=data?.choices?.[0],message=choice?.message;
 const content=typeof message?.content==='string'?message.content.replace(/<think>[\s\S]*?<\/think>/gi,'').trim():'';
 const first=content.indexOf('{'),last=content.lastIndexOf('}');
 return {status:choice?.finish_reason==='stop'?'completed':choice?.finish_reason==='length'?'incomplete':'unknown',outputText:first>=0&&last>=first?content.slice(first,last+1):null,outputTextPath:'choices[0].message.content',refusal:Boolean(message?.refusal),usage:data?.usage?{input_tokens:data.usage.prompt_tokens,output_tokens:data.usage.completion_tokens}:null};
}

export async function createOpenResponse(body:Record<string,unknown>,validate?:(out:ResponseOutput)=>void):Promise<ResponseOutput> {
 return recordCall('spark_identify',body,async()=>{
  const key=process.env.IDENTIFY_OPEN_API_KEY;if(!key)throw Error('Open identify is not configured.');
  let response:Response;
  const send=(jsonObject:boolean)=>fetchWithRetry(`${openBaseUrl()}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(openRequest(body,jsonObject))},OPEN_IDENTIFY_TIMEOUT_MS,key,0);
  try {response=await send(false);} catch(error) {
   // Only a structured-format rejection warrants a JSON-object retry.
   if(!(error instanceof MetaApiError)||![400,422].includes(error.status)||!/response_format|json_schema|structured/i.test(error.body))throw error;
   response=await send(true);
  }
  const out=readOpenResponse(await response.json());validate?.(out);return out;
 },out=>({text:out.outputText,usage:out.usage}),{model:process.env.IDENTIFY_OPEN_MODEL || 'meta-models/muse-spark-open-1026',host:'baseten'});
}
