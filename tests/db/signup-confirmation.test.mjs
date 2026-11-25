import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {admin,checked} from './helpers.mjs';
const localBackend=['localhost','127.0.0.1'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'https://invalid').hostname);
const localConfirmation=localBackend&&process.env.MFA_TEST_DISPOSABLE==='1'&&Boolean(process.env.TEST_MAILPIT_URL)&&new URL(process.env.TEST_MAILPIT_URL).hostname==='127.0.0.1';
test('confirmation-on existing-email signup cannot plant pending metadata or replace a profile',{skip:!localConfirmation},async()=>{
 const db=admin(),tag=randomUUID().slice(0,8),email='plant_'+tag+'@example.com',password='Local-'+randomUUID()+'!',metadata={pending_handle:'original_'+tag,other:'keep'},handle='existing_'+tag;
 const user=checked(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:metadata})).user;
 try{
  checked(await db.from('profiles').insert({id:user.id,handle}));
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
  const result=await client.auth.signUp({email,password,options:{data:{pending_handle:'planted_'+tag},emailRedirectTo:process.env.APP_URL+'/auth/callback'}});
  assert.equal(result.error,null);assert.equal(result.data.session,null);assert.notEqual(result.data.user.id,user.id);
  assert.deepEqual(checked(await db.auth.admin.getUserById(user.id)).user.user_metadata,user.user_metadata);
  assert.equal(checked(await db.from('profiles').select('handle').eq('id',user.id).single()).handle,handle);
 }finally{checked(await db.auth.admin.deleteUser(user.id));assert.equal(checked(await db.from('profiles').select('id').eq('id',user.id)).length,0);}
});
