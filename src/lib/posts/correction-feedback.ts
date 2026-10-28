export function correctionFeedback(status: string): 'waiting'|'failed'|'idle' {
 if(status==='failed')return 'failed';
 return status==='queued'||status==='processing'?'waiting':'idle';
}
