// Extend only the disposable capture account with dated calendar meals.
import fs from 'node:fs/promises';import{execFileSync}from'node:child_process';
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||![db,process.env.APP_URL,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>v&&new URL(v).hostname==='127.0.0.1'))throw Error('Disposable loopback fixture required');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
if(!/^[a-f0-9-]{36}$/.test(f.user)||!/^text1287-[a-f0-9]{8}@example.com$/.test(f.email))throw Error('Owned fixture required');
const sql=q=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'}).trim();
if(sql(`select email from auth.users where id='${f.user}'`)!==f.email)throw Error('Fixture ownership mismatch');
const mode=process.argv[2];if(!['short','history'].includes(mode)||f.calendarPosts)throw Error('Choose a fresh short/history fixture');
f.calendarToday=new Date().toISOString().slice(0,10);f.calendarPosts=[];
sql(`update posts set eaten_at='${f.calendarToday}T12:00:00Z',created_at='${f.calendarToday}T12:00:00Z' where id='${f.post}' and user_id='${f.user}'`);
const dates=Array.from({length:mode==='short'?1:5},(_,index)=>{const date=new Date(f.calendarToday+'T12:00:00Z');date.setUTCDate(15);date.setUTCMonth(date.getUTCMonth()-index-1);return date.toISOString().slice(0,10);});
for(const date of dates){
 const id=sql(`select public.create_food_post('${f.user}','${date}T12:00:00Z','Calendar fixture',150,'{"calories":180,"protein_g":4,"carbs_g":42,"fat_g":0,"micronutrients":[]}'::jsonb)`);if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid owned post ID');f.calendarPosts.push(id);await fs.writeFile(out+'/fixture-ledger.json',JSON.stringify(f),{mode:0o600});
 sql(`update posts set status='ready',created_at=eaten_at where id='${id}' and user_id='${f.user}'`);
}
await fs.writeFile(out+'/fixture-ledger.json',JSON.stringify(f),{mode:0o600});console.log(JSON.stringify({calendar:mode,meals:f.calendarPosts.length+1,today:f.calendarToday}));
