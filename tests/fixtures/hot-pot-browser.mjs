// Synthetic rows only; capture-acceptance owns the account and final cleanup.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {sharedNutrition} from '../../src/lib/nutrition/hot-pot.ts';
const out=process.env.CAPTURE_CHECK_OUT,db=process.env.TEST_SQL_DATABASE_URL,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||[db,url,process.env.APP_URL].some(v=>new URL(v).hostname!=='127.0.0.1'))throw Error('Disposable loopback only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
if(!/^text1287-[a-f0-9]+@example.com$/.test(f.email)||!/^[a-f0-9-]{36}$/.test(f.user)||f.hotPotPosts)throw Error('Owned fresh fixture required');
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owner=await admin.auth.admin.getUserById(f.user);if(owner.data.user?.email!==f.email)throw Error('Wrong owner');
const sql=query=>execFileSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8'}).trim();
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
f.hotPotPosts=[];f.hotPotDay=new Date().toISOString().slice(0,10);
for(let i=0;i<6;i++){
 const id=randomUUID();f.hotPotPosts.push(id);
 sql(`insert into posts(id,user_id,eaten_at,caption,status,analysis_initialized_at)values(${q(id)},${q(f.user)},${q(f.hotPotDay+'T12:'+String(i*3).padStart(2,'0')+':00Z')},'Synthetic shabu hot pot','ready',now());`);
 for(const [name,portion,grams,nutrition] of [
  ['Synthetic pork and rice','Synthetic portion',300,{calories:700,protein_g:30,carbs_g:100,fat_g:20,fibre_g:2,sugar_g:0,sodium_mg:20,micronutrients:[],source_ref:'user:fixture'}],
  ['Broth','100 g',100,sharedNutrition('broth',{calories:40,source_ref:'synthetic-broth'})],
  ['Shabu sauce','30 g',30,sharedNutrition('sauce',{calories:90,source_ref:'synthetic-sauce'})],
  ['Dipping sauce','20 g',20,sharedNutrition('sauce',{calories:60,source_ref:'synthetic-dipping'})],
 ]){
  const item=randomUUID();sql(`insert into post_items(id,post_id,name,source,portion_text,portion_grams)values(${q(item)},${q(id)},${q(name)},'model',${q(portion)},${grams});`);
  const result=await admin.from('item_nutrition').insert({post_item_id:item,...nutrition});if(result.error)throw result.error;
 }
}
await fs.writeFile(out+'/fixture-ledger.json',JSON.stringify(f,null,2),{mode:0o600});
console.log(JSON.stringify({syntheticPosts:6,sharedRows:18,syntheticHotPotKcal:4200}));
