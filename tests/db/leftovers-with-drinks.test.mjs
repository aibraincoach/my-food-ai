import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #684: a meal whose iced tea wrote a caffeine row (source 'item') refused every leftovers photo with "Drink amounts
// were recorded when posted". Under 0067 only a drink typed in the drink sheet refuses a photo; the rollback restores 0027.
test('a leftovers photo is refused only for a drink typed in the drink sheet, and the rollback restores the old refusal',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0067_leftovers_with_drinks.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0067_leftovers_with_drinks.down.sql',import.meta.url),'utf8');
 // No photo is staged, so a call that passes the drink check stops at the next check, "Photo stage expired".
 const input=`begin;
 ${migration}
 create function public.__refusal(p uuid,u uuid) returns text language plpgsql as $f$
 begin perform public.prepare_post_photo_attachment(p,u,u::text||'/'||gen_random_uuid()::text||'/0.jpg',true);return null;
 exception when others then return sqlerrm;end $f$;
 create temp table fixture(u uuid,tea uuid,sheet uuid) on commit drop;
 do $test$
 declare u uuid:=gen_random_uuid();tea uuid:=gen_random_uuid();sheet uuid:=gen_random_uuid();item uuid;
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'leftovers-drinks-'||u);
 insert into posts(id,user_id,status)values(tea,u,'ready'),(sheet,u,'ready');
 insert into post_items(post_id,name,source,portion_grams,portion_text)values(tea,'iced tea','model',350,'1 glass')returning id into item;
 insert into intake_logs(user_id,post_id,kind,amount,source,post_item_id)values(u,tea,'caffeine',63,'item',item);
 insert into intake_logs(user_id,post_id,kind,amount,ml,source)values(u,sheet,'water',250,250,'sheet');
 insert into fixture values(u,tea,sheet);
 end $test$;
 select 'item:'||coalesce(public.__refusal(tea,u),'none') from fixture;
 select 'sheet:'||coalesce(public.__refusal(sheet,u),'none') from fixture;
 ${rollback}
 select 'rolled-back-item:'||coalesce(public.__refusal(tea,u),'none') from fixture;
 rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/^item:Photo stage expired$/m,'a meal with only item drink rows passes the drink check');
 assert.match(output,/^sheet:Drink amounts were recorded when posted$/m,'a drink-sheet meal is still refused');
 assert.match(output,/^rolled-back-item:Drink amounts were recorded when posted$/m,'the rollback restores the 0027 refusal');
});
