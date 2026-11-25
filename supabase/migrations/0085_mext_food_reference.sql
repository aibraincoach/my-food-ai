-- #1221 file-first preparation. UNAPPLIED: merging does not import or apply.
-- Production apply/import each require RT written yes and the PM's exact order.
begin;
set local lock_timeout = '1s';
set local statement_timeout = '5s';
set local search_path = public, extensions, pg_temp;
create extension if not exists pg_trgm;

create table public.jp_foods (
  food_number text primary key check (food_number ~ '^[0-9]{5}$'),
  name_ja text not null check (length(btrim(name_ja)) > 0),
  food_group text not null check (food_group ~ '^(0[1-9]|1[0-8])$'),
  name_ja_2015 text,
  name_en text,
  name_en_source text check (name_en_source in ('mext-2015-en','mext-2016-supp-en')),
  identity_status text not null check (identity_status in
    ('joined','no_english','group_mismatch','identity_changed','english_name_ambiguous')),
  refuse_percent numeric check (refuse_percent between 0 and 100),
  -- Per 100g edible reference, not stored per-portion item nutrition.
  -- Keys are app nutrient ids. Values retain number/Tr/- and source notation.
  nutrients jsonb not null check (jsonb_typeof(nutrients) = 'object'),
  raw_values jsonb not null check (jsonb_typeof(raw_values) = 'object'),
  source_manifest jsonb not null check (jsonb_typeof(source_manifest) = 'object'),
  record_sha256 text not null check (record_sha256 ~ '^[0-9a-f]{64}$'),
  imported_at timestamptz not null default now(),
  constraint jp_foods_joined_identity check (identity_status <> 'joined' or (
    name_en is not null and name_en ~ '[A-Za-z]' and
    name_ja_2015 is not null and length(btrim(name_ja_2015)) > 0 and
    name_en_source is not null
  ))
);
alter table public.jp_foods enable row level security;
revoke all on public.jp_foods from public, anon, authenticated, service_role;
grant select on public.jp_foods to service_role;
create index jp_foods_name_ja_trgm on public.jp_foods using gin (name_ja gin_trgm_ops)
  where identity_status = 'joined';
create index jp_foods_name_en_trgm on public.jp_foods using gin (name_en gin_trgm_ops)
  where identity_status = 'joined';

-- Candidate retrieval only. The app's unchanged compatibility gates decide.
create function public.search_mext_foods(p_name_ja text, p_name_en text)
returns setof public.jp_foods language sql stable strict security invoker
set search_path = public, extensions, pg_temp
set pg_trgm.word_similarity_threshold = '0.4' rows 12 as $$
  select f.* from public.jp_foods f
  where f.identity_status = 'joined'
    and length(btrim(p_name_en)) between 1 and 300
    and length(p_name_ja) <= 300
    and ((p_name_ja <> '' and f.name_ja %> p_name_ja) or f.name_en %> p_name_en)
  order by greatest(word_similarity(p_name_ja,f.name_ja),word_similarity(p_name_en,f.name_en)) desc,
    f.food_number
  limit 12
$$;
revoke all on function public.search_mext_foods(text,text) from public,anon,authenticated,service_role;
grant execute on function public.search_mext_foods(text,text) to service_role;
comment on table public.jp_foods is
  'MEXT 2023 nutrient reference; 2015/2016 English identities require proved Japanese-name equivalence. No product/USDA ids.';
commit;
