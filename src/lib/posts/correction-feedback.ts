export function correctionFeedback(status: string, lastAuthor?: string): 'waiting'|'failed'|'idle' {
 if(status==='failed')return 'failed';
 return lastAuthor==='user'&&(status==='queued'||status==='processing')?'waiting':'idle';
}
