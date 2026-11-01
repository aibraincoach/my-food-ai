import schema from '@/lib/prompts/spark/remainder.schema.json';
import {remainderPrompt} from '@/lib/prompts/spark/remainder';
import {createResponseRetrying404} from '@/lib/meta/retry404';
import {MetaApiError} from '@/lib/meta/client';
import type {RemainderEstimate} from '@/lib/pipeline/remainder-rule';
export interface RemainderInput {index:number;name:string;grams:number}
export async function readRemainder(photo:Uint8Array,items:RemainderInput[]):Promise<RemainderEstimate[]> {
 const out=await createResponseRetrying404({model:'muse-spark-1.3',reasoning:{effort:'low'},instructions:remainderPrompt,input:[{type:'message',role:'user',content:[{type:'input_text',text:items.map(item=>`${item.index} · ${item.name} · ${item.grams} grams`).join('\n')},{type:'input_image',image_url:`data:image/jpeg;base64,${Buffer.from(photo).toString('base64')}`}]}],text:{format:{type:'json_schema',name:'remainder',strict:true,schema}},max_output_tokens:4096});
 if(out.status!=='completed'||!out.outputText||out.refusal)throw new MetaApiError(500,'Not-eaten photo estimate did not finish.');
 let parsed:unknown;try{parsed=JSON.parse(out.outputText);}catch{throw new MetaApiError(500,'Invalid not-eaten photo estimate.');}
 const rows=(parsed as {items?:unknown})?.items;
 if(!Array.isArray(rows)||rows.length!==items.length)throw new MetaApiError(500,'Not-eaten photo omitted an item.');
 const seen=new Set<number>();
 for(const row of rows){
  if(!row||!Number.isInteger(row.index)||!items.some(item=>item.index===row.index)||seen.has(row.index)||typeof row.remaining_grams!=='number'||!Number.isFinite(row.remaining_grams)||row.remaining_grams<0||row.remaining_grams>(items.find(item=>item.index===row.index)?.grams??0)
   ||!(row.total_count===null||(Number.isInteger(row.total_count)&&row.total_count>0))||!(row.remaining_count===null||(Number.isInteger(row.remaining_count)&&row.remaining_count>=0))||!(row.unit===null||(typeof row.unit==='string'&&row.unit.trim().length>0&&row.unit.length<=32))
   ||(row.total_count!==null&&row.remaining_count!==null&&row.remaining_count>row.total_count))throw new MetaApiError(500,'Invalid not-eaten photo item.');
  seen.add(row.index);
 }
 return rows as RemainderEstimate[];
}
