import fs from 'node:fs';
export function adminMigrations(){
 const source=process.env.ADMIN_PEOPLE_SQL_SOURCE;
 return 'drop function if exists public.admin_people(text,timestamptz,uuid[],integer,uuid);\ndrop function if exists public.admin_error_code(text);\n'+(source?fs.readFileSync(source,'utf8'):['0079_admin_people.sql','0080_admin_error_summaries.sql'].map(file=>fs.readFileSync('supabase/migrations/'+file,'utf8')).join('\n'));
}
