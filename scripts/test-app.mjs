// Load local integration configuration without passing --env-file through
// Next's build-worker NODE_OPTIONS (Node rejects that flag there).
import{existsSync}from'node:fs';import{spawn}from'node:child_process';
const file=process.env.TEST_ENV_FILE||'.env.test.local';if(existsSync(file))process.loadEnvFile(file);
let local=false;try{local=['127.0.0.1','localhost','[::1]'].includes(new URL(process.env.APP_URL).hostname);}catch{}
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!local)throw Error('The test app requires a disposable loopback environment. See docs/testing.md.');
const mode=process.argv[2]||'start';if(!['build','start'].includes(mode))throw Error('Use build or start.');
const args=['--import','./tests/fixtures/local-providers.mjs','node_modules/next/dist/bin/next',mode];if(mode==='start')args.push('--hostname','127.0.0.1','--port',new URL(process.env.APP_URL).port);
const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});child.once('error',()=>{process.exitCode=1;});child.once('exit',code=>{process.exitCode=code??1;});for(const signal of['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
