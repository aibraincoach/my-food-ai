// node --env-file=.env.local scripts/tick-cold-probe.mjs --wait-for-deploy [--url <base>] [--bypass-file <private JSON>] [--output <file>]
// Observes deployment identity then samples the explicit cold-process header. Never prints bypass secrets.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf(`--${key}`);return i>=0?args[i+1]:fallback;};
const base=option('url',process.env.APP_URL),output=option('output','uploads/run14/tick.json');
const preview=args.includes('--url'),token=process.env.VERCEL_TOKEN;
let bypass=option('bypass',null);const privateFile=option('bypass-file',null);if(privateFile)bypass=Object.keys(JSON.parse(await readFile(privateFile,'utf8')).protectionBypass??{})[0];
async function latest(){const u=new URL('https://api.vercel.com/v6/deployments');u.searchParams.set('projectId','my-food-ai');u.searchParams.set('limit','20');if(!preview)u.searchParams.set('target','production');const branch=option('branch',null);if(branch)u.searchParams.set('meta-githubCommitRef',branch);const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Deployments API HTTP ${r.status}`);return (await r.json()).deployments?.[0];}
let d=await latest();if(args.includes('--wait-for-deploy')){const previous=d?.uid;console.log(JSON.stringify({waitingAfter:previous}));for(;;){await sleep(5000);try{const next=await latest();if(next?.uid!==previous&&next?.readyState==='READY'){d=next;break;}}catch(error){console.error(error.message);}}}
if(!d||d.readyState!=='READY')throw Error('No READY deployment selected');
const rows=[];for(let i=0;i<3;i++){if(i)await sleep(1000);const started=performance.now();let row;try{const r=await fetch(new URL('/api/jobs/tick',base),{headers:bypass?{'x-vercel-protection-bypass':bypass}:{},signal:AbortSignal.timeout(30000)});await r.arrayBuffer();row={http:r.status,cold:r.headers.get('x-tick-cold'),totalMs:performance.now()-started};}catch{row={error:'Tick failed or timed out',totalMs:performance.now()-started};}rows.push(row);console.log(JSON.stringify(row));}
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify({observedAt:new Date().toISOString(),deployment:d.uid,commit:d.meta?.githubCommitSha,rows},null,2)+'\n');
