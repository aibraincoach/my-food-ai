// Run: node --import tsx --env-file=.env.local --test tests/delete-post.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/0030_delete_and_remove.sql',import.meta.url),'utf8');
test('removal migration preserves cascade, access boundaries and transactional leftovers reset',()=>{
 assert.match(sql,/intake_logs_post_id_fkey foreign key\(post_id\) references public.posts\(id\) on delete cascade/);
 for(const name of ['delete_post','remove_post_media','revert_correction'])assert.match(sql,new RegExp(`function public\\.${name}\\(`));
 assert.match(sql,/only_reverted_at_changes/);assert.match(sql,/to_jsonb\(new\)-'reverted_at'/);
 assert.match(sql,/auth\.uid\(\) is null then return false/);
 assert.match(sql,/user_id=auth\.uid\(\) for update/);
 assert.match(sql,/current_setting\('mfa.reset_leftovers',true\)='on'/);
 assert.match(sql,/set_config\('mfa.reset_leftovers','on',true\)/);
 assert.match(sql,/removal_rebuilt/);
 assert.match(sql,/revoke all on function public.persist_removed_rebuild[^;]+authenticated/);
});
