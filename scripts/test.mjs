// The complete suite includes SQL/HTTP/worker integration tests. Never let
// its global worker lease, fixture writes or scripted providers reach live data.
import {existsSync,readdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
const envFile=process.env.TEST_ENV_FILE||'.env.test.local';
if(existsSync(envFile))process.loadEnvFile(envFile);
const loopback=new Set(['localhost','127.0.0.1','[::1]']);
for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL','MODEL_API_BASE_URL','TEST_FDC_FIXTURE_URL']){
 let local=false;try{local=loopback.has(new URL(process.env[key]).hostname);}catch{}
 if(!local){console.error(`npm test requires a disposable local ${key}; configure ${envFile}. See docs/testing.md.`);process.exit(1);}
}
if(process.env.MFA_TEST_DISPOSABLE!=='1'){
 console.error('npm test requires MFA_TEST_DISPOSABLE=1 for the isolated test stack. See docs/testing.md.');process.exit(1);
}
const directory=process.argv.includes('--db')?'tests/db':'tests';
const files=readdirSync(directory).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>directory+'/'+name);
const child=spawn(process.execPath,['--import','./tests/fixtures/local-providers.mjs','--import','tsx','--test','--test-concurrency=1',...files],{stdio:'inherit',env:{...process.env,ALLOW_SHARED_DB_TESTS:'1'}});
child.once('error',()=>{console.error('The test runner could not start.');process.exitCode=1;});
child.once('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
