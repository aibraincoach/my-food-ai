-- Owner-scoped snapshots copy stored nutrient values without another model call.
create table public.saved_meals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80), source_post_id uuid references public.posts(id) on delete set null,
 items jsonb not null, created_at timestamptz not null default now(), last_logged_at timestamptz
);
create unique index saved_meals_source on public.saved_meals(user_id,source_post_id) where source_post_id is not null;
alter table public.saved_meals enable row level security;
create policy saved_meals_owner on public.saved_meals for all using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select,insert,update,delete on public.saved_meals to authenticated;
alter table public.posts add column source_post_id uuid references public.posts(id) on delete set null;
alter table public.posts add column save_as_meal boolean not null default false;

create function public.save_meal_from_post(p_post_id uuid,p_name text) returns uuid
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

-- Internal helper is invoker-scoped and only accepts an owned saved snapshot.
create function public.copy_owned_saved_meal(p_id uuid,p_eaten_at timestamptz) returns uuid
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
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
  values(v_item,(v_n->>'calories')::numeric,(v_n->>'protein_g')::numeric,(v_n->>'carbs_g')::numeric,(v_n->>'fat_g')::numeric,(v_n->>'fibre_g')::numeric,(v_n->>'sugar_g')::numeric,(v_n->>'sodium_mg')::numeric,coalesce(v_n->'micronutrients','[]'::jsonb),v_n->>'source_ref');
 end loop;
 insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
 select auth.uid(),kind,amount,ml,label,v_post,p_eaten_at from public.intake_logs where post_id=v_saved.source_post_id and user_id=auth.uid();
 update public.saved_meals set last_logged_at=clock_timestamp() where id=p_id;
 return v_post;
end $$;

create function public.copy_owned_post(p_post_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_source public.posts; v_copy uuid; v_item uuid; v_row record;
begin
 if p_eaten_at is null or p_eaten_at>now()+interval '5 minutes' then raise exception 'Invalid time eaten' using errcode='22023'; end if;
 select * into v_source from public.posts where id=p_post_id and user_id=auth.uid() and status='ready' for update;
 if not found then raise exception 'Meal not found' using errcode='42501'; end if;
 if not exists(select 1 from public.current_post_items where post_id=p_post_id) then raise exception 'No meal items to copy' using errcode='22023'; end if;
 insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at,source_post_id)
 values(auth.uid(),v_source.caption,p_eaten_at,'ready',clock_timestamp(),p_post_id) returning id into v_copy;
 for v_row in select i.name,i.portion_grams,i.portion_text,n.* from public.current_post_items i left join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p_post_id order by i.created_at,i.id loop
  insert into public.post_items(post_id,name,portion_grams,portion_text,source) values(v_copy,v_row.name,v_row.portion_grams,v_row.portion_text,'user') returning id into v_item;
  insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref)
  values(v_item,v_row.calories,v_row.protein_g,v_row.carbs_g,v_row.fat_g,v_row.fibre_g,v_row.sugar_g,v_row.sodium_mg,v_row.micronutrients,v_row.source_ref);
 end loop;
 insert into public.intake_logs(user_id,kind,amount,ml,label,post_id,logged_at)
 select auth.uid(),kind,amount,ml,label,v_copy,p_eaten_at from public.intake_logs where post_id=p_post_id and user_id=auth.uid();
 update public.saved_meals set last_logged_at=clock_timestamp() where user_id=auth.uid() and source_post_id=p_post_id;
 return v_copy;
end $$;
-- Invoker entrypoints retain RLS checks; the narrow owned-source helpers alone
-- may initialize the server-owned marker. Neither helper accepts client nutrition.
create function public.log_saved_meal(p_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.saved_meals where id=p_id and user_id=auth.uid()) then raise exception 'Saved meal not found' using errcode='42501';end if;
 return public.copy_owned_saved_meal(p_id,p_eaten_at);
end $$;
create function public.log_post_again(p_post_id uuid,p_eaten_at timestamptz) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.posts where id=p_post_id and user_id=auth.uid() and status='ready') then raise exception 'Meal not found' using errcode='42501';end if;
 return public.copy_owned_post(p_post_id,p_eaten_at);
end $$;
revoke all on function public.copy_owned_saved_meal(uuid,timestamptz),public.copy_owned_post(uuid,timestamptz) from public,anon;
grant execute on function public.copy_owned_saved_meal(uuid,timestamptz),public.copy_owned_post(uuid,timestamptz) to authenticated;
revoke all on function public.save_meal_from_post(uuid,text),public.log_saved_meal(uuid,timestamptz),public.log_post_again(uuid,timestamptz) from public,anon;
grant execute on function public.save_meal_from_post(uuid,text),public.log_saved_meal(uuid,timestamptz),public.log_post_again(uuid,timestamptz) to authenticated;

-- Carry the composer's choice across a retryable upload and publish it atomically.
alter table public.post_upload_drafts add column save_as_meal boolean not null default false;
alter function public.publish_uploaded_post(uuid,uuid) rename to publish_uploaded_post_before_saved;
create function public.publish_uploaded_post(p_operation_id uuid,p_user_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_save boolean;
begin
 select save_as_meal into v_save from public.post_upload_drafts where id=p_operation_id and user_id=p_user_id for update;
 v_id:=public.publish_uploaded_post_before_saved(p_operation_id,p_user_id);
 update public.posts set save_as_meal=v_save where id=v_id and user_id=p_user_id;
 return v_id;
end $$;
revoke all on function public.publish_uploaded_post(uuid,uuid),public.publish_uploaded_post_before_saved(uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_uploaded_post(uuid,uuid) to service_role;

-- Only the worker may save an opted-in ready post on its owner's behalf.
create function public.save_ready_meal(p_post_id uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_post public.posts; v_id uuid; v_claims text;
begin
 select * into v_post from public.posts where id=p_post_id and save_as_meal and status='ready' for update;
 if not found then return null; end if;
 select id into v_id from public.saved_meals where source_post_id=p_post_id and user_id=v_post.user_id;
 if found then return v_id; end if;
 v_claims:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_post.user_id,'role','authenticated')::text,true);
 v_id:=public.save_meal_from_post(p_post_id,left(coalesce(nullif(v_post.caption,''),(select name from public.current_post_items where post_id=p_post_id order by created_at,id limit 1),'Meal'),80));
 perform set_config('request.jwt.claims',coalesce(v_claims,''),true);
 return v_id;
end $$;
revoke all on function public.save_ready_meal(uuid) from public,anon,authenticated;
grant execute on function public.save_ready_meal(uuid) to service_role;
