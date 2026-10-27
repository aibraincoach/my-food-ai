import type { SupabaseClient } from '@supabase/supabase-js';
import { ioError } from '../worker/errors';
type Cursor = { id: string; created_at: string };
export type TimelineComment = Cursor & { author: 'user' | 'model'; body: string };
type Progress = Cursor & { payload: Record<string, unknown> };
// Continue until an empty page, including when the server caps pages below our
// requested size. Both columns are immutable and id breaks timestamp ties.
async function readTimeline<T extends Cursor>(client: SupabaseClient, table: string, columns: string, postId: string, progress = false): Promise<T[]> {
 const rows:T[]=[]; let cursor:Cursor|undefined;
 for (;;) {
  let query=client.from(table).select(columns).eq('post_id',postId).order('created_at').order('id').limit(500);
  if(progress)query=query.eq('kind','correct').eq('payload->>correction_applied','true');
  if(cursor)query=query.or(`created_at.gt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`);
  const {data,error,status}=await query;
  if(error)throw ioError('Meal history could not be read.',error,status);
  const page=(data??[]) as unknown as T[];
  if(!page.length)return rows;
  const last=page.at(-1)!;
  if(cursor&&last.id===cursor.id&&last.created_at===cursor.created_at)throw new Error('Meal history cursor did not advance.');
  rows.push(...page);cursor=last;
 }
}
export const readPostComments=(client:SupabaseClient,postId:string)=>readTimeline<TimelineComment>(client,'post_comments','id,author,body,created_at',postId);
export const readCorrectionProgress=(client:SupabaseClient,postId:string)=>readTimeline<Progress>(client,'jobs','id,created_at,payload',postId,true);
