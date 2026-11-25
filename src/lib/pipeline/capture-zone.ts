import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {captureZone} from '@/lib/posts/capture-zone';
import {renderTimeZone} from './render-zone';
export class CaptureZoneConflictError extends Error {
 readonly code='PT409';
 constructor(){super('The capture time zone changed.');this.name='CaptureZoneConflictError';}
}
export class CaptureZoneSaveError extends Error {
 readonly code='PT503';
 constructor(cause:unknown){super('The capture time zone could not be saved.',{cause});this.name='CaptureZoneSaveError';}
}
/** Required metadata, before optional hydration/PNG work. The first zone wins. */
export async function saveCaptureZone(db:SupabaseClient,postId:string,zone:string):Promise<void>{
 let stored:string;
 try{stored=await renderTimeZone(db,postId,zone);}catch(error){throw new CaptureZoneSaveError(error);}
 if(captureZone(stored)!==zone)throw new CaptureZoneConflictError();
}
