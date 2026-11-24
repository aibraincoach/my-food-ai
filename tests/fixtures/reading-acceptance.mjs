// Extends only the core local synthetic fixture; cleanup stays in capture-acceptance.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||[db,url,process.env.APP_URL].some(value=>new URL(value).hostname!=='127.0.0.1'))throw Error('Loopback disposable fixture only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
if(!/^[a-f0-9-]{36}$/.test(f.user)||!/^[a-f0-9-]{36}$/.test(f.post)||!/^text1287-[a-f0-9]+@example.com$/.test(f.email))throw Error('Owned fixture ledger required');
const require=createRequire(import.meta.url),{createClient}=require('@supabase/supabase-js'),sharp=require('sharp');
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owner=await admin.auth.admin.getUserById(f.user);if(owner.data.user?.email!==f.email)throw Error('Fixture ownership mismatch');
const owned=await admin.from('posts').select('user_id').eq('id',f.post).single();if(owned.error||owned.data.user_id!==f.user)throw Error('Fixture meal ownership mismatch');
const sql=query=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8'}).trim();
const mode=process.argv[2]??'extend';
if(mode==='empty'){
 const count=Number(sql("with changed as(update posts set deleted_at=now() where user_id='"+f.user+"' returning id)select count(*) from changed;"));
 if(!Number.isInteger(count)||count<1||count>20)throw Error('Unexpected fixture meal count');
 console.log(JSON.stringify({softDeleted:count,fixtureOnly:true}));
}else if(mode==='extend'){
 if(f.processing||f.media)throw Error('Fixture is already extended; do not repeat setup');
const nutrition=JSON.stringify({calories:180,protein_g:4,carbs_g:42,fat_g:1,fibre_g:1,sugar_g:0,sodium_mg:10,micronutrients:[],gtin:'00016000275683'});
const create=(caption,offset)=>{const post=sql(`select public.create_food_post('${f.user}','2026-11-24T12:${String(offset).padStart(2,'0')}:00Z','${caption}',150,'${nutrition}'::jsonb);`);if(!/^[a-f0-9-]{36}$/.test(post))throw Error('Invalid created fixture ID');return post;};
sql(`update posts set caption='検証用の食事',eaten_at='2026-11-24T12:00:00Z',created_at='2026-11-24T12:00:00Z' where id='${f.post}' and user_id='${f.user}';update post_items set name='検証用のご飯',gtin='00016000275683',box='{"left":80,"top":60,"right":360,"bottom":280}'::jsonb where post_id='${f.post}';`);
f.processing=create('検証用の処理中の食事',1);f.failed=create('検証用の失敗した食事',2);f.question=create('検証用の確認待ちの食事',3);f.noFood=create('検証用の食品なし',4);
const question=JSON.stringify({short:'Clarification needed',question:'これは何の料理ですか？',options:['ご飯','その他']});
const noFood=JSON.stringify({short:'No food found',question:'何を食べましたか？',options:['ご飯']});
sql(`update posts set status='processing',analysis_initialized_at=null where id='${f.processing}';update posts set status='failed',fail_reason='meta: refused',analysis_initialized_at=null where id='${f.failed}';update posts set status='needs_input',needs_input='${question}'::jsonb where id='${f.question}';update posts set status='needs_input',needs_input='${noFood}'::jsonb where id='${f.noFood}';insert into post_comments(post_id,author,body) values('${f.post}','user','検証用コメント'),('${f.post}','model','これは検証用の返信です。');`);
f.media=[];
for(let position=0;position<2;position++){
 const path=f.user+'/'+f.post+'/reading-'+position+'.jpg';
 const bytes=await sharp({create:{width:640,height:480,channels:3,background:position?'#88aa55':'#ddbb88'}}).jpeg().toBuffer();
 for(const key of[path,path.replace('.jpg','.feed.jpg')]){const result=await admin.storage.from('media').upload(key,bytes,{contentType:'image/jpeg',upsert:false});if(result.error)throw result.error;}
 const id=sql(`insert into post_media(post_id,storage_path,position,width,height,kind,not_eaten) values('${f.post}','${path}',${position},640,480,'photo',${position===1}) returning id;`);f.media.push(id);
}
f.saved=sql(`begin;select set_config('request.jwt.claims','{"sub":"${f.user}","role":"authenticated"}',true);select public.save_meal_from_post('${f.post}','検証用の保存した食事');commit;`).split('\n').at(-1);
await fs.writeFile(out+'/fixture-ledger.json',JSON.stringify(f,null,2),{mode:0o600});
console.log(JSON.stringify({extended:true,posts:5,photos:f.media.length,comments:3,storedNamesAreSynthetic:true}));

}else throw Error('Use extend or empty');
