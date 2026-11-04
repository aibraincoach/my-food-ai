import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const db = createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const missing = 'width.is.null,height.is.null,width.lt.1,height.lt.1';
// Snapshot the exact missing rows before writes; do not shift a paginated query
// by removing rows from its predicate while it is being read.
const rows = [];
for (let offset = 0; ; offset += 500) {
  const { data, error } = await db.from('post_media').select('id,storage_path')
    .eq('kind', 'photo').or(missing).order('id').range(offset, offset + 499);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 500) break;
}
console.log(`Missing before: ${rows.length}`);
if (!process.argv.includes('--apply')) {
  console.log('Read only. Pass --apply to backfill these rows.');
} else {
  for (const row of rows) {
    const { data, error } = await db.storage.from('media').download(row.storage_path);
    if (error) throw error;
    const meta = await sharp(Buffer.from(await data.arrayBuffer())).metadata();
    let { width, height } = meta;
    if (!width || !height) throw new Error(`No image dimensions: ${row.id}`);
    if (meta.orientation >= 5 && meta.orientation <= 8) [width, height] = [height, width];
    width = Math.max(1, Math.min(4096, width));
    height = Math.max(1, Math.min(4096, height));
    // Do not overwrite dimensions another upload/backfill has since supplied.
    const result = await db.from('post_media').update({ width, height }).eq('id', row.id)
      .eq('kind', 'photo').or(missing).select('id');
    if (result.error) throw result.error;
    if (result.data.length) console.log(`${row.id} ${width} ${height}`);
  }
  const { count, error } = await db.from('post_media').select('id', { count: 'exact', head: true })
    .eq('kind', 'photo').or(missing);
  if (error) throw error;
  console.log(`Missing after: ${count}`);
  if (count !== 0) process.exitCode = 1;
}
