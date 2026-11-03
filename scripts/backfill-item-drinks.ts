import {execFileSync} from 'node:child_process';
import {createAdminClient} from '../src/lib/supabase/admin';
import {syncItemDrinks} from '../src/lib/intake/drinks-from-items';

// The anti-join is performed in PostgreSQL so API pagination cannot silently
// omit posts. This is the investigation 7j query, selecting distinct post IDs.
const query = `select distinct p.id from current_post_items i join posts p on p.id = i.post_id
where p.status = 'ready' and p.deleted_at is null
  and i.name ~* '(coffee|tea|espresso|cola|coke|pepsi)'
  and not exists (select 1 from intake_logs l where l.post_item_id = i.id)
order by p.id;`;
async function main() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is required.');
  const rows=execFileSync('psql',['-X','-qAt','-d',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1','-c',query],{
    encoding:'utf8',stdio:['ignore','pipe','pipe'],
  }).trim().split('\n').filter(Boolean);
  const admin=createAdminClient();
  let failures=0;
  for (const id of rows) {
    if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Error('Unexpected post ID returned by the database.');
    try {await syncItemDrinks(admin,id);console.log(`${id} ok`);}
    catch (error) {failures++;console.log(`${id} error ${error instanceof Error?error.message:'Drink records could not be saved.'}`);}
  }
  // A name match can also be a tile post or a food such as steak. Expose
  // remaining query matches instead of reporting a completed backfill falsely.
  const remaining=execFileSync('psql',['-X','-qAt','-d',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1','-c',query],{
    encoding:'utf8',stdio:['ignore','pipe','pipe'],
  }).trim().split('\n').filter(Boolean);
  for (const id of remaining) {
    failures++;
    console.log(`${id} error No item-linked intake after synchronization; review existing tile intake and food classification.`);
  }
  if (failures) process.exitCode=1;
}
void main().catch(()=>{console.error('Drink backfill could not finish; check database connectivity and server credentials.');process.exitCode=1;});
