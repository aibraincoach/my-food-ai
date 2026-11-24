// Seed/reset only tokens belonging to the disposable capture account.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||![db,process.env.APP_URL,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>v&&new URL(v).hostname==='127.0.0.1'))throw Error('Disposable loopback fixture required');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
if(!/^[a-f0-9-]{36}$/.test(f.user)||!/^text1287-[a-f0-9]{8}@example.com$/.test(f.email))throw Error('Owned synthetic account required');
const sql=q=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'}).trim();
if(process.argv[2]==='verify-cleanup'){
 const absent=JSON.parse(sql(`select json_build_object('tokens',(select count(*)from agent_tokens where user_id='${f.user}'),'activity',(select count(*)from agent_activity where user_id='${f.user}'))`));
 if(Object.values(absent).some(Boolean))throw Error('Agent cleanup not zero');
 await fs.writeFile(out+'/agent-cleanup.json',JSON.stringify(absent));console.log(JSON.stringify(absent));
}else{
 if(sql(`select email from auth.users where id='${f.user}'`)!==f.email)throw Error('Owner mismatch');
 sql(`delete from agent_tokens where user_id='${f.user}';insert into agent_tokens(user_id,name,token_hash,token_last4)values('${f.user}','Synthetic agent','${createHash('sha256').update(randomUUID()).digest('hex')}','1234');`);
 console.log('Owned token reset');
}
