import assert from 'node:assert/strict';
import test from 'node:test';
import {endCurrentSession} from '../src/lib/auth/end-session.ts';

test('sign-out revokes only the current session and keeps other devices signed in',async()=>{
 let options;
 await endCurrentSession({signOut:async o=>{options=o;return{error:null}}});
 assert.deepEqual(options,{scope:'local'});
});
test('SDK authentication errors fail instead of being redirected as success',async()=>{
 await assert.rejects(endCurrentSession({signOut:async()=>({error:{message:'service unavailable'}})}),/could not be ended/);
 await assert.rejects(endCurrentSession({signOut:async()=>{throw Error('network')}}),/network/);
});
