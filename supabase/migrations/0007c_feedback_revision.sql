-- Feedback approves the immutable analysis actually displayed to the user.
alter table public.post_feedback add column model_comment_id uuid references public.post_comments(id) on delete set null;
drop policy post_feedback_owner_all on public.post_feedback;
create policy post_feedback_owner_all on public.post_feedback for all
using (auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid()))
with check (auth.uid()=user_id and exists(select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid())
 and exists(select 1 from public.post_comments c where c.id=model_comment_id and c.post_id=post_feedback.post_id and c.author='model'));

-- Manual edits can change items without appending a model reply. Bind the vote
-- to both identities, and serialize writes with the owned post lock.
alter table public.post_feedback add column item_fingerprint text;
create function public.feedback_revision(p_post_id uuid) returns jsonb
language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('modelCommentId',(select c.id from public.post_comments c where c.post_id=p.id and c.author='model' order by c.created_at desc,c.id desc limit 1),
 'fingerprint',md5(coalesce((select jsonb_agg(jsonb_build_array(i.id,i.name,i.portion_text,i.portion_grams,to_jsonb(n)-'id'-'created_at') order by i.id)::text
 from public.current_post_items i left join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p.id),'[]')))
 from public.posts p where p.id=p_post_id
$$;
revoke all on function public.feedback_revision(uuid) from public,anon;
grant execute on function public.feedback_revision(uuid) to authenticated,service_role;
create function public.lock_feedback_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare p uuid;
begin
 if tg_table_name='post_items' then p:=coalesce(new.post_id,old.post_id);
 else select post_id into p from public.post_items where id=coalesce(new.post_item_id,old.post_item_id);end if;
 perform 1 from public.posts where id=p for update;
 if tg_op='DELETE' then return old;else return new;end if;
end $$;
revoke all on function public.lock_feedback_revision() from public,anon,authenticated;
create trigger lock_item_feedback_revision before insert or update or delete on public.post_items for each row execute function public.lock_feedback_revision();
create trigger lock_nutrition_feedback_revision before insert or update or delete on public.item_nutrition for each row execute function public.lock_feedback_revision();
create function public.save_revision_feedback(p_post_id uuid,p_model_comment_id uuid,p_fingerprint text,p_verdict text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare revision jsonb;
begin
 perform 1 from public.posts where id=p_post_id and user_id=auth.uid() for update;
 if not found then raise exception 'Meal not found' using errcode='42501';end if;
 if p_verdict not in ('up','down') or p_verdict is null then raise exception 'Invalid verdict' using errcode='22023';end if;
 if not exists(select 1 from public.post_comments where id=p_model_comment_id and post_id=p_post_id and author='model') then raise exception 'Invalid model revision' using errcode='22023';end if;
 revision:=public.feedback_revision(p_post_id);
 if p_fingerprint is null or revision->>'fingerprint' is distinct from p_fingerprint then raise exception 'Meal changed before feedback' using errcode='40001';end if;
 insert into public.post_feedback(post_id,user_id,verdict,model_comment_id,item_fingerprint)
 values(p_post_id,auth.uid(),p_verdict,p_model_comment_id,p_fingerprint)
 on conflict(post_id,user_id) do update set verdict=excluded.verdict,model_comment_id=excluded.model_comment_id,item_fingerprint=excluded.item_fingerprint;
end $$;
revoke all on function public.save_revision_feedback(uuid,uuid,text,text) from public,anon;
grant execute on function public.save_revision_feedback(uuid,uuid,text,text) to authenticated;
revoke insert,update,delete on public.post_feedback from authenticated;
