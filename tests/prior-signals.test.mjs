import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('candidate SQL distinguishes absent signals from genuine mismatches',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const migrations=[['0006_post_locations.sql',"to_regclass('public.post_locations')"],['0010_post_media_phash.sql',"to_regprocedure('public.meal_prior_candidates(uuid)')"]].map(([name,probe])=>
   `select ${probe} is not null as installed \\gset
\\if :installed
\\else
${readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')}
\\endif`).join('\n');
 const sql=`\\set ON_ERROR_STOP on
begin;set local lock_timeout='5s';set local statement_timeout='30s';
${migrations}
-- Repeat setup inside the same rollback to exercise already-installed schemas.
${migrations}
do $t$ declare u uuid:=gen_random_uuid();c uuid;p uuid;r record;begin
insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'prior-'||u);
insert into posts(user_id,caption,status)values(u,'','queued')returning id into c;
insert into posts(user_id,caption,status)values(u,'','ready')returning id into p;
insert into post_media(post_id,storage_path,phash)values(c,'fixture-current',42),(p,'fixture-past',42);
select * into r from meal_prior_candidates(c);
if r.text_score is not null or r.photo_score<>1 or r.distance_m is not null then raise exception 'captionless signal availability wrong';end if;
update post_media set phash=null where post_id=c;
select * into r from meal_prior_candidates(c);
if r.photo_score is not null then raise exception 'absent photo interpreted as mismatch';end if;
update posts set caption=case when id=c then 'rice' else 'beans' end where id in(c,p);
select * into r from meal_prior_candidates(c);
if r.text_score is null then raise exception 'present mismatched text discarded';end if;
end;$t$;rollback;`;
 const r=spawnSync('psql',['-X','-q','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
