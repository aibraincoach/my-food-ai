import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #989: an operator re-match of a barcode meal, which has no model comment, failed with "Nutrition summary
// could not be saved." Under 0066 the summary refresh leaves such a meal without a comment and does not fail;
// a meal that has a comment still has it rewritten. The rollback brings the failure back.
test('the summary refresh of a meal with no model comment succeeds, and the rollback restores the old failure',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0066_summary_without_comment.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0066_summary_without_comment.down.sql',import.meta.url),'utf8');
 const input=`begin;
 ${migration}
 create temp table fixture(p uuid,job uuid,expected jsonb) on commit drop;
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();job uuid:=gen_random_uuid();item uuid;expected jsonb;comment uuid;
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'summary-without-comment-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into post_items(post_id,name,source,portion_text,gtin)values(p,'Pocari Sweat 500 ml','user','500 ml','08997035563414')returning id into item;
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values(item,140,0,34,0,'off:08997035563414');
 insert into jobs(id,post_id,kind,status,payload)values(job,p,'recompute','running','{"operator":"rematch"}');
 update posts set active_job_id=job where id=p;
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 insert into fixture values(p,job,expected);

 perform refresh_owned_approximation_summary(p,job,'Consumed: 140 kcal',expected);
 if exists(select 1 from post_comments where post_id=p) then raise exception 'The refresh wrote a comment on a meal that had none';end if;

 insert into post_comments(post_id,author,body)values(p,'model','Consumed: 139 kcal')returning id into comment;
 perform refresh_owned_approximation_summary(p,job,'Consumed: 140 kcal',expected);
 if (select body from post_comments where id=comment)<>'Consumed: 140 kcal' then raise exception 'The operator refresh did not rewrite the existing comment';end if;
 delete from post_comments where id=comment;
 end $test$;
 ${rollback}
 do $down$
 declare f record;failed boolean:=false;
 begin
 select * into f from fixture;
 begin perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 140 kcal',f.expected);
 exception when others then failed:=sqlerrm='Nutrition summary is missing';end;
 if not failed then raise exception 'The rollback did not restore the 0065 refresh';end if;
 end $down$;
 select 'summary-without-comment-ok';rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/summary-without-comment-ok/);
});
