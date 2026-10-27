import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { signInAsTestUser } from '../../scripts/lib/session.mjs';
import { admin, checked } from './helpers.mjs';

test('post response starts analysis without a manual worker call', {timeout:140000}, async () => {
  assert.ok(process.env.APP_URL, 'APP_URL is required');
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  const cookie = await signInAsTestUser(1);
  let id;
  try {
    const response = await fetch(new URL('/api/posts',process.env.APP_URL),{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({caption:'One boiled egg, 50 grams',shots:[]}),signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200);
    id = (await response.json()).postId;
    assert.match(id,/^[0-9a-f-]{36}$/i);
    const deadline=Date.now()+120000;
    let status;
    while(Date.now()<deadline) {
      const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:`select status from public.posts where id='${id}'::uuid;`,encoding:'utf8',timeout:10000});
      assert.ifError(result.error); assert.equal(result.status,0,result.stderr);
      status=result.stdout.trim();
      if(status==='ready'||status==='failed') break;
      await new Promise(r=>setTimeout(r,1000));
    }
    assert.equal(status,'ready','post must become ready within 120 seconds');
  } finally { if(id) checked(await admin().from('posts').delete().eq('id',id)); }
});
