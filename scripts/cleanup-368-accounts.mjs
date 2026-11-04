// node --env-file=.env.local scripts/cleanup-368-accounts.mjs
// Delete only the explicitly designated external-probe accounts; never sends mail.
import {createClient} from '@supabase/supabase-js';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
// Enumerate before deleting so pagination cannot skip users after the list shrinks.
const ids=[];for(let page=1;;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw Error('Account listing failed');for(const u of data.users)if(u.email?.startsWith('clearchoice+mfa368-'))ids.push(u.id);if(data.users.length<1000)break;}
for(const id of ids){const {error}=await admin.auth.admin.deleteUser(id);if(error)throw Error('Probe account removal failed');}
console.log(`Deleted ${ids.length} designated probe accounts.`);
