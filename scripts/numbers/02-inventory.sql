with items as (
  select p.id as post_id, p.source_post_id, i.id as item_id, i.source as item_source, i.gtin,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g, n.source_ref,
         coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.posts p
  join public.post_items i on i.post_id = p.id and i.superseded_at is null
  left join public.item_nutrition n on n.post_item_id = i.id
  where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
), labelled as (
  select *,
    case
      when not has_row then '9 no nutrition row'
      when source_ref like 'unavailable:%' then '5 unavailable (' || split_part(source_ref, ':', 2) || ')'
      when source_ref is null and (calories is null or protein_g is null or carbs_g is null or fat_g is null) then '5 unavailable (no reason stored)'
      when source_ref like 'estimate:%' or micro @> '[{"approximation":{"kind":"estimate"}}]' then '4 model estimate'
      when source_ref = '0' and micro @> '[{"approximation":{"kind":"closest"}}]' then '3 rice-and-protein blend'
      when source_ref ~ '^[0-9]+$' and micro @> '[{"approximation":{"kind":"closest"}}]' then '2 closest USDA record'
      when source_ref like 'barcode-own:%' then '6 barcode (own product values)'
      when source_ref like 'barcode:%' then '6 barcode (nutrition source not recorded)'
      when source_ref like 'off:%' then '6 barcode (Open Food Facts)'
      when source_ref = 'label' or source_ref like 'label:%' then '6 nutrition label'
      when source_ref like 'user:photo-drink:%' then '6 drink photo reading'
      when source_ref ~ '^[1-9][0-9]*$' and gtin is not null then '6 barcode (USDA branded record)'
      when source_ref ~ '^[1-9][0-9]*$' then '1 matched USDA record'
      else '8 other (' || coalesce(left(source_ref, 20), 'null source_ref, numbers present') || ')'
    end as label
  from items
), posts as (
  select p.id, p.source_post_id, exists (select 1 from public.post_items i where i.post_id = p.id and i.superseded_at is null) as has_items
  from public.posts p where p.user_id = :'uid'::uuid and p.status = 'ready' and p.deleted_at is null
)
select section, label, n from (
  select 1 as ord, 'posts' as section, 'ready posts' as label, count(*) as n from posts
  union all select 2, 'posts', 'ready posts with no current item', count(*) from posts where not has_items
  union all select 3, 'posts', 'ready posts copied from an earlier meal (source_post_id set)', count(*) from posts where source_post_id is not null
  union all select 4, 'posts', 'posts in another state: ' || p.status, count(*) from public.posts p
            where p.user_id = :'uid'::uuid and p.deleted_at is null and p.status <> 'ready' group by p.status
  union all select 5, 'items', 'current items on ready posts', count(*) from labelled
  union all select 6, 'items', 'current items entered or edited by the user (source = user)', count(*) from labelled where item_source = 'user'
  union all select 7, 'items', 'current items on copied posts (numbers copied from an earlier meal)', count(*) from labelled where source_post_id is not null
  union all select 8, 'source', label, count(*) from labelled group by label
) s
order by ord, label;
