// Install only absent migrations inside the caller's rollback transaction.
// Installed schemas execute the same ownership/data assertions without replaying DDL.
export function absentMigration(sql, name) {
 const check=name.startsWith('0025')?"to_regclass('public.barcode_corrections') is not null":name.startsWith('0026')?"to_regclass('public.saved_meals') is not null":"exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_media' and column_name='not_eaten')";
 return `select ${check} as migration_installed \\gset
\\if :migration_installed
\\else
${sql}
\\endif`;
}
