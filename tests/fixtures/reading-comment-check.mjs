// Exact-ID readback for the two successful local comment actions.
import fs from'node:fs/promises';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(db).hostname!=='127.0.0.1'||!['chromium','webkit'].includes(engine))throw Error('Loopback only');
const receiptName=process.env.COMMENTS_RECEIPT_NAME??engine+'-comments.json';if(!/^(chromium|webkit)-comments[-a-z]*\.json$/.test(receiptName))throw Error('Named reading comment receipt only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json')),r=JSON.parse(await fs.readFile(out+'/'+receiptName));assert.ok(r.pass);assert.equal(r.cases.length,2);
const uuid=value=>/^[a-f0-9-]{36}$/.test(value);assert.ok(uuid(f.user)&&uuid(f.post)&&/^text1287-[a-f0-9]+@example.com$/.test(f.email)&&r.cases.every(c=>uuid(c.id)));
const ids=r.cases.map(c=>"'"+c.id+"'").join(','),rows=JSON.parse(execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:`select coalesce(json_agg(c),'[]') from(select id,body,author from post_comments where id in(${ids}) and post_id='${f.post}' and exists(select1 from posts p join auth.users u on u.id=p.user_id where p.id='${f.post}' and u.id='${f.user}' and u.email='${f.email}'))c;`.replace('select1','select 1'),encoding:'utf8'}));
assert.equal(rows.length,2);for(const c of r.cases){const stored=rows.find(row=>row.id===c.id);assert.equal(stored?.body,c.body);assert.equal(stored.author,'user');assert.equal(c.requests,1);}
await fs.writeFile(out+'/'+receiptName.replace('.json','-db.json'),JSON.stringify({verified:true,count:2,ids:r.cases.map(c=>c.id)},null,2));console.log(JSON.stringify({verified:true,count:2,idPrefixes:r.cases.map(c=>c.id.slice(0,8))}));
