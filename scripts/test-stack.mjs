// A disposable PostgreSQL + GoTrue + PostgREST stack and scripted providers.
// Requires PostgreSQL 17 CLI tools and Podman; binds only to loopback.
import{spawn,spawnSync}from'node:child_process';
import{mkdirSync,existsSync,readFileSync,writeFileSync,readdirSync,openSync,closeSync}from'node:fs';
import{randomBytes,createHmac}from'node:crypto';
import path from'node:path';
const envOutput=process.env.TEST_ENV_FILE||'.env.test.local';
const root=process.cwd(),dir=path.resolve(process.env.TEST_STACK_DIR||'uploads/test-stack'),stateFile=path.join(dir,'state.json');
const pgBin=process.env.PG_BIN||'/usr/pgsql-17/bin',dbPort=Number(process.env.TEST_PG_PORT||55449),basePort=Number(process.env.TEST_PORT_BASE||60260);
const names={auth:'mfa-test-auth-'+basePort,rest:'mfa-test-rest-'+basePort};
function run(cmd,args,options={}){const r=spawnSync(cmd,args,{encoding:'utf8',...options});if(r.error||r.status!==0){mkdirSync(dir,{recursive:true});writeFileSync(path.join(dir,'failure.log'),String(r.stderr||r.error));throw Error(`${path.basename(cmd)} failed; inspect ${dir} logs.`);}return r.stdout?.trim();}
function save(state){writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600});}
function stop(){if(!existsSync(stateFile))return;const state=JSON.parse(readFileSync(stateFile));if(state.stopped)return;for(const pid of state.pids??[])try{const command=readFileSync(`/proc/${pid}/cmdline`,'utf8'),environment=readFileSync(`/proc/${pid}/environ`,'utf8');if(command.includes('tests/fixtures/local-')&&environment.split('\0').includes('TEST_STORAGE_DIR='+path.join(dir,'objects')))process.kill(pid,'SIGTERM');}catch{}for(const name of Object.values(state.names??{}))spawnSync('podman',['rm','-f',name],{stdio:'ignore'});if(state.pg)spawnSync(path.join(state.pgBin,'pg_ctl'),['-D',state.pg,'-m','fast','stop'],{stdio:'ignore'});state.stopped=true;save(state);console.log('Disposable test stack stopped.');}
if(process.argv[2]==='down'){stop();process.exit(0);}
if(existsSync(stateFile)&&!JSON.parse(readFileSync(stateFile)).stopped)throw Error('This test stack already exists. Stop it with npm run test:stack -- down first.');
if(existsSync(envOutput))throw Error('Preserve the existing test environment; choose a new TEST_ENV_FILE.');
mkdirSync(dir,{recursive:true});const pg=path.join(dir,'pg');if(existsSync(pg))throw Error('Use a fresh TEST_STACK_DIR; preserved database files are never silently reset.');
const secret=randomBytes(32).toString('hex'),db=`postgres://postgres@127.0.0.1:${dbPort}/postgres?sslmode=disable`,gateway=`http://127.0.0.1:${basePort+6}`;
const state={pg,pgBin,names,pids:[],stopped:false};save(state);
const sql=text=>run('psql',['-X','-qAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:text});
const env={MFA_TEST_DISPOSABLE:'1',APP_URL:`http://127.0.0.1:${basePort}`,NEXT_PUBLIC_SUPABASE_URL:gateway,SUPABASE_DB_URL:db,TEST_SQL_DATABASE_URL:db,MODEL_API_KEY:'local-scripted-key',MODEL_API_BASE_URL:`http://127.0.0.1:${basePort+5}/v1`,FDC_API_KEY:'local-fixture-key',TEST_FDC_FIXTURE_URL:`http://127.0.0.1:${basePort+5}`,TEST_MODEL_PORT:String(basePort+5),TEST_GATEWAY_PORT:String(basePort+6),TEST_REST_PORT:String(basePort+7),TEST_AUTH_PORT:String(basePort+8),TEST_JWT_SECRET:secret,TEST_STORAGE_DIR:path.join(dir,'objects'),ALLOW_SHARED_DB_TESTS:'1'};
function jwt(role){const b=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const data=b({alg:'HS256',typ:'JWT'})+'.'+b({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400});return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');}
function container(name,image,values){const file=path.join(dir,name+'.env');writeFileSync(file,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n'),{mode:0o600});run('podman',['run','-d','--network','host','--name',name,'--env-file',file,image]);}
async function ready(url){for(let i=0;i<100;i++){try{const r=await fetch(url);if(r.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Local service did not become ready.');}
function background(script,extra={}){const fd=openSync(path.join(dir,path.basename(script)+'.log'),'a');const child=spawn(process.execPath,[script],{cwd:root,env:{...process.env,...env,...extra},stdio:['ignore',fd,fd],detached:true});closeSync(fd);child.unref();state.pids.push(child.pid);save(state);return child;}
try{
run(path.join(pgBin,'initdb'),['-D',pg,'-U','postgres','-A','trust','--no-locale']);
run(path.join(pgBin,'pg_ctl'),['-D',pg,'-l',path.join(dir,'postgres.log'),'-o',`-p ${dbPort} -h 127.0.0.1 -k ${dir}`,'start']);
sql('create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;');
// Match Supabase's JWT helper and default grants, before migrations tighten them.
sql(`create function auth.uid()returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
grant usage on schema auth,public to anon,authenticated,service_role;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
create schema storage;create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,metadata jsonb);alter table storage.objects enable row level security;
create function storage.foldername(name text)returns text[]language sql immutable as $$select (string_to_array(name,'/'))[:array_length(string_to_array(name,'/'),1)-1]$$;
grant usage on schema storage to service_role;grant all on all tables in schema storage to service_role;create publication supabase_realtime;
create schema cron;create function cron.schedule(text,text,text)returns bigint language sql as $$select 1::bigint$$;`);
container(names.auth,'docker.io/supabase/gotrue:v2.197.0',{GOTRUE_API_HOST:'127.0.0.1',GOTRUE_API_PORT:basePort+8,API_EXTERNAL_URL:gateway,GOTRUE_SITE_URL:env.APP_URL,GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:db+'&search_path=auth,public',GOTRUE_DB_MIGRATIONS_PATH:'/usr/local/etc/auth/migrations',GOTRUE_JWT_SECRET:secret,GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_ADMIN_ROLES:'service_role',GOTRUE_EXTERNAL_EMAIL_ENABLED:'true',GOTRUE_MAILER_AUTOCONFIRM:'true',GOTRUE_DISABLE_SIGNUP:'false'});
await ready(`http://127.0.0.1:${basePort+8}/health`);
for(const name of readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort()){if(['0024_worker_wake.sql','0055_approximation_once.sql'].includes(name))continue; // 0055 is an explicit reader-first activation, not a bootstrap migration.
 sql(readFileSync('supabase/migrations/'+name,'utf8'));}
container(names.rest,'docker.io/postgrest/postgrest:v14.18',{PGRST_DB_URI:db,PGRST_DB_SCHEMAS:'public',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:secret,PGRST_SERVER_HOST:'127.0.0.1',PGRST_SERVER_PORT:basePort+7});
env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=jwt('anon');env.SUPABASE_SECRET_KEY=jwt('service_role');
background('tests/fixtures/local-gateway.mjs');background('tests/fixtures/local-model.mjs');await ready(gateway+'/auth/v1/health');await ready(`http://127.0.0.1:${basePort+7}/`);
for(const i of[1,2]){const email=`local-test-${i}@example.com`,password=randomBytes(20).toString('hex'),headers={Authorization:'Bearer '+env.SUPABASE_SECRET_KEY,apikey:env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'};const r=await fetch(gateway+'/auth/v1/admin/users',{method:'POST',headers,body:JSON.stringify({email,password,email_confirm:true})});if(!r.ok)throw Error('Disposable user creation failed.');const user=await r.json();const profile=await fetch(gateway+'/rest/v1/profiles',{method:'POST',headers,body:JSON.stringify({id:user.id,handle:'local_test_'+i})});if(!profile.ok)throw Error('Disposable profile creation failed.');const prefix=i===1?'TEST_USER':'TEST_USER2';env[prefix+'_EMAIL']=email;env[prefix+'_PASSWORD']=password;}
writeFileSync(envOutput,Object.entries(env).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});
console.log('Disposable backend ready. Build/start the app using .env.test.local, then run npm test. See docs/testing.md.');
}catch(error){console.error(error.message);stop();process.exitCode=1;}
