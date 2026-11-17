// #1021, #990: for each meal, the calories its card shows, the calories its first model comment states, and its
// day's total, computed and rounded the way the app does (getDays, formatCalories), beside the stored sum of its
// current foods. It only reads. It prints meal prefixes, dates and numbers: no name, caption or comment text.
// Use: node --import tsx scripts/numbers/cards.mjs --zone=Asia/Jakarta <8-character prefix> [...]
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
import { createClient } from '@supabase/supabase-js';
import { getDays, dateInZone, validZone } from '../../src/lib/posts/days.ts';
import { formatCalories } from '../../src/lib/nutrition/totals.ts';

const args = process.argv.slice(2);
const zoneArg = args.find(arg => arg.startsWith('--zone='));
const prefixes = args.filter(arg => !arg.startsWith('--'));
if (!zoneArg || !prefixes.length || prefixes.some(p => !/^[0-9a-f]{8}$/.test(p))) {
  console.error('Use: node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <8-character prefix> [...]');
  process.exit(2);
}
const zone = validZone(zoneArg.slice('--zone='.length));
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const read = result => { if (result.error) throw new Error('A read failed.'); return result.data; };

console.log('meal|day|card_kcal|first_comment_kcal|day_kcal|stored_kcal');
for (const prefix of prefixes) {
  const posts = read(await db.from('posts').select('id,user_id,eaten_at,status')
    .gte('id', `${prefix}-0000-0000-0000-000000000000`).lte('id', `${prefix}-ffff-ffff-ffff-ffffffffffff`).is('deleted_at', null));
  if (posts.length !== 1) { console.log(`${prefix}|${posts.length} meals match|||`); continue; }
  const [post] = posts;
  const day = dateInZone(post.eaten_at, zone);
  const [logged] = await getDays(db, post.user_id, zone, day, day);
  const card = logged?.posts.find(entry => entry.id === post.id);
  const [comment] = read(await db.from('post_comments').select('body').eq('post_id', post.id).eq('author', 'model')
    .is('reverted_at', null).order('created_at', { ascending: true }).limit(1));
  const stated = comment?.body.match(/(\d[\d,]*(?:\.\d+)?)\s*kcal/i)?.[1] ?? '';
  const items = read(await db.from('post_items').select('item_nutrition(calories)').eq('post_id', post.id).is('superseded_at', null));
  const stored = items.reduce((sum, item) => sum + Number([item.item_nutrition].flat()[0]?.calories ?? 0), 0);
  console.log([prefix, day, card ? formatCalories(card.totals.calories) : `not listed (${post.status})`, stated,
    logged ? formatCalories(logged.totals.calories) : '', Math.round(stored * 10) / 10].join('|'));
}
