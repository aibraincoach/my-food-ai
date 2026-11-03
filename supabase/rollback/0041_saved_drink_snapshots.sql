-- Restore pre-snapshot save/copy functions; saved item nutrition is retained.
begin;
create or replace function public.save_meal_from_post(p_post_id uuid,p_name text) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_post public.posts; v_items jsonb; v_id uuid;
begin
 select * into v_post from public.posts where id=p_post_id and user_id=auth.uid() and status='ready' for update;
 if not found then raise exception 'Meal not found' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('name',i.name,'portion_grams',i.portion_grams,'portion_text',i.portion_text,'nutrition',to_jsonb(n)-'post_item_id') order by i.created_at,i.id)
 into v_items from public.current_post_items i left join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p_post_id;
 if v_items is null then raise exception 'No meal items to save' using errcode='22023'; end if;
 insert into public.saved_meals(user_id,name,source_post_id,items) values(auth.uid(),p_name,p_post_id,v_items)
 on conflict(user_id,source_post_id) where source_post_id is not null do update set name=excluded.name,items=excluded.items returning id into v_id;
 return v_id;
end $$;

create or replace function public.copy_owned_saved_meal(p_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_saved public.saved_meals; v_post uuid; v_item uuid; v_row jsonb; v_n jsonb;
begin
 if p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid time eaten' using errcode='22023'; end if;
 select * into v_saved from public.saved_meals where id=p_id and user_id=auth.uid() for update;
 if not found then raise exception 'Saved meal not found' using errcode='42501'; end if;
 insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at,source_post_id)
 values(auth.uid(),v_saved.name,p_eaten_at,'ready',clock_timestamp(),v_saved.source_post_id) returning id into v_post;
 for v_row in select value from jsonb_array_elements(v_saved.items) loop
  insert into public.post_items(post_id,name,portion_grams,portion_text,source)
  values(v_post,v_row->>'name',(v_row->>'portion_grams')::numeric,v_row->>'portion_text','user') returning id into v_item;
  v_n:=v_row->'nutrition';
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)
  values(v_item,(v_n->>'calories')::numeric,(v_n->>'protein_g')::numeric,(v_n->>'carbs_g')::numeric,(v_n->>'fat_g')::numeric,(v_n->>'fibre_g')::numeric,(v_n->>'sugar_g')::numeric,(v_n->>'sodium_mg')::numeric,coalesce(v_n->'micronutrients','[]'::jsonb),v_n->>'source_ref',v_n->>'food_category');
 end loop;
 insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
 select auth.uid(),kind,amount,ml,label,v_post,p_eaten_at from public.intake_logs where post_id=v_saved.source_post_id and user_id=auth.uid() and source='sheet';
 update public.saved_meals set last_logged_at=clock_timestamp() where id=p_id;
 -- A retryable hydration/card repair is committed with the copy. Losing the
 -- following HTTP response or sync call cannot strand a successful meal copy.
 insert into public.jobs(post_id,kind,priority,status,payload)
 values(v_post,'recompute',100,'queued','{"reason":"drink_sync"}'::jsonb);
 return v_post;
end $$;
alter table public.saved_meals drop column drinks;
commit;
