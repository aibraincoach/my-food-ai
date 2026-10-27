import {createClient} from '@supabase/supabase-js';
import {seedWeekDates} from './lib/seed-week-dates.mjs';
// Usage: node --env-file=.env.local scripts/seed-week.mjs --time-zone America/Edmonton
const zoneIndex=process.argv.indexOf('--time-zone');
const seedZone=zoneIndex<0?undefined:process.argv[zoneIndex+1];
const seedDates=seedWeekDates(seedZone);
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ordinary=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const login=await ordinary.auth.signInWithPassword({email:process.env.TEST_USER_EMAIL,password:process.env.TEST_USER_PASSWORD});
if(login.error||!login.data.user)throw new Error('Dedicated test sign-in failed.');
function checked(r){if(r.error)throw new Error(r.error.message);return r.data;}
try{
  for(const date of seedDates){
    const name=date.saturday?'ramen':date.bigBreakfast?'Eggs and toast':'Rice and beans';
    const post=checked(await db.from('posts').insert({user_id:login.data.user.id,caption:name,eaten_at:date.eatenAt,status:'ready'}).select('id').single());
    const item=checked(await db.from('post_items').insert({post_id:post.id,name,portion_grams:250}).select('id').single());
    checked(await db.from('item_nutrition').insert({post_item_id:item.id,calories:date.bigBreakfast?900:350,protein_g:20,carbs_g:40,fat_g:10}));
  }
  console.log(`Seeded seven meals in ${seedZone}; use that timezone for browser search checks.`);
}finally{await ordinary.auth.signOut();}
