// Read-only six-hour Management API memory/pool series. No identities or secrets are emitted.
// node --env-file=.env.local scripts/fleet14-metrics.mjs [--samples=7] [--interval-ms=3600000] [--output=uploads/run14/metrics.json]
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const arg=(key,fallback)=>process.argv.find(x=>x.startsWith(`--${key}=`))?.split('=').slice(1).join('=')??fallback;
const samples=Number(arg('samples','7')), interval=Number(arg('interval-ms','3600000')),output=arg('output','uploads/run14/metrics.json');
if(!Number.isInteger(samples)||samples<1||!Number.isFinite(interval)||interval<1)throw Error('Invalid sample configuration');
const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const headers={Authorization:`Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`};
const rows=[];const started=Date.now();await mkdir(dirname(output),{recursive:true});
for(let i=0;i<samples;i++){
 await sleep(Math.max(0,started+i*interval-Date.now()));
 const row={observedAt:new Date().toISOString()};
 try{const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/analytics/endpoints/metrics`,{headers,signal:AbortSignal.timeout(30000)});row.http=r.status;const body=await r.text();if(r.ok)row.series=body.split('\n').filter(s=>/^(node_memory_(MemTotal|MemAvailable|Cached|Active_file)_bytes|pgbouncer_pools_)/.test(s));else row.error='Metrics endpoint refused request';}catch{row.error='Metrics request failed or timed out';}
 rows.push(row);await writeFile(output,JSON.stringify({startedAt:new Date(started).toISOString(),intervalMs:interval,rows},null,2)+'\n',{mode:0o600});console.log(JSON.stringify(row));
}
