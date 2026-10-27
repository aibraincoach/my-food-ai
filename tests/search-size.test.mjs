import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const migration=name=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');
test('search uses consumed known meals and eaten-time ordering on fresh and installed schemas',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const install=`select to_regclass('public.current_post_items') is not null as installed \\gset
\\if :installed
\\else
${migration('0007_post_items_supersede.sql')}
\\endif
select to_regprocedure('public.search_own_posts(text,timestamp with time zone,timestamp with time zone,text,boolean,boolean,text)') is not null as installed \\gset
\\if :installed
\\else
${migration('0009_posts_search.sql')}
\\endif`;
 const sql=`\\set ON_ERROR_STOP on
begin;set local lock_timeout='5s';set local statement_timeout='30s';
${install}
${install}
do $$ declare u uuid:=gen_random_uuid();p uuid;i uuid;latest uuid;big uuid;begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'search-'||u);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 for k in 1..3 loop
  insert into posts(user_id,status,created_at,eaten_at)values(u,'ready',now()-k*interval '1 day',now()-(k-1)*interval '1 day')returning id into p;
  if k=1 then latest:=p;end if;if k=3 then big:=p;end if;
  insert into post_items(post_id,name,portion_grams)values(p,'meal',200)returning id into i;
  -- Legacy raw calories deliberately wrong; standardized per100g energy must win.
  insert into item_nutrition(post_item_id,calories,micronutrients)values(i,9999,jsonb_build_array(jsonb_build_object('nutrientId',1008,'nutrientName','Energy','unitName','KCAL','value',100*k)));
 end loop;
 -- Most recently inserted is an older eaten meal, with unknown calories.
 insert into posts(user_id,status,created_at,eaten_at)values(u,'ready',now()+interval '1 day',now()-interval '10 day')returning id into p;
 insert into post_items(post_id,name)values(p,'unknown');
 for k in 1..8 loop insert into posts(user_id,status)values(u,case when k%2=0 then 'failed' else 'queued' end);end loop;
 if (select id from search_own_posts(p_latest=>true))<>latest then raise exception 'latest used insertion time';end if;
 if (select count(*) from search_own_posts(p_big=>true))<>1 or not exists(select 1 from search_own_posts(p_big=>true)where id=big) then raise exception 'baseline included unknown/unfinished or legacy calories';end if;
 insert into post_items(post_id,name)values(big,'unknown contribution');
 if exists(select 1 from search_own_posts(p_big=>true)where id=big)then raise exception 'partial total treated as complete';end if;
 if search_consumed_kcal(77,'[{"nutrientId":1008,"nutrientName":"Energy","unitName":"KJ","value":100}]',50)<>11.9503 then raise exception 'kilojoule conversion';end if;
 if search_consumed_kcal(0,'[]',100)<>0 or search_consumed_kcal(null,'[]',100)is not null then raise exception 'zero/unknown mismatch';end if;
end$$;
rollback;`;
 const r=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
