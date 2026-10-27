-- These history columns are needed now to replace only the model's current,
-- original analysis. Item editing will add its policies and view separately.
alter table public.post_items
  add column superseded_at timestamptz,
  add column supersedes uuid references public.post_items(id);

create or replace function public.persist_analysis(
  p_post_id uuid,
  p_items jsonb,
  p_summary text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_item_id uuid;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'persist_analysis: items must be an array';
  end if;
  if p_summary is null then
    raise exception 'persist_analysis: summary is required';
  end if;

  -- Serialize retries for this post, including the first-comment check.
  perform 1 from public.posts where id = p_post_id for update;
  if not found then
    raise exception 'persist_analysis: post not found';
  end if;

  -- Nutrition is deleted by its ON DELETE CASCADE foreign key. Historical
  -- versions and user/correction replacements must survive an analysis retry.
  delete from public.post_items
  where post_id = p_post_id and source = 'model'
    and supersedes is null and superseded_at is null;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or jsonb_typeof(v_item -> 'nutrition') is distinct from 'object' then
      raise exception 'persist_analysis: each item requires nutrition';
    end if;

    insert into public.post_items (
      post_id, name, portion_text, portion_grams, box, mask_path, confidence, source
    ) values (
      p_post_id, v_item ->> 'name', v_item ->> 'portion_text',
      (v_item ->> 'portion_grams')::numeric, nullif(v_item -> 'box', 'null'::jsonb),
      v_item ->> 'mask_path', (v_item ->> 'confidence')::numeric, 'model'
    ) returning id into v_item_id;

    insert into public.item_nutrition (
      post_item_id, calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g,
      sodium_mg, micronutrients, source_ref
    ) values (
      v_item_id,
      (v_item #>> '{nutrition,calories}')::numeric,
      (v_item #>> '{nutrition,protein_g}')::numeric,
      (v_item #>> '{nutrition,carbs_g}')::numeric,
      (v_item #>> '{nutrition,fat_g}')::numeric,
      (v_item #>> '{nutrition,fibre_g}')::numeric,
      (v_item #>> '{nutrition,sugar_g}')::numeric,
      (v_item #>> '{nutrition,sodium_mg}')::numeric,
      coalesce(nullif(v_item #> '{nutrition,micronutrients}', 'null'::jsonb), '[]'::jsonb),
      v_item #>> '{nutrition,source_ref}'
    );
  end loop;

  insert into public.post_comments (post_id, author, body)
  select p_post_id, 'model', p_summary
  where not exists (
    select 1 from public.post_comments where post_id = p_post_id and author = 'model'
  );

  update public.posts set status = 'ready' where id = p_post_id;
end;
$$;

-- Only the server worker can bypass row-level security through this function.
revoke all on function public.persist_analysis(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.persist_analysis(uuid, jsonb, text) to service_role;
