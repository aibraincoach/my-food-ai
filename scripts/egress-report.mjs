// node --env-file=.env.local scripts/egress-report.mjs
// Read-only Management API aggregate queries. Never writes account data or prints tokens/IDs.
import {writeFile} from 'node:fs/promises';
const option=(name,fallback)=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const end=option('end',new Date().toISOString());
const start=option('start',new Date(Date.parse(end)-86400000).toISOString());
if(!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(start)>=Date.parse(end))throw new Error('Invalid observation window');
const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token)throw new Error('SUPABASE_ACCESS_TOKEN is required');
const api=`https://api.supabase.com/v1/projects/${ref}/analytics/endpoints/`;
async function query(endpoint,sql){
 const url=new URL(endpoint,api);url.searchParams.set('sql',sql);url.searchParams.set('iso_timestamp_start',start);url.searchParams.set('iso_timestamp_end',end);
 const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.error)throw new Error(`log API unavailable (HTTP ${response.status}${body.error?'; query rejected':''})`);
 return Array.isArray(body.result)?body.result:[];
}
const path="log_attributes['request.path']";
const agent="log_attributes['request.headers.user_agent']";
const bytes="toUInt64OrZero(log_attributes['response.headers.content_length'])";
// Keep aggregates coarse: no object/account ids, URL queries, IPs or raw agents.
const prefix=`multiIf(startsWith(${path},'/storage/v1/object/'),'/storage/v1/object/…',startsWith(${path},'/rest/v1/rpc/'),concat('/rest/v1/rpc/',splitByChar('/',${path})[5]),startsWith(${path},'/rest/v1/'),concat('/rest/v1/',splitByChar('/',${path})[4]),startsWith(${path},'/auth/v1/'),'/auth/v1/…',startsWith(${path},'/realtime/'),'/realtime/…','other')`;
const ua=`multiIf(positionCaseInsensitive(${agent},'pg_net')>0,'pg_net',positionCaseInsensitive(${agent},'Mozilla')>0,'browser',positionCaseInsensitive(${agent},'vercel')>0 OR positionCaseInsensitive(${agent},'node')>0 OR positionCaseInsensitive(${agent},'undici')>0,'server runtime','other/absent')`;
const queries=[
 ['Edge requests by path prefix',`select ${prefix} as path_prefix,count(*) as requests,sum(${bytes}) as response_bytes,countIf(${bytes}=0) as bytes_missing_or_zero from logs where source='edge_logs' group by path_prefix order by response_bytes desc`],
 ['Edge requests by user agent class',`select ${ua} as user_agent,count(*) as requests,sum(${bytes}) as response_bytes,countIf(${bytes}=0) as bytes_missing_or_zero from logs where source='edge_logs' group by user_agent order by response_bytes desc`],
 ['Log rows by source','select source,count(*) as rows from logs group by source order by rows desc'],
];
const escape=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
function table(rows){if(!rows.length)return 'No rows returned.\n';const keys=Object.keys(rows[0]);return `| ${keys.join(' | ')} |\n| ${keys.map(()=> '---').join(' | ')} |\n${rows.map(row=>`| ${keys.map(key=>escape(row[key])).join(' | ')} |`).join('\n')}\n`;}
let md=`# Database egress and log observations\n\n## ${option('label','Before')}\n\nWindow: ${start} through ${end}. Read-only aggregate logs. Response bytes are reported Content-Length, not billed egress; missing lengths are explicitly counted. Log row counts are not ingestion byte totals.\n\n`;
try{await query('logs.all','select count(*) as rows from edge_logs');md+='The legacy endpoint still responds.\n\n';}catch{md+='Legacy log API unavailable: the plan’s `logs.all` endpoint returned an error. The current `/logs` endpoint is used below when available.\n\n';}
for(const [name,sql] of queries){md+=`### ${name}\n\n`;try{md+=table(await query('logs',sql));}catch(error){md+=`${error.message}. No measurement is inferred.\n`;}md+='\n';}
const output=option('output','docs/egress.md');await writeFile(output,md);console.log(`Wrote aggregate observations to ${output}`);
