-- A stale fingerprint is a deterministic conflict, not a transaction failure.
-- PostgREST 14 retries SQLSTATE 40001 indefinitely; PT409 returns HTTP 409.
create or replace function public.save_revision_feedback(p_post_id uuid,p_model_comment_id uuid,p_fingerprint text,p_verdict text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare revision jsonb;
begin
 perform 1 from public.posts where id=p_post_id and user_id=auth.uid() for update;
 if not found then raise exception 'Meal not found' using errcode='42501';end if;
 if p_verdict not in ('up','down') or p_verdict is null then raise exception 'Invalid verdict' using errcode='22023';end if;
 if not exists(select 1 from public.post_comments where id=p_model_comment_id and post_id=p_post_id and author='model') then raise exception 'Invalid model revision' using errcode='22023';end if;
 revision:=public.feedback_revision(p_post_id);
 if p_fingerprint is null or revision->>'fingerprint' is distinct from p_fingerprint then raise exception 'Meal changed before feedback' using errcode='PT409';end if;
 insert into public.post_feedback(post_id,user_id,verdict,model_comment_id,item_fingerprint)
 values(p_post_id,auth.uid(),p_verdict,p_model_comment_id,p_fingerprint)
 on conflict(post_id,user_id) do update set verdict=excluded.verdict,model_comment_id=excluded.model_comment_id,item_fingerprint=excluded.item_fingerprint;
end $$;
