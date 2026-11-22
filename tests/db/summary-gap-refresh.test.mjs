import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('a filled gap updates only the current comment, with guards and exact rollback',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(process.env.MFA_TEST_DISPOSABLE==='1'&&url&&['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable migrated local database required');
 const migration=readFileSync(new URL('../../supabase/migrations/0076_summary_gap_refresh.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0076_summary_gap_refresh.down.sql',import.meta.url),'utf8');
 const input=`begin;
 ${rollback}
 create temp table original as select pg_get_functiondef('public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)'::regprocedure) as body;
 create temp table fixture(p uuid,job uuid,expected jsonb,comment uuid,old_comment uuid) on commit drop;
 do $fixture$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();job uuid:=gen_random_uuid();item uuid;expected jsonb;c uuid;old_c uuid;
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'gap-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into post_items(post_id,name,source,portion_text)values(p,'syrup','model','10 g')returning id into item;
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values(item,33,0,8,0,'test:gap');
 insert into jobs(id,post_id,kind,status,payload)values(job,p,'recompute','running','{}');
 update posts set active_job_id=job where id=p;
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 insert into post_comments(post_id,author,body,created_at)values(p,'model','Historical initial comment',now()-interval '1 minute')returning id into old_c;
 insert into post_comments(post_id,author,body)values(p,'model','Consumed: 33 kcal. Nutrition unavailable: syrup.')returning id into c;
 insert into fixture values(p,job,expected,c,old_c);
 perform refresh_owned_approximation_summary(p,job,'Consumed: 33 kcal.',expected);
 if (select body from post_comments where id=c)='Consumed: 33 kcal.' then raise exception 'Base unexpectedly fixed the stale gap';end if;
 end $fixture$;
 ${migration}
 do $green$
 declare f record;refused boolean:=false;
 begin
 select * into f from fixture;
 perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 33 kcal.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Consumed: 33 kcal.' then raise exception 'Filled gap did not refresh';end if;
 if (select body from post_comments where id=f.old_comment)<>'Historical initial comment' then raise exception 'History rewritten';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 34 kcal.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Consumed: 33 kcal.' then raise exception 'Unmarked summary changed';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 33 kcal. Missing fat for syrup.',f.expected);
 if (select body from post_comments where id=f.comment) not like '%Missing fat for syrup.' then raise exception 'New macro gap missing';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 33 kcal.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Consumed: 33 kcal.' then raise exception 'New macro gap not cleared';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Calories unavailable for syrup.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Calories unavailable for syrup.' then raise exception 'New calorie gap missing';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Nutrition unavailable for syrup.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Nutrition unavailable for syrup.' then raise exception 'Whole-food gap missing';end if;
 perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 33 kcal.',f.expected);
 if (select body from post_comments where id=f.comment)<>'Consumed: 33 kcal.' then raise exception 'Whole-food gap not cleared';end if;
 begin perform refresh_owned_approximation_summary(f.p,gen_random_uuid(),'BAD',f.expected);exception when sqlstate 'PT409' then refused:=true;end;
 if not refused then raise exception 'Foreign job accepted';end if;
 refused:=false;
 begin perform refresh_owned_approximation_summary(f.p,f.job,'BAD','[]');exception when sqlstate 'PT409' then refused:=true;end;
 if not refused then raise exception 'Changed items accepted';end if;
 end $green$;
 ${rollback}
 do $down$ begin
 if (select body from original)<>pg_get_functiondef('public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)'::regprocedure) then raise exception 'Rollback differs';end if;
 end $down$;
 ${migration}
 select 'gap-refresh-red-green-rollback-ok';rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:30000});
 assert.match(output,/gap-refresh-red-green-rollback-ok/);
});
